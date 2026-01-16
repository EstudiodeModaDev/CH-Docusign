import React from "react";
import { useDocusignTemplates } from "../../../../Funcionalidades/GD/Docusign";
import { buildBulkCopiesFromGrid, generateCsvForTemplate } from "../../../../Funcionalidades/GD/Bulk";
import { exportRowsToCsv } from "../../../../utils/csv";
import "./Bulk.css"
import { createBulkSendList, createBulkSendRequest, getBulkSendBatchEnvelopes } from "../../../../Services/DocusignAPI.service";

type Row = Record<string, string>;

function makeEmptyRow(columns: string[], index: number) {
  const r: Row = {};
  for (const c of columns) r[c] = "";
  r["ReferenceId"] = `ROW-${String(index).padStart(3, "0")}`;
  return r;
}

export function BulkGrid(props: {columns: string[]; rows: Row[]; onRowsChange: (rows: Row[]) => void;}) {
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
    <div style={{ overflow: "auto", border: "1px solid var(--border,#e5e7eb)", borderRadius: 12 }}>
      <div style={{ display: "flex", gap: 8, padding: 10 }}>
        <button type="button" className="btn btn-primary-final btn-xs" onClick={addRow}>
          + Agregar fila
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} style={{
                  position: "sticky",
                  top: 0,
                  background: "var(--surface,#fff)",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--border,#e5e7eb)",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}>
                {c}
              </th>
            ))}
            <th style={{
                  position: "sticky",
                  top: 0,
                  background: "var(--surface,#fff)",
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--border,#e5e7eb)",}}>
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={col} style={{ borderBottom: "1px solid var(--border,#e5e7eb)" }}>
                  <input value={row[col] ?? ""} onChange={(e) => setCell(idx, col, e.target.value)} disabled={col === "ReferenceId"} style={{
                                                                                                      width: "100%",
                                                                                                      padding: "8px 10px",
                                                                                                      border: "0",
                                                                                                      outline: "none",
                                                                                                      background: "transparent",
                                                                                                      minWidth: 180,
                                                                                                    }}/>
                </td>
              ))}
              <td style={{ borderBottom: "1px solid var(--border,#e5e7eb)", padding: "6px 10px" }}>
                <button type="button" className="btn btn-secondary btn-xs" onClick={() => removeRow(idx)}>
                  Quitar
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} style={{ padding: 14, color: "var(--muted,#64748b)" }}>
                Agrega una fila para empezar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function makeFirstRow(columns: string[]) {
  const r: Row = {};
  for (const c of columns) r[c] = "";
  if (columns.includes("ReferenceId")) r["ReferenceId"] = "ROW-001";
  return r;
}

type BulkResultRow = { referenceId: string; envelopeId: string; status?: string };

