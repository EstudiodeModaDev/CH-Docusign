import React from "react";
import { useDocusignTemplates } from "../../../../Funcionalidades/GD/Docusign";
import { generateCsvForTemplate } from "../../../../Funcionalidades/GD/Bulk";
import { exportRowsToCsv } from "../../../../utils/csv";

type Row = Record<string, string>;

function makeEmptyRow(columns: string[], index: number) {
  const r: Row = {};
  for (const c of columns) r[c] = "";
  r["ReferenceId"] = `ROW-${String(index).padStart(3, "0")}`;
  return r;
}

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
              <th
                key={c}
                style={{
                  position: "sticky",
                  top: 0,
                  background: "var(--surface,#fff)",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--border,#e5e7eb)",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {c}
              </th>
            ))}
            <th
              style={{
                position: "sticky",
                top: 0,
                background: "var(--surface,#fff)",
                padding: "10px 12px",
                borderBottom: "1px solid var(--border,#e5e7eb)",
              }}
            >
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={col} style={{ borderBottom: "1px solid var(--border,#e5e7eb)" }}>
                  <input
                    value={row[col] ?? ""}
                    onChange={(e) => setCell(idx, col, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      border: "0",
                      outline: "none",
                      background: "transparent",
                      minWidth: 180,
                    }}
                    disabled={col === "ReferenceId"} // lo autogeneras
                  />
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


export function EnvioMasivoUI() {
  const { templatesOptions, createdraft, getRecipients } = useDocusignTemplates();
  const [templateId, setTemplateId] = React.useState("");
  const [columns, setColumns] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<Array<Record<string,string>>>([]);
  const [loading, setLoading] = React.useState(false);

  const plantillaSelected = templatesOptions.find((o) => o.value === templateId) ?? null;

  const buildColumns = async () => {
    if (!templateId) return alert("Selecciona una plantilla");
    setLoading(true);
    try {
      const build = await generateCsvForTemplate({ templateId, createdraft, getRecipients });
      setColumns(build.headers);
      // arranca con 1 fila vacía
      setRows([{ ...build.headers.reduce((a,c)=>({ ...a, [c]:"" }), {}), ReferenceId: "ROW-001" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ef-page">
      <div className="ef-card">
        <div className="ef-field">
          <label className="ef-label">Plantilla</label>
          <select className="ef-input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">Selecciona una plantilla</option>
            {templatesOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="ef-actions" style={{ gap: 8 }}>
          <button className="btn btn-primary-final btn-xs" disabled={!templateId || loading} onClick={buildColumns}>
            {loading ? "Cargando..." : "Generar tabla"}
          </button>

          <button
            className="btn btn-secondary btn-xs"
            disabled={!columns.length || !rows.length}
            onClick={() => exportRowsToCsv(columns, rows, `Bulk_${(plantillaSelected?.label ?? "Template").replace(/\s+/g,"_")}.csv`)}
          >
            Descargar CSV
          </button>
        </div>
      </div>

      {columns.length > 0 && (
        <BulkGrid columns={columns} rows={rows} onRowsChange={setRows} />
      )}
    </div>
  );
}
