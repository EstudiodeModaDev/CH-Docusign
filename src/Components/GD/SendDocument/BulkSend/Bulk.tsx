import React from "react";
import { useDocusignTemplates } from "../../../../Funcionalidades/GD/Docusign";
import { buildBulkCopiesFromGrid, generateCsvForTemplate } from "../../../../Funcionalidades/GD/Bulk";
import { exportRowsToCsv } from "../../../../utils/csv";
import {
  createBulkSendList,
  createBulkSendRequest,
  getBulkSendBatchEnvelopes,
} from "../../../../Services/DocusignAPI.service";
import "./Bulk.css";

type Row = Record<string, string>;

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

/** ============== GRID ============== */
export function BulkGrid(props: {
  columns: string[];
  rows: Row[];
  onRowsChange: (rows: Row[]) => void;
}) {
  const { columns, rows, onRowsChange } = props;

  const addRow = () => onRowsChange([...rows, makeEmptyRow(columns, rows.length + 1)]);
  const removeRow = (idx: number) => onRowsChange(rows.filter((_, i) => i !== idx));

  const setCell = (idx: number, col: string, value: string) => {
    onRowsChange(rows.map((r, i) => (i === idx ? { ...r, [col]: value } : r)));
  };

  const stickyClass = (col: string) => {
    if (col === "ReferenceId") return "sticky-left";
    if (col === "COLABORADOR_Name") return "sticky-left-2";
    return "";
  };

  return (
    <div className="bulk-grid">
      <div className="bulk-grid__topbar">
        <div className="bulk-grid__left">
          <button type="button" className="btn btn-primary-final btn-xs" onClick={addRow}>
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
                <th key={c} className={`bulk-grid__th ${stickyClass(c)}`}>
                  {c}
                </th>
              ))}
              <th className="bulk-grid__th">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="bulk-grid__tr">
                {columns.map((col) => (
                  <td key={col} className={`bulk-grid__td ${stickyClass(col)}`}>
                    <input
                      className="bulk-grid__cell"
                      value={row[col] ?? ""}
                      onChange={(e) => setCell(idx, col, e.target.value)}
                      disabled={col === "ReferenceId"}
                      placeholder={col === "ReferenceId" ? "" : "Escribe..."}
                    />
                  </td>
                ))}
                <td className="bulk-grid__td">
                  <div className="bulk-grid__actions">
                    <button
                      type="button"
                      className="bulk-grid__btn bulk-grid__btn--danger"
                      onClick={() => removeRow(idx)}
                      disabled={rows.length <= 1}
                      title={rows.length <= 1 ? "Debe existir al menos 1 fila" : "Quitar fila"}
                    >
                      Quitar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="bulk-grid__empty">
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

type BulkResultRow = { referenceId: string; envelopeId: string; status?: string };

/** ============== UI ============== */
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
      setBatchId("");
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
    setColumns([]);
    setRows([]);
    setBulkResults([]);
    setBatchId("");
  };

  /** IMPORTANTE: si ya corriges customFields a ARRAY en el payload,
   *  aquí también debes leer customFields como array (no textCustomFields).
   */
  const mapBatchEnvelopesToResults = (data: any): BulkResultRow[] => {
    const envs = data?.envelopes ?? [];

    const mapped = envs
      .map((e: any) => {
        // ✅ Opción A: si DocuSign devuelve customFields como objeto clásico
        // const tcf = e.customFields?.textCustomFields ?? [];
        // const ref = tcf.find((x: any) => (x.name ?? "").toLowerCase() === "referenceid")?.value ?? "";

        // ✅ Opción B: si devuelve customFields como array (más consistente con lo que enviamos)
        const cf = Array.isArray(e.customFields) ? e.customFields : [];
        const ref =
          cf.find((x: any) => (x.name ?? "").toLowerCase() === "referenceid")?.value ?? "";

        if (!ref) return null;

        return {
          referenceId: ref,
          envelopeId: e.envelopeId,
          status: e.status,
        } as BulkResultRow;
      })
      .filter(Boolean) as BulkResultRow[];

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

      // 1) Grid -> bulkCopies
      const bulkCopies = buildBulkCopiesFromGrid(columns, rows);

      // 2) Crear bulk send list
      const list = await createBulkSendList({
        name: `Bulk_${(plantillaSelected?.label ?? "Template").replace(/\s+/g, "_")}_${new Date()
          .toISOString()
          .slice(0, 19)}`,
        bulkCopies,
      });

      // 3) Disparar batch
      const req = await createBulkSendRequest({
        templateId,
        bulkSendListId: list.bulkSendListId,
      });

      const id = req.bulkSendBatchId || req.batchId || "";
      if (!id) throw new Error("No vino batchId/bulkSendBatchId en la respuesta.");
      setBatchId(id);

      // 4) Poll
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
              disabled={loading || sendingBulk}
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
              disabled={!templateId || loading || sendingBulk}
              onClick={handleGenerateGrid}
            >
              {loading ? "Generando..." : "Generar tabla"}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-xs"
              disabled={!templateId || loading || sendingBulk}
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

      {gridReady && (
        <>
          <div className="bulk-toolbar">
            <div className="bulk-toolbar__left">
              <div className="bulk-toolbar__title">{plantillaSelected?.label ?? "Envío masivo"}</div>
              <div className="bulk-toolbar__meta">
                Filas: <b>{rows.length}</b>
                {batchId ? (
                  <>
                    {" "}
                    • BatchId: <b>{batchId}</b>
                  </>
                ) : null}
              </div>
            </div>

            <div className="bulk-toolbar__right">
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={handleReset}
                disabled={loading || sendingBulk}
              >
                Cambiar plantilla
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={handleDownloadCsv}
                disabled={loading || sendingBulk || !rows.length}
              >
                Descargar CSV
              </button>

              <button
                type="button"
                className="btn btn-primary-final btn-xs"
                onClick={handleBulkSend}
                disabled={loading || sendingBulk || !rows.length}
              >
                {sendingBulk ? "Enviando..." : "Enviar masivo"}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={handleRefreshResults}
                disabled={loading || sendingBulk || !batchId}
              >
                Actualizar resultados
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
                <div className="bulk-results__empty">
                  Aún no hay resultados. Envía el bulk o actualiza resultados.
                </div>
              ) : (
                <div className="bulk-results__wrap">
                  <table className="bulk-results__table">
                    <thead>
                      <tr>
                        <th className="bulk-results__th">ReferenceId</th>
                        <th className="bulk-results__th">EnvelopeId</th>
                        <th className="bulk-results__th">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResults.map((r) => (
                        <tr key={r.referenceId} className="bulk-results__tr">
                          <td className="bulk-results__td">{r.referenceId}</td>
                          <td className="bulk-results__td">{r.envelopeId}</td>
                          <td className="bulk-results__td">{r.status ?? ""}</td>
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
