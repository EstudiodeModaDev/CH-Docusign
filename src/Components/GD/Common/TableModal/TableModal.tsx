import * as React from "react";
import "./TableModal.css";

type ColumnAlign = "left" | "center" | "right";

export interface TableColumn<T> {
  key: string;
  header: string;
  accessor?: keyof T;
  width?: string | number;
  align?: ColumnAlign;
  render?: (row: T, index: number) => React.ReactNode;
}

interface TableModalProps<T> {
  open: boolean;
  title: string;
  rows: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onClose: () => void;
  emptyText?: string;
  getRowKey?: (row: T, index: number) => string;
}

export function TableModal<T>({open, title, rows, columns, loading = false, onClose, emptyText = "No hay información para mostrar.", getRowKey,}: TableModalProps<T>) {
  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const getCellContent = (row: T, column: TableColumn<T>, index: number): React.ReactNode => {
    if (column.render) {
      return column.render(row, index);
    }

    if (column.accessor) {
      const value = row[column.accessor];

      if (value === null || value === undefined || value === "") {
        return "—";
      }

      return String(value);
    }

    return "—";
  };

  if (!open) return null;

  return (
    <div className="tm-backdrop" onClick={handleClose}>
      <div className="tm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="tm-title">
        <div className="tm-header">
          <h2 id="tm-title" className="tm-title">
            {title}
          </h2>

          <button type="button" className="tm-close" onClick={handleClose} disabled={loading} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="tm-body">
          <div className="tm-table-wrapper">
            <table className="tm-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className={`tm-th tm-align-${column.align ?? "left"}`} style={{
                        width:
                          typeof column.width === "number"
                            ? `${column.width}px`
                            : column.width,
                      }}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="tm-state" colSpan={columns.length}>
                      Cargando información...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="tm-state" colSpan={columns.length}>
                      {emptyText}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr
                      key={getRowKey ? getRowKey(row, index) : String(index)}
                      className="tm-tr"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`tm-td tm-align-${column.align ?? "left"}`}
                        >
                          {getCellContent(row, column, index)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tm-footer">
          <button type="button" className="tm-btn tm-btn--ghost" onClick={handleClose} disabled={loading}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}