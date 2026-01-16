import * as React from "react";
import "./Bulk.css";

// ✅ Reusa tus servicios EXISTENTES (los mismos que ya usas en envío 1:1)
import { useDocusignTemplates } from "../../../../Funcionalidades/GD/Docusign";
import { generateCsvForTemplate } from "../../../../Funcionalidades/GD/Bulk";
import { exportRowsToCsv } from "../../../../utils/csv";

import {
  createEnvelopeFromTemplateDraft,
  getEnvelopeDocumentTabs,
  getEnvelopeDocGenFormFields,
  updateEnvelopePrefillTextTabs,
  updateEnvelopeDocGenFormFields,
  sendEnvelope,
} from "../../../../Services/DocusignAPI.service";
import type { DocGenUpdateDocPayload, UpdatePrefillTextTabPayload } from "../../../../models/Docusign";

type Row = Record<string, string>;

type BulkResultRow = {
  referenceId: string;
  envelopeId?: string;
  status: "SENT" | "FAILED";
  error?: string;
};

function normKey(s: string) {
  return (s ?? "").trim().toLowerCase();
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
  if (columns.includes("ReferenceId")) r["ReferenceId"] = "ROW-001";
  return r;
}

async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency = 2
): Promise<R[]> {
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

/**
 * Construye pares tabLabel/value desde la fila del grid.
 * Asume convención: el tabLabel en DocuSign coincide con el nombre de la columna.
 * (ReferenceId se omite)
 */
function buildTextTabPairsFromRow(columns: string[], row: Row) {
  const skip = new Set(["ReferenceId"]);
  return columns
    .filter((c) => !skip.has(c))
    .map((c) => ({ tabLabel: c, value: getCell(row, c) }))
    .filter((x) => (x.value ?? "").toString().trim().length > 0);
}

/**
 * ENVÍA 1 SOBRE usando el mismo flujo del envío individual:
 * - crear draft desde plantilla con templateRoles (firma asignada)
 * - prefill tabs (documentId "1")
 * - docGen form fields (si aplica)
 * - enviar
 */
async function sendSingleFromRow(params: {
  templateId: string;
  templateName: string;
  columns: string[];
  row: Row;
  index: number;
}): Promise<BulkResultRow> {
  const { templateId, templateName, columns, row, index } = params;

  const referenceId = safeRef(row, index);

  try {
    // ✅ columnas mínimas para destinatario
    const signerName = must(row, "COLABORADOR_Name");
    const signerEmail = must(row, "COLABORADOR_Email");

    // 1) Crear draft desde plantilla (rol debe coincidir con tu plantilla)
    const draft = await createEnvelopeFromTemplateDraft({
      templateId,
      emailSubject: `Firma de documento - ${templateName}`,
      emailBlurb: "Por favor revisa y firma.",
      roles: [
        {
          roleName: "COLABORADOR", // ⚠️ debe coincidir con tu template
          name: signerName,
          email: signerEmail,
        },
      ],
    });

    const envelopeId = draft.envelopeId;

    // 2) Prefill tabs (documentId "1")
    const docTabs = await getEnvelopeDocumentTabs(envelopeId, "1");
    const prefillTextTabs = docTabs.prefillTabs?.textTabs ?? [];

    const pairs = buildTextTabPairsFromRow(columns, row);

    const prefillUpdates: UpdatePrefillTextTabPayload[] = prefillTextTabs
      .map((t) => {
        if (!t.tabId) return null;

        const match = pairs.find(
          (p) => normKey(p.tabLabel) === normKey(t.tabLabel ?? "")
        );
        if (!match) return null;

        return { tabId: t.tabId, value: match.value };
      })
      .filter(Boolean) as UpdatePrefillTextTabPayload[];

    if (prefillUpdates.length) {
      await updateEnvelopePrefillTextTabs(envelopeId, "1", prefillUpdates);
    }

    // 3) DocGen fields (si aplica)
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

    // 4) Enviar
    await sendEnvelope(envelopeId);

    return { referenceId, envelopeId, status: "SENT" };
  } catch (e: any) {
    return { referenceId, status: "FAILED", error: e?.message ?? "Error" };
  }
}

/** =========================
 * GRID editable (tipo Excel)
 * ========================= */
export function BulkGrid(props: {
  columns: string[];
  rows: Row[];
  onRowsChange: (rows: Row[]) => void;
}) {
  const { columns, rows, onRowsChange } = props;

  const addRow = () => {
    const next = [...rows, makeEmptyRow(columns, rows.length + 1)];
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
              {columns.map((c, i) => (
                <th
                  key={c}
                  className={[
                    "bulk-grid__th",
                    i === 0 ? "sticky-left" : "",
                    i === 1 ? "sticky-left-2" : "",
                  ].join(" ")}
                >
                  {c}
                </th>
              ))}
              <th className="bulk-grid__th">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => (
              <tr className="bulk-grid__tr" key={idx}>
                {columns.map((col, i) => (
                  <td
                    key={col}
                    className={[
                      "bulk-grid__td",
                      i === 0 ? "sticky-left" : "",
                      i === 1 ? "sticky-left-2" : "",
                    ].join(" ")}
                  >
                    <input
                      className="bulk-grid__cell"
                      value={row[col] ?? ""}
                      onChange={(e) => setCell(idx, col, e.target.value)}
                      disabled={col === "ReferenceId"}
                      placeholder={col === "ReferenceId" ? "" : col}
                    />
                  </td>
                ))}

                <td className="bulk-grid__td">
                  <div className="bulk-grid__actions">
                    <button
                      type="button"
                      className="bulk-grid__btn bulk-grid__btn--danger"
                      onClick={() => removeRow(idx)}
                    >
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
 * UI principal (Opción B)
 * ========================= */
export const EnvioMasivoUI: React.FC = () => {
  const { templatesOptions, createdraft, getRecipients } = useDocusignTemplates();

  const [templateId, setTemplateId] = React.useState("");
  const [columns, setColumns] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [sending, setSending] = React.useState(false);
  const [bulkResults, setBulkResults] = React.useState<BulkResultRow[]>([]);

  const plantillaSelected = templatesOptions.find((o) => o.value === templateId) ?? null;
  const gridReady = columns.length > 0;

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

      setColumns(build.headers);
      setRows([makeFirstRow(build.headers)]);
      setBulkResults([]);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error generando tabla");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!columns.length) return alert("Primero genera la tabla");
    const safeName = (plantillaSelected?.label ?? "Template")
      .replace(/[^\w\- ]/g, "")
      .replace(/\s+/g, "_");
    exportRowsToCsv(columns, rows, `Bulk_${safeName}.csv`);
  };

  const handleReset = () => {
    setTemplateId("");
    setColumns([]);
    setRows([]);
    setBulkResults([]);
  };

  const handleSendMasivoOpcionB = async () => {
    if (!templateId) return alert("Selecciona una plantilla.");
    if (!rows.length || !columns.length) return alert("Primero genera la tabla y agrega filas.");

    setSending(true);
    setBulkResults([]);

    try {
      // asegúrate que ReferenceId exista en todas
      const normalizedRows = rows.map((r, i) => {
        const ref = safeRef(r, i);
        return { ...r, ReferenceId: ref };
      });
      setRows(normalizedRows);

      const templateName = plantillaSelected?.label ?? "Template";

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

          // Actualiza resultados en tiempo real
          setBulkResults((prev) => {
            // evita duplicados por ref (por si reintentas)
            const next = prev.filter((p) => p.referenceId !== res.referenceId);
            next.push(res);
            return next;
          });

          // ✅ Aquí luego conectas guardado en SharePoint usando tu servicio Envios
          // if (res.status === "SENT" && res.envelopeId) {
          //   await Envios.add({ Title: templateName, Receptor: ..., Cedula: ..., CorreoReceptor: ..., IdSobre: res.envelopeId, Estado: "Enviado" })
          // }

          return res;
        },
        2 // concurrencia (2 recomendado)
      );

      bulkResults.filter((x) => x.status === "SENT").length;
      alert(`Proceso finalizado.`);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error enviando masivo");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ef-page bulk-send">
      {/* PANEL inicial (se esconde cuando hay grid) */}
      {!gridReady && (
        <div className="ef-card bulk-panel">
          <div className="bulk-panel__field">
            <label className="ef-label" htmlFor="bulk-template">
              Plantilla
            </label>

            <select
              id="bulk-template"
              className="ef-input"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              disabled={loading || sending}
            >
              <option value="">Selecciona una plantilla</option>
              {templatesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bulk-panel__actions">
            <button
              type="button"
              className="btn btn-primary-final btn-xs"
              disabled={!templateId || loading || sending}
              onClick={handleGenerateGrid}
            >
              {loading ? "Generando..." : "Generar tabla"}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-xs"
              disabled={!templateId || loading || sending}
              onClick={async () => {
                try {
                  setLoading(true);
                  const build = await generateCsvForTemplate({
                    templateId,
                    templateName: plantillaSelected?.label ?? "template",
                    createdraft,
                    getRecipients,
                  });

                  const safeName = (plantillaSelected?.label ?? "Template")
                    .replace(/[^\w\- ]/g, "")
                    .replace(/\s+/g, "_");

                  exportRowsToCsv(build.headers, [makeFirstRow(build.headers)], `Bulk_${safeName}.csv`);
                } catch (e) {
                  console.error(e);
                  alert(e instanceof Error ? e.message : "Error descargando CSV");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Cargando..." : "Descargar CSV"}
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

              <button type="button" className="btn btn-secondary btn-xs" onClick={handleDownloadCsv} disabled={loading || sending || !rows.length}>
                Descargar CSV
              </button>

              <button type="button" className="btn btn-primary-final btn-xs" onClick={handleSendMasivoOpcionB} disabled={loading || sending || !rows.length}>
                {sending ? "Enviando..." : "Enviar masivo"}
              </button>
            </div>
          </div>

          <div className="bulk-main">
            <div className="bulk-card bulk-grid-host">
              <BulkGrid columns={columns} rows={rows} onRowsChange={setRows} />
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
