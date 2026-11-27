import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";
import { getToneByEstado } from "./detalleUtils";

type Props = {
  row: requisiciones;
  canCancel: boolean;
  onVerHistorial: () => void;
  onPostergarANS: () => void;
  onReportarProblema: () => void;
  onCancelar: () => void;
  onClose: () => void;
};

export default function DetalleHeader({ row, canCancel, onVerHistorial, onPostergarANS, onReportarProblema, onCancelar, onClose }: Props) {
  const tone = getToneByEstado(row.Estado);

  return (
    <header className="rq-detail-header">
      <div className="rq-detail-header__copy">
        <span className="rq-detail-kicker">Detalle de requisicion</span>
        <h2 id="rq-detail-title" className="rq-detail-title">
          {row.Title || "Detalle de requisicion"}
        </h2>
        <p className="rq-detail-copy">
          #{row.Id || "Sin ID"} - {row.tipoRequisicion || "Sin tipo"} - {row.Ciudad || "Sin ciudad"}
        </p>
      </div>

      <div className="rq-detail-header__meta">
        <div className="rq-detail-header__status">
          <span className={`rb-status rb-status--${tone}`}>{row.Estado || "Sin estado"}</span>
        </div>

        <div className="rq-detail-header__actions">
          <button type="button" className="btn btn-secondary-final btn-xs rq-detail-btn" onClick={onVerHistorial}>
            Ver historial
          </button>

          <button type="button" className="btn btn-primary btn-xs rq-detail-btn rq-detail-btn--danger" onClick={onPostergarANS}>
            Postergar ANS
          </button>

          <button type="button" className="btn btn-danger btn-xs rq-detail-btn rq-detail-btn--normal" onClick={onReportarProblema}>
            Reportar problema
          </button>

          {canCancel && (
            <button type="button" className="btn btn-danger btn-xs rq-detail-btn rq-detail-btn--normal" onClick={onCancelar}>
              Cancelar requisición
            </button>
          )}

          <button type="button" className="btn btn-secondary-final btn-xs rq-detail-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </header>
  );
}
