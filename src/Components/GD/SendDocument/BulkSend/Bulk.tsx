import * as React from "react";
import * as XLSX from "xlsx";
import "./Bulk.css";

import { useDocusignTemplates } from "../../../../Funcionalidades/GD/Docusign";
import { generateCsvForTemplate } from "../../../../Funcionalidades/GD/Bulk";
import {createEnvelopeFromTemplateDraft, getEnvelopeDocumentTabs, getEnvelopeDocGenFormFields, updateEnvelopePrefillTextTabs, updateEnvelopeDocGenFormFields, sendEnvelope,} from "../../../../Services/DocusignAPI.service";
import type { DocGenUpdateDocPayload, UpdatePrefillTextTabPayload } from "../../../../models/Docusign";
import { useGraphServices } from "../../../../graph/graphContext";
import type { EnviosService } from "../../../../Services/Envios.service";
import { useAuth } from "../../../../auth/authProvider";
import type { AccountInfo } from "@azure/msal-browser";
import { useEmpresasSelect } from "../../../../Funcionalidades/Desplegables";
import type { maestro } from "../../../../models/Desplegables";

type Row = Record<string, string>;

type BulkResultRow = {
  referenceId: string;
  envelopeId?: string;
  status: "SENT" | "FAILED";
  error?: string;
};

const COMPANY_COL_KEY = "empresa";

function normKey(s: string) {
  return (s ?? "").trim().toLowerCase();
}

function headerAliasKey(s: string) {
  const nk = normKey(s);
  // aliases para empresa
  if (nk === "compañía" || nk === "compania" || nk === "company") return normKey(COMPANY_COL_KEY);
  return nk;
}

function getCell(row: Row, key: string) {
  const k = normKey(key);
  const found = Object.keys(row).find((x) => normKey(x) === k);
  return found ? (row[found] ?? "") : "";
}

function must(row: Row, key: string) {
  const v = getCell(row, key);
  if (!v) throw new Error(`Falta columna/valor requerido: ${key}`);
  return v;
}

function safeRef(row: Row, index: number) {
  return getCell(row, "ReferenceId") || `ROW-${String(index + 1).padStart(3, "0")}`;
}

function makeEmptyRow(columns: string[], index: number) {
  const r: Row = {};
  for (const c of columns) r[c] = "";
  r["ReferenceId"] = `ROW-${String(index).padStart(3, "0")}`;
  return r;
}

function makeFirstRow(columns: string[]) {
  const r: Row = {};
  for (const c of columns) r[c] = "";
  if (columns.some((c) => normKey(c) === normKey("ReferenceId"))) r["ReferenceId"] = "ROW-001";
  return r;
}

async function runWithConcurrency<T, R>(items: T[], worker: (item: T, index: number) => Promise<R>, concurrency = 2): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;

  async function runner() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runner));
  return results;
}

function buildTextTabPairsFromRow(columns: string[], row: Row) {
  const skip = new Set(["ReferenceId"]);
  return columns
    .filter((c) => !skip.has(c))
    .map((c) => ({ tabLabel: c, value: getCell(row, c) }))
    .filter((x) => (x.value ?? "").toString().trim().length > 0);
}

async function sendSingleFromRow(params: {templateId: string; templateName: string; columns: string[]; row: Row; index: number;}): Promise<BulkResultRow> {
  const { templateId, columns, row, index } = params;
  const referenceId = safeRef(row, index);

  try {
    const signerName = must(row, "COLABORADOR_Name");
    const signerEmail = must(row, "COLABORADOR_Email");

    const draft = await createEnvelopeFromTemplateDraft({
      templateId,
      emailBlurb: "Por favor revisa y firma.",
      roles: [
        {
          roleName: "COLABORADOR",
          name: signerName,
          email: signerEmail,
        },
      ],
    });

    const envelopeId = draft.envelopeId;

    const docTabs = await getEnvelopeDocumentTabs(envelopeId, "1");
    const prefillTextTabs = docTabs.prefillTabs?.textTabs ?? [];

    const pairs = buildTextTabPairsFromRow(columns, row);

    const prefillUpdates: UpdatePrefillTextTabPayload[] = prefillTextTabs
      .map((t) => {
        if (!t.tabId) return null;
        const match = pairs.find((p) => normKey(p.tabLabel) === normKey(t.tabLabel ?? ""));
        if (!match) return null;
        return { tabId: t.tabId, value: match.value };
      })
      .filter(Boolean) as UpdatePrefillTextTabPayload[];

    if (prefillUpdates.length) {
      await updateEnvelopePrefillTextTabs(envelopeId, "1", prefillUpdates);
    }

    const docGen = await getEnvelopeDocGenFormFields(envelopeId);
    const firstDoc = docGen.docGenFormFields?.[0];

    if (firstDoc?.documentId) {
      const docGenPayload: DocGenUpdateDocPayload[] = [
        {
          documentId: firstDoc.documentId,
          fields: firstDoc.docGenFormFieldList.map((f) => {
            const value = getCell(row, f.name ?? "");
            return { name: f.name, value };
          }),
        },
      ];
      await updateEnvelopeDocGenFormFields(envelopeId, docGenPayload);
    }

    await sendEnvelope(envelopeId);

    return { referenceId, envelopeId, status: "SENT" };
  } catch (e: any) {
    return { referenceId, status: "FAILED", error: e?.message ?? "Error" };
  }
}

