import * as React from "react";
import "./log.css";
import type { moverAns,} from "../../../models/requisiciones";
import { spDateToDDMMYYYY } from "../../../utils/Date";

type Props = {
  open: boolean;
  title?: string;

  rows: moverAns[];

  onClose: () => void;

  loading?: boolean;
  emptyText?: string;

};

export function NovedadesModal(props: Props) {
  const {open, title = "Novedades", rows, onClose, loading = false, emptyText = "No hay datos para mostrar.",} = props;

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const closeOnBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  return (
    <div className="nm-overlay" onMouseDown={closeOnBackdrop} role="dialog" aria-modal="true">
        <div className="nm-modal">
            <header className="nm-head">
                <h2 className="nm-title">{title}</h2>

                <button type="button" className="nm-close" onClick={onClose} aria-label="Cerrar">
                    ✕
                </button>
            </header>

            <section className="nm-body">
                {loading ? (
                    <div className="nm-state">Cargando...</div>
                ) : rows.length === 0 ? (
                    <div className="nm-state">{emptyText}</div>
                ) : (
                    <div className="nm-tableWrap">
                        <table className="nm-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Fecha Inicio</th>
                                    <th>ANS</th>
                                    <th>Fecha limíte</th>
                                    <th>Observación</th>
                                </tr>
                            </thead>

                            <tbody>
                                {rows.map((r,) => {
                                    const key = r.Id;
                                    return (
                                    <tr key={key}>
                                        <td>{r.Id}</td>
                                        <td>{spDateToDDMMYYYY(r.fechaComentario)}</td>
                                        <td>{r.ANS}</td>
                                        <td>{spDateToDDMMYYYY(r.fechaLimite)}</td>
                                        <td>{r.observacion}</td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    </div>
  );
}