export const EnvioMasivoUI: React.FC = () => {
  const { templatesOptions, createdraft, getRecipients } = useDocusignTemplates();

  const [templateId, setTemplateId] = React.useState("");
  const [columns, setColumns] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [sendingBulk, setSendingBulk] = React.useState(false);
  const [batchId, setBatchId] = React.useState("");
  const [bulkResults, setBulkResults] = React.useState<BulkResultRow[]>([]);

  const plantillaSelected = templatesOptions.find((o) => o.value === templateId) ?? null;
  const gridReady = columns.length > 0;

  const handleGenerateGrid = async () => {
    if (!templateId) {
      alert("Selecciona una plantilla");
      return;
    }

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
      setBatchId("");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error generando tabla");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!columns.length) {
      alert("Primero genera la tabla");
      return;
    }

    const safeName = (plantillaSelected?.label ?? "Template")
      .replace(/[^\w\- ]/g, "")
      .replace(/\s+/g, "_");

    exportRowsToCsv(columns, rows, `Bulk_${safeName}.csv`);
  };

  const handleReset = () => {
    setColumns([]);
    setRows([]);
    setBulkResults([]);
    setBatchId("");
  };

  const mapBatchEnvelopesToResults = (data: any): BulkResultRow[] => {
    const envs = data?.envelopes ?? [];
    const mapped = envs
      .map((e: any) => {
        const tcf = e.customFields?.textCustomFields ?? [];
        const ref =
          tcf.find((x: any) => (x.name ?? "").toLowerCase() === "referenceid")?.value ?? "";

        if (!ref) return null;

        return {
          referenceId: ref,
          envelopeId: e.envelopeId,
          status: e.status,
        } as BulkResultRow;
      })
      .filter(Boolean) as BulkResultRow[];

    // dedupe por referenceId
    const seen = new Set<string>();
    return mapped.filter((m) => {
      if (seen.has(m.referenceId)) return false;
      seen.add(m.referenceId);
      return true;
    });
  };

  const handleBulkSend = async () => {
    if (!templateId) return alert("Selecciona una plantilla.");
    if (!rows.length || !columns.length) return alert("Primero genera la tabla y agrega filas.");

    try {
      setSendingBulk(true);
      setBulkResults([]);
      setBatchId("");

      // 1) Grid -> bulkCopies (incluye customFields ReferenceId)
      const bulkCopies = buildBulkCopiesFromGrid(columns, rows);

      // 2) Crear bulk send list
      const list = await createBulkSendList({name: `Bulk_${(plantillaSelected?.label ?? "Template").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 19)}`, bulkCopies,});

      // 3) Crear request (dispara el batch)
      const req = await createBulkSendRequest({templateId, bulkSendListId: list.bulkSendListId,});

      const id = req.bulkSendBatchId || req.batchId || "";
      if (!id) throw new Error("No vino batchId/bulkSendBatchId en la respuesta.");
      setBatchId(id);

      // 4) Poll inicial (hasta 25 intentos * 2s = 50s)
      let finalResults: BulkResultRow[] = [];
      for (let attempt = 0; attempt < 25; attempt++) {
        const data = await getBulkSendBatchEnvelopes(id);
        const mapped = mapBatchEnvelopesToResults(data);

        if (mapped.length) {
          finalResults = mapped;
          setBulkResults(mapped);
          break;
        }

        await new Promise((r) => setTimeout(r, 2000));
      }

      if (!finalResults.length) {
        alert("Bulk iniciado. Aún no hay sobres listos; usa 'Actualizar resultados' en unos segundos.");
      } else {
        alert(`Bulk enviado. Sobres listos: ${finalResults.length}`);
      }
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error enviando bulk");
    } finally {
      setSendingBulk(false);
    }
  };

  const handleRefreshResults = async () => {
    if (!batchId) return alert("No hay batchId aún.");
    try {
      setSendingBulk(true);
      const data = await getBulkSendBatchEnvelopes(batchId);
      const mapped = mapBatchEnvelopesToResults(data);
      setBulkResults(mapped);
      if (!mapped.length) alert("Aún no hay resultados. Intenta de nuevo en unos segundos.");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error consultando resultados");
    } finally {
      setSendingBulk(false);
    }
  };

  return (
    <div className="ef-page bulk-send">
      {/* PANEL (se esconde cuando hay grid) */}
      {!gridReady && (
        <div className="ef-card bulk-panel">
          <div className="bulk-panel__field">
            <label className="ef-label" htmlFor="bulk-template">
              Plantilla
            </label>

            <select id="bulk-template" className="ef-input" value={templateId} onChange={(e) => setTemplateId(e.target.value)} disabled={loading || sendingBulk}>
              <option value="">Selecciona una plantilla</option>
              {templatesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bulk-panel__actions">
            <button type="button" className="btn btn-primary-final btn-xs" disabled={!templateId || loading || sendingBulk}  onClick={handleGenerateGrid}>
              {loading ? "Generando..." : "Generar tabla"}
            </button>

            <button type="button" className="btn btn-secondary btn-xs" disabled={!templateId || loading || sendingBulk} onClick={async () => {
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
                                                                                                                        }}>
              {loading ? "Cargando..." : "Descargar CSV"}
            </button>
          </div>
        </div>
      )}

      {/* GRID + TOOLBAR */}
      {gridReady && (
        <>
          <div className="bulk-toolbar">
            <div className="bulk-toolbar__left">
              <div className="bulk-toolbar__title">{plantillaSelected?.label ?? "Envío masivo"}</div>
              <div className="bulk-toolbar__meta">
                Filas: <b>{rows.length}</b>
                {batchId ? (
                  <>
                    {" "}• BatchId: <b>{batchId}</b>
                  </>
                ) : null}
              </div>
            </div>

            <div className="bulk-toolbar__right">
              <button type="button" className="btn btn-secondary btn-xs" onClick={handleReset} disabled={loading || sendingBulk}>
                Cambiar plantilla
              </button>

              <button type="button" className="btn btn-secondary btn-xs" onClick={handleDownloadCsv} disabled={loading || sendingBulk || !rows.length}>
                Descargar CSV
              </button>

              <button type="button" className="btn btn-primary-final btn-xs" onClick={handleBulkSend} disabled={loading || sendingBulk || !rows.length}>
                {sendingBulk ? "Enviando..." : "Enviar masivo"}
              </button>

              <button type="button" className="btn btn-secondary btn-xs" onClick={handleRefreshResults} disabled={loading || sendingBulk || !batchId}>
                Actualizar resultados
              </button>
            </div>
          </div>

          <BulkGrid columns={columns} rows={rows} onRowsChange={setRows} />

          {/* RESULTADOS */}
          <div className="ef-card" style={{ marginTop: 12 }}>
            <h4 style={{ margin: "8px 0 12px" }}>Resultados</h4>

            {bulkResults.length === 0 ? (
              <div style={{ color: "var(--muted,#64748b)" }}>
                Aún no hay resultados. Envía el bulk o actualiza resultados.
              </div>
            ) : (
              <div style={{ overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--border,#e5e7eb)" }}>
                        ReferenceId
                      </th>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--border,#e5e7eb)" }}>
                        EnvelopeId
                      </th>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--border,#e5e7eb)" }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkResults.map((r) => (
                      <tr key={r.referenceId}>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--border,#e5e7eb)" }}>
                          {r.referenceId}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--border,#e5e7eb)" }}>
                          {r.envelopeId}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--border,#e5e7eb)" }}>
                          {r.status ?? ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EnvioMasivoUI;


