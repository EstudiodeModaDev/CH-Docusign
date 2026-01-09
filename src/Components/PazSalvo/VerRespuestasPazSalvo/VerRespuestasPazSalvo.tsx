import * as React from "react";
import "./VerRespuestasPazSalvo.css";
import type { PazSalvo, respuestas } from "../../../models/PazSalvo";
import { useGraphServices } from "../../../graph/graphContext";
import { useRespuestasPazSalvos } from "../../../Funcionalidades/PazSalvos/Respuesta";
import { RespuestasDetalleModal } from "./DetalleModal/DetalleModal";

type Props = {
  pazSalvo: PazSalvo;
  onBack: () => void;
};

const LABEL_SIN_RESPUESTA = "No se ha dado una respuesta aun";

export const PazSalvoRespuestasTable: React.FC<Props> = ({ pazSalvo, onBack }) => {
  const { Respuesta } = useGraphServices();
  const { loadPazSalvoRespuestas, rows, } = useRespuestasPazSalvos(Respuesta, pazSalvo);

  const [detalle, setDetalle] = React.useState(false);
  const [selectedDetalle, setSelectedDetalle] = React.useState<string>("");

  React.useEffect(() => {
    loadPazSalvoRespuestas();
  }, [loadPazSalvoRespuestas]);

  // Si tienes un campo de fecha real en "respuestas", ponlo aquí para tomar el área/estado más reciente
  // Ej: "Created", "Fecha", "CreatedDateTime", etc.
  const getDate = (r: any) => {
    const raw = r?.Created ?? r?.Fecha ?? r?.CreatedDateTime ?? null;
    const t = raw ? new Date(raw).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
  };

  const uiRows = React.useMemo(() => {
    return (pazSalvo?.Solicitados ?? []).map((s, index) => {
      const respuestasParticipante = rows.filter((r: respuestas) => r.Correo === s.correo);

      // ✅ tomar "última" respuesta (si existe fecha) para mostrar Área coherente
      const last = respuestasParticipante.length
        ? [...respuestasParticipante].sort((a: any, b: any) => getDate(b) - getDate(a))[0]
        : null;

      const area = last?.Area ?? "—";

      let estadoFinal = "En espera";
      if (respuestasParticipante.length > 0) {
        if (respuestasParticipante.some((r) => r.Estado === "Aprobado")) estadoFinal = "Aprobado";
        else if (respuestasParticipante.some((r) => r.Estado === "Rechazado")) estadoFinal = "Rechazado";
        else if (respuestasParticipante.some((r) => r.Estado === "Novedad")) estadoFinal = "Novedad";
        else estadoFinal = "En espera";
      } else {
        estadoFinal = (s as any).estado ?? "En espera";
      }

      return {
        id: `${pazSalvo?.Id ?? "paz"}-${index}`,
        area,
        nombre: s.nombre,
        correo: s.correo,
        estado: estadoFinal,
      };
    });
  }, [pazSalvo?.Solicitados, pazSalvo?.Id, rows]);

  return (
    <div className="contenedor">
      <table className="ps-table">
        <thead>
          <tr>
            <th className="ps-th">Area</th>
            <th className="ps-th">Nombre</th>
            <th className="ps-th">Correo</th>
            <th className="ps-th">Estado</th>
          </tr>
        </thead>

        <tbody>
          {uiRows.map((row) => (
            <tr
              key={row.id}
              className="ps-tr"
              onClick={() => {
                setSelectedDetalle(row.correo);
                setDetalle(true);
              }}
            >
              <td className="ps-td">{row.area || "—"}</td>
              <td className="ps-td">{row.nombre || LABEL_SIN_RESPUESTA}</td>
              <td className="ps-td">{row.correo || LABEL_SIN_RESPUESTA}</td>
              <td className="ps-td">
                <span
                  className={
                    "ps-status-dot " +
                    (row.estado === "Aprobado"
                      ? "ps-status-dot--ok"
                      : row.estado === "Novedad"
                      ? "ps-status-dot--warning"
                      : row.estado === "Rechazado"
                      ? "ps-status-dot--bad"
                      : "ps-status-dot--pending")
                  }
                />
              </td>
            </tr>
          ))}

          {uiRows.length === 0 && (
            <tr>
              <td colSpan={4} className="ps-empty-row">
                No se ha enviado a ningún aprobador aún.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="psf-actions">
        <button type="button" className="btn btn-xs" onClick={onBack}>
          <span className="psf-btn-arrow">←</span>
          Volver
        </button>
      </div>

      <RespuestasDetalleModal
        open={detalle}
        onClose={() => setDetalle(false)}
        solicitado={selectedDetalle}
        PazSalvoId={pazSalvo}
      />
    </div>
  );
};