/** =========================
 * Excel: Export / Import
 * ========================= */
function exportRowsToXlsx(columns: string[], rows: Row[], fileName: string) {
  const data = rows.map((r) => {
    const obj: Record<string, any> = {};
    for (const c of columns) obj[c] = r[c] ?? "";
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(data, { header: columns });
  (ws as any)["!freeze"] = { xSplit: 0, ySplit: 1 };
  (ws as any)["!cols"] = columns.map((c) => ({ wch: Math.max(12, c.length + 2) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bulk");

  const safe = fileName.toLowerCase().endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, safe);
}

async function readExcelFile(file: File): Promise<{ headers: string[]; rows: Row[] }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  // ✅ elige la primera hoja que tenga data real
  const pickedSheet =
    wb.SheetNames.find((name) => {
      const ws = wb.Sheets[name];
      const matrix = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, blankrows: false, defval: "", raw: false });
      return matrix.length > 1 && (matrix[1] ?? []).some((c) => `${c ?? ""}`.trim().length > 0);
    }) ?? wb.SheetNames[0];

  if (!pickedSheet) return { headers: [], rows: [] };

  const ws = wb.Sheets[pickedSheet];
  if (!ws) return { headers: [], rows: [] };

  const matrix = XLSX.utils.sheet_to_json<any[]>(ws, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  });

  if (!matrix.length) return { headers: [], rows: [] };

  const headers = (matrix[0] as any[])
    .map((h) => (h ?? "").toString().trim())
    .filter((h) => h.length > 0);

  const rows: Row[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r] as any[];
    const hasAny = cells?.some((c) => (c ?? "").toString().trim().length > 0);
    if (!hasAny) continue;

    const obj: Row = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (cells?.[c] ?? "").toString().trim();
    }
    rows.push(obj);
  }

  return { headers, rows };
}

function alignImportedToGrid(importedHeaders: string[], importedRows: Row[], desiredColumns: string[]): { columns: string[]; rows: Row[]; warnings: string[] } {
  const warnings: string[] = [];

  // Mapa headerImport(normalizado/alias) -> header real
  const importHeaderMap = new Map<string, string>();
  for (const h of importedHeaders) importHeaderMap.set(headerAliasKey(h), h);

  // ✅ Si desiredColumns está vacío => el Excel manda
  const finalColumns = desiredColumns.length > 0 ? [...desiredColumns] : [...importedHeaders];

  // Forzar empresa siempre
  if (!finalColumns.some((h) => headerAliasKey(h) === headerAliasKey(COMPANY_COL_KEY))) {
    finalColumns.push(COMPANY_COL_KEY);
  }

  // ReferenceId siempre existe
  if (!finalColumns.some((h) => headerAliasKey(h) === headerAliasKey("ReferenceId"))) {
    finalColumns.unshift("ReferenceId");
  }

  const finalRows: Row[] = importedRows.map((r, idx) => {
    const row: Row = {};
    for (const col of finalColumns) {
      const matchHeader = importHeaderMap.get(headerAliasKey(col));
      row[col] = matchHeader ? (r[matchHeader] ?? "") : "";
    }
    row["ReferenceId"] = row["ReferenceId"] || safeRef(row, idx);
    return row;
  });

  const required = ["COLABORADOR_Name", "COLABORADOR_Email", COMPANY_COL_KEY];
  for (const req of required) {
    const has = finalColumns.some((c) => headerAliasKey(c) === headerAliasKey(req));
    if (!has) warnings.push(`Falta columna requerida en Excel: ${req}`);
  }

  return { columns: finalColumns, rows: finalRows, warnings };
}

/** =========================
 * Modal genérico
 * ========================= */
function Modal(props: {open: boolean; title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; disabledClose?: boolean;}) {
  const { open, title, onClose, children, footer, disabledClose } = props;

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disabledClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, disabledClose]);

  if (!open) return null;

  return (
    <div className="m-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => {
                                                                  if (disabledClose) return;
                                                                  if (e.target === e.currentTarget) onClose();
                                                                }}>
      <div className="m-card">
        <div className="m-header">
          <div className="m-title">{title}</div>

          <button type="button" className="btn btn-secondary btn-xs" onClick={onClose} disabled={disabledClose}>
            Cerrar
          </button>
        </div>

        {/* Body scrolleable */}
        <div className="m-body m-scroll" tabIndex={0} onWheel={(e) => e.stopPropagation()}>
          <div className="m-body-inner">{children}</div>
        </div>

        {footer && <div className="m-footer">{footer}</div>}
      </div>
    </div>
  );
}

/** =========================
 * GRID editable (tipo Excel)
 * ========================= */
export function BulkGrid(props: {columns: string[]; rows: Row[]; onRowsChange: (rows: Row[]) => void; companyOptions: maestro[];}) {
  const { columns, rows, onRowsChange, companyOptions } = props;

  const addRow = () => {
    const next = [...rows, makeEmptyRow(columns, rows.length + 1)];
    const idx = next.length - 1;
    const compKey = columns.find((c) => headerAliasKey(c) === headerAliasKey(COMPANY_COL_KEY));
    if (compKey) next[idx][compKey] = "";
    onRowsChange(next);
  };

  const removeRow = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    onRowsChange(next);
  };

  const setCell = (idx: number, col: string, value: string) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, [col]: value } : r));
    onRowsChange(next);
  };

  return (
    <div className="bulk-grid">
      <div className="bulk-grid__topbar">
        <div className="bulk-grid__left">
          <button type="button" className="bulk-grid__btn" onClick={addRow}>
            + Agregar fila
          </button>
          <div className="bulk-grid__meta">
            Filas: <b>{rows.length}</b>
          </div>
        </div>
      </div>

      <div className="bulk-grid__wrap">
        <table className="bulk-grid__table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} className="bulk-grid__th">
                  {headerAliasKey(c) === headerAliasKey(COMPANY_COL_KEY) ? "Compañía" : c}
                </th>
              ))}
              <th className="bulk-grid__th">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => (
              <tr className="bulk-grid__tr" key={idx}>
                {columns.map((col) => {
                  const isRef = headerAliasKey(col) === headerAliasKey("ReferenceId");
                  const isCompany = headerAliasKey(col) === headerAliasKey(COMPANY_COL_KEY);
                  const value = row[col] ?? "";

                  return (
                    <td key={col} className="bulk-grid__td">
                      {isCompany ? (
                        <select className="bulk-grid__cell bulk-grid__select" value={value} onChange={(e) => setCell(idx, col, e.target.value)}>
                          <option value="">Selecciona compañía</option>
                          {companyOptions.map((c) => (
                            <option key={c.T_x00ed_tulo1} value={c.T_x00ed_tulo1}>
                              {c.T_x00ed_tulo1}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input className="bulk-grid__cell" value={value} onChange={(e) => setCell(idx, col, e.target.value)} disabled={isRef} placeholder={isRef ? "" : col}/>
                      )}
                    </td>
                  );
                })}

                <td className="bulk-grid__td">
                  <div className="bulk-grid__actions">
                    <button type="button" className="bulk-grid__btn bulk-grid__btn--danger" onClick={() => removeRow(idx)}>
                      Quitar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td className="bulk-grid__empty" colSpan={columns.length + 1}>
                  Agrega una fila para empezar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** =========================
 * UI principal (con preview)
 * ========================= */
export const EnvioMasivoUI: React.FC = () => {
  const { templatesOptions, createdraft, getRecipients } = useDocusignTemplates();
  const { account } = useAuth();
  const { Envios, Maestro } = useGraphServices();
  const { items, reload } = useEmpresasSelect(Maestro);

  const [templateId, setTemplateId] = React.useState("");
  const [columns, setColumns] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [sending, setSending] = React.useState(false);
  const [bulkResults, setBulkResults] = React.useState<BulkResultRow[]>([]);

  // ✅ Modal + Preview
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadBusy, setUploadBusy] = React.useState(false);
  const [uploadInfo, setUploadInfo] = React.useState<string>("");

  const [previewCols, setPreviewCols] = React.useState<string[]>([]);
  const [previewRows, setPreviewRows] = React.useState<Row[]>([]);

  const plantillaSelected = templatesOptions.find((o) => o.value === templateId) ?? null;
  const gridReady = columns.length > 0;

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const openUpload = () => {
    setUploadOpen(true);
    setUploadFile(null);
    setUploadBusy(false);
    setUploadInfo("");
    setPreviewCols([]);
    setPreviewRows([]);
  };

  const closeUpload = () => {
    if (uploadBusy) return;
    setUploadOpen(false);
    setUploadFile(null);
    setUploadInfo("");
    setPreviewCols([]);
    setPreviewRows([]);
  };

  const handleGenerateGrid = async () => {
    if (!templateId) return alert("Selecciona una plantilla");

    setLoading(true);
    try {
      const build = await generateCsvForTemplate({
        templateId,
        templateName: plantillaSelected?.label ?? "template",
        createdraft,
        getRecipients,
      });

      const headers = [...build.headers];

      if (!headers.some((h) => headerAliasKey(h) === headerAliasKey(COMPANY_COL_KEY))) headers.push(COMPANY_COL_KEY);
      if (!headers.some((h) => headerAliasKey(h) === headerAliasKey("ReferenceId"))) headers.unshift("ReferenceId");

      const firstRow: Row = makeFirstRow(headers);
      const compKey = headers.find((h) => headerAliasKey(h) === headerAliasKey(COMPANY_COL_KEY)) ?? COMPANY_COL_KEY;
      firstRow[compKey] = "";

      setColumns(headers);
      setRows([firstRow]);
      setBulkResults([]);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error generando tabla");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!columns.length) return alert("Primero genera la tabla");
    const safeName = (plantillaSelected?.label ?? "Template").replace(/[^\w\- ]/g, "").replace(/\s+/g, "_");
    exportRowsToXlsx(columns, rows, `Bulk_${safeName}.xlsx`);
  };

  const handleReset = () => {
    setTemplateId("");
    setColumns([]);
    setRows([]);
    setBulkResults([]);
    closeUpload();
  };

  const validateRowsBeforeSend = (rowsToValidate: Row[], headers: string[]) => {
    const compHeader = headers.find((h) => headerAliasKey(h) === headerAliasKey(COMPANY_COL_KEY)) ?? COMPANY_COL_KEY;

    for (let i = 0; i < rowsToValidate.length; i++) {
      const ref = safeRef(rowsToValidate[i], i);
      const comp = getCell(rowsToValidate[i], compHeader).trim();
      if (!comp) {
        alert(`Falta "compañía" en la fila ${i + 1} (${ref}).`);
        return false;
      }
    }
    return true;
  };

  // ✅ Lee el excel y SOLO genera preview (no toca el grid)
  const buildPreviewFromExcel = async (file: File) => {
    setUploadBusy(true);
    setUploadInfo("");
    setPreviewCols([]);
    setPreviewRows([]);

    try {
      const { headers: importedHeaders, rows: importedRows } = await readExcelFile(file);

      if (!importedHeaders.length) {
        setUploadInfo("El Excel no tiene encabezados en la primera fila.");
        return;
      }
      if (!importedRows.length) {
        setUploadInfo("El Excel no tiene filas con datos.");
        return;
      }

      // ✅ Preview: el Excel manda
      const aligned = alignImportedToGrid(importedHeaders, importedRows, []);
      setPreviewCols(aligned.columns);
      setPreviewRows(aligned.rows);

      const warnTxt = aligned.warnings.length ? ` • Avisos: ${aligned.warnings.join(" | ")}` : "";
      setUploadInfo(`Cargado: ${aligned.rows.length} filas • ${aligned.columns.length} columnas${warnTxt}`);
    } catch (e: any) {
      console.error(e);
      setUploadInfo(e?.message ?? "Error leyendo el Excel");
    } finally {
      setUploadBusy(false);
    }
  };

  // ✅ Aplica lo previsualizado al grid real
  const applyPreviewToGrid = () => {
    if (!previewCols.length || !previewRows.length) return;
    setColumns(previewCols);
    setRows(previewRows);
    setBulkResults([]);
    closeUpload();
  };

  const handleSendMasivoOpcionB = async (envios: EnviosService, account: AccountInfo | null) => {
    if (!templateId) return alert("Selecciona una plantilla.");
    if (!rows.length || !columns.length) return alert("Primero genera la tabla y agrega filas.");
    if (!validateRowsBeforeSend(rows, columns)) return;

    setSending(true);
    setBulkResults([]);

    try {
      const normalizedRows = rows.map((r, i) => {
        const ref = safeRef(r, i);
        return { ...r, ReferenceId: ref };
      });
      setRows(normalizedRows);

      const templateName = plantillaSelected?.label ?? "Template";
      const compHeader = columns.find((h) => headerAliasKey(h) === headerAliasKey(COMPANY_COL_KEY)) ?? COMPANY_COL_KEY;

      await runWithConcurrency(
        normalizedRows,
        async (row, idx) => {
          const res = await sendSingleFromRow({
            templateId,
            templateName,
            columns,
            row,
            index: idx,
          });

          setBulkResults((prev) => {
            const next = prev.filter((p) => p.referenceId !== res.referenceId);
            next.push(res);
            return next;
          });

          if (res.status === "SENT" && res.envelopeId) {
            const nombre = must(row, "nombre");
            const cedula = must(row, "numeroDoc");
            const compania = must(row, compHeader);
            const correo = must(row, "COLABORADOR_Email");

            await envios.create({
              Cedula: cedula,
              Compa_x00f1_ia: compania,
              CorreoReceptor: correo,
              Datos: "",
              EnviadoPor: account?.name ?? "",
              Estado: "Enviado",
              Fechadeenvio: new Date().toISOString(),
              Fuente: "Masiva",
              ID_Novedad: "",
              IdSobre: res.envelopeId,
              Receptor: nombre.toUpperCase(),
              Recipients: "",
              Title: templateName,
            });
          }

          return res;
        },
        2
      );

      alert("Proceso finalizado.");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error enviando masivo");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ef-page bulk-send">
      {/* MODAL: Cargar Excel (con preview) */}
      <Modal open={uploadOpen} title="Cargar Excel (.xlsx) - Previsualización" onClose={closeUpload} disabledClose={uploadBusy} footer={
          <>
            <button type="button" className="btn btn-secondary btn-xs" disabled={uploadBusy} onClick={closeUpload}>
              Cancelar
            </button>

            <button type="button" className="btn btn-primary-final btn-xs" disabled={uploadBusy || previewRows.length === 0} onClick={applyPreviewToGrid}>Continuar</button>
          </>
        }>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ color: "var(--muted, #64748b)", fontSize: 13 }}>
            Tip: usa el Excel descargado desde la app para que las columnas coincidan.
          </div>

          <input type="file" accept=".xlsx,.xls" disabled={uploadBusy || sending || loading} onChange={async (e) => {
                                                                                                        const f = e.target.files?.[0] ?? null;
                                                                                                        e.currentTarget.value = "";
                                                                                                        setUploadFile(f);
                                                                                                        setUploadInfo("");
                                                                                                        setPreviewCols([]);
                                                                                                        setPreviewRows([]);

                                                                                                        if (!f) return;
                                                                                                        await buildPreviewFromExcel(f);
                                                                                                      }}/>

          {uploadFile && (
            <div style={{ fontSize: 13 }}>Archivo: <b>{uploadFile.name}</b> • {(uploadFile.size / 1024).toFixed(1)} KB</div>
          )}

          {uploadInfo && (
            <div style={{
                fontSize: 13,
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--border, #e5e7eb)",
                background: "rgba(2,6,23,.03)",
              }}>
              {uploadInfo}
            </div>
          )}

          {/* ✅ PREVIEW TABLE */}
          {previewRows.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 13, marginBottom: 8, color: "var(--muted, #64748b)" }}>
                Previsualización (primeras {Math.min(10, previewRows.length)} filas)
              </div>

              <div style={{ overflow: "auto", border: "1px solid var(--border, #e5e7eb)", borderRadius: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {previewCols.map((c) => (
                        <th key={c} style={{
                                      textAlign: "left",
                                      padding: "10px 10px",
                                      borderBottom: "1px solid var(--border, #e5e7eb)",
                                      background: "rgba(2,6,23,.03)",
                                      whiteSpace: "nowrap",
                                    }}>
                          {headerAliasKey(c) === headerAliasKey(COMPANY_COL_KEY) ? "Compañía" : c}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {previewRows.slice(0, 10).map((r, idx) => (
                      <tr key={idx}>
                        {previewCols.map((c) => (
                          <td key={c} title={r[c] ?? ""} style={{
                              padding: "8px 10px",
                              borderBottom: "1px solid var(--border, #e5e7eb)",
                              whiteSpace: "nowrap",
                              maxWidth: 260,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                            {r[c] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* PANEL inicial */}
      {!gridReady && (
        <div className="ef-card bulk-panel">
          <div className="bulk-panel__field">
            <label className="ef-label" htmlFor="bulk-template">
              Plantilla
            </label>

            <select id="bulk-template" className="ef-input" value={templateId} onChange={(e) => setTemplateId(e.target.value)} disabled={loading || sending}>
              <option value="">Selecciona una plantilla</option>
              {templatesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bulk-panel__actions" style={{ gap: 10, display: "flex", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary-final btn-xs" disabled={!templateId || loading || sending} onClick={handleGenerateGrid}>
              {loading ? "Generando..." : "Generar tabla"}
            </button>

            <button type="button" className="btn btn-secondary btn-xs" disabled={loading || sending} onClick={openUpload}>
              Cargar Excel
            </button>
          </div>
        </div>
      )}

      {/* TOOLBAR + MAIN */}
      {gridReady && (
        <>
          <div className="bulk-toolbar">
            <div className="bulk-toolbar__left">
              <div className="bulk-toolbar__title">{plantillaSelected?.label ?? "Envío masivo"}</div>
              <div className="bulk-toolbar__meta">
                Filas: <b>{rows.length}</b> • Resultados: <b>{bulkResults.length}</b>
              </div>
            </div>

            <div className="bulk-toolbar__right">
              <button type="button" className="btn btn-secondary btn-xs" onClick={handleReset} disabled={loading || sending}>
                Cambiar plantilla
              </button>

              <button type="button" className="btn btn-secondary btn-xs" onClick={openUpload} disabled={loading || sending}>
                Cargar Excel
              </button>

              <button type="button" className="btn btn-secondary btn-xs" onClick={handleDownloadExcel} disabled={loading || sending || !rows.length}>
                Descargar Excel
              </button>

              <button type="button" className="btn btn-primary-final btn-xs" onClick={() => handleSendMasivoOpcionB(Envios, account)} disabled={loading || sending || !rows.length}>
                {sending ? "Enviando..." : "Enviar masivo"}
              </button>
            </div>
          </div>

          <div className="bulk-main">
            <div className="bulk-card bulk-grid-host">
              <BulkGrid columns={columns} rows={rows} onRowsChange={setRows} companyOptions={items} />
            </div>

            <div className="bulk-card bulk-results">
              <div className="bulk-results__title">Resultados</div>

              {bulkResults.length === 0 ? (
                <div className="bulk-results__empty">Aún no hay resultados. Envía el masivo para verlos.</div>
              ) : (
                <div className="bulk-results__wrap">
                  <table className="bulk-results__table">
                    <thead>
                      <tr className="bulk-results__tr">
                        <th className="bulk-results__th">ReferenceId</th>
                        <th className="bulk-results__th">EnvelopeId</th>
                        <th className="bulk-results__th">Estado</th>
                        <th className="bulk-results__th">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResults.map((r) => (
                        <tr className="bulk-results__tr" key={r.referenceId}>
                          <td className="bulk-results__td">{r.referenceId}</td>
                          <td className="bulk-results__td">{r.envelopeId ?? "-"}</td>
                          <td className="bulk-results__td">{r.status}</td>
                          <td className="bulk-results__td">{r.error ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EnvioMasivoUI;
