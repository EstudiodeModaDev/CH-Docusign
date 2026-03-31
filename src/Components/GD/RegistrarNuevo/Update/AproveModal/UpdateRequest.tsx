import React from "react";
import "./UpdateRequest.css";
import type { solicitud } from "../../../../../models/solicitudCambio";
import { DDMMYYYY } from "../../../../../utils/Date";
import { useRequestDetailsSearches } from "../../../../../Funcionalidades/GD/UpdateRequestDetails/hooks/useRequestDetailsSearches";
import { useRequestActions } from "../../../../../Funcionalidades/GD/UpdateRequest/hooks/useRequestActions";

type Props = {
  selectedSolicitud: solicitud | null;
  onCloseDetail: () => void;
};

function getEstadoClass(estado: string) {
  const normalized = estado.toLowerCase();
  if (normalized === "aprobada") return "sa-chip sa-chip--success";
  if (normalized === "rechazada") return "sa-chip sa-chip--danger";
  return "sa-chip sa-chip--warning";
}

export default function SolicitudesDetails({selectedSolicitud, onCloseDetail,}: Props) {
  const [comentario, setComentario] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const requestActions = useRequestActions()
  const requestDetailsController = useRequestDetailsSearches()

  React.useEffect(() => {
    setComentario(selectedSolicitud?.comentarioAprobador ?? "");
    requestDetailsController.getDetails(selectedSolicitud?.Id ?? "")
  }, [selectedSolicitud]);

  const canResolve = !!selectedSolicitud && selectedSolicitud.Estado === "Pendiente"

  const handleApprove = async () => {
    if (!selectedSolicitud || submitting) return;

    if(!comentario){
      alert("Debe indicar el motivo de su decisión")
      return
    }
    setSubmitting(true);
    try {
      await requestActions.onApproveRequest(selectedSolicitud, comentario,)
      setComentario("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSolicitud || submitting) return;
    setSubmitting(true);
    try {
      await requestActions.onRejectRequest(selectedSolicitud, comentario)
      setComentario("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sa-page">

      {selectedSolicitud && (
        <div className="sa-modalOverlay" onClick={onCloseDetail}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modalHeader">
              <div>
                <h2 className="sa-modalTitle">
                  Solicitud #{selectedSolicitud.Id}
                </h2>
                <p className="sa-modalSubtitle">
                  {selectedSolicitud.Title} · Registro {selectedSolicitud.IdRegistro}
                </p>
              </div>

              <button className="sa-close" onClick={onCloseDetail}>
                ×
              </button>
            </div>

            <div className="sa-detailGrid">
              <div className="sa-detailItem">
                <span className="sa-detailLabel">Estado</span>
                <span className={getEstadoClass(selectedSolicitud.Estado)}>
                  {selectedSolicitud.Estado}
                </span>
              </div>

              <div className="sa-detailItem">
                <span className="sa-detailLabel">Solicitante</span>
                <span>{selectedSolicitud.NombreSolicitante}</span>
              </div>

              <div className="sa-detailItem">
                <span className="sa-detailLabel">Correo</span>
                <span>{selectedSolicitud.CorreoSolicitante || "-"}</span>
              </div>

              <div className="sa-detailItem">
                <span className="sa-detailLabel">Fecha solicitud</span>
                <span>{DDMMYYYY(selectedSolicitud.fechaSolicitud)}</span>
              </div>

              {selectedSolicitud.Estado !== "Pendiente" && (
                <>
                  <div className="sa-detailItem">
                    <span className="sa-detailLabel">Aprobador</span>
                    <span>{selectedSolicitud.Aprobador || "-"}</span>
                  </div>

                  <div className="sa-detailItem">
                    <span className="sa-detailLabel">Fecha decisión</span>
                    <span>{DDMMYYYY(selectedSolicitud.fechaAprobacion)}</span>
                  </div>

                  <div className="sa-detailItem sa-detailItem--full">
                    <span className="sa-detailLabel">Comentario</span>
                    <span>{selectedSolicitud.comentarioAprobador || "-"}</span>
                  </div>
                </>
              )}
            </div>

            <div className="sa-section">
              <h3 className="sa-sectionTitle">Cambios solicitados</h3>

              <div className="sa-tableWrap">
                <table className="sa-table sa-table--details">
                  <thead>
                    <tr>
                      <th>Campo</th>
                      <th>Valor actual</th>
                      <th>Nuevo valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestDetailsController.details.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="sa-empty">
                          No hay cambios cargados para esta solicitud.
                        </td>
                      </tr>
                    ) : (
                      requestDetailsController.details.map((detalle, idx) => (
                        <tr key={`${detalle.Id}-${detalle.NombreCampo}-${idx}`}>
                          <td>{detalle.EtiquetaCampo || detalle.NombreCampo}</td>
                          <td>{detalle.ValorAnterior || "-"}</td>
                          <td className="sa-newValue">{detalle.ValorNuevo || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sa-section">
              <h3 className="sa-sectionTitle">Decisión</h3>

              <textarea className="sa-textarea" placeholder="Escriba un comentario para la aprobación o el rechazo" value={comentario} onChange={(e) => setComentario(e.target.value)} disabled={!canResolve || submitting}/>

              {canResolve ? (
                <div className="sa-actions">
                  <button className="sa-btn sa-btn--danger" onClick={handleReject} disabled={submitting}>
                    {submitting ? "Procesando..." : "Rechazar"}
                  </button>

                  <button className="sa-btn sa-btn--primary" onClick={handleApprove} disabled={submitting}>
                    {submitting ? "Procesando..." : "Aprobar"}
                  </button>
                </div>
              ) : (
                <div className="sa-infoBox">
                  {selectedSolicitud.Estado !== "Pendiente"
                    ? "Esta solicitud ya fue resuelta."
                    : "No tiene permisos para aprobar o rechazar esta solicitud."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}