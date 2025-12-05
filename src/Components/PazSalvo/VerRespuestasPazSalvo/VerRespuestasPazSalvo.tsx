import * as React from "react";
import "./VerRespuestasPazSalvo.css";
import type { PazSalvo } from "../../../models/PazSalvo";
import type { respuestas } from "../../../models/PazSalvo";
import { useGraphServices } from "../../../graph/graphContext";
import { useRespuestasPazSalvos } from "../../../Funcionalidades/PazSalvos/Respuesta";
import { RespuestasDetalleModal } from "./DetalleModal/DetalleModal";

type Props = {
  pazSalvo: PazSalvo;
  onBack: () => void
};

const LABEL_SIN_RESPUESTA = "No se ha dado una respuesta aun";


export const PazSalvoRespuestasTable: React.FC<Props> = ({ pazSalvo, onBack }) => {
  const { Respuesta } = useGraphServices();
  const { loadPazSalvoRespuestas, rows } = useRespuestasPazSalvos(Respuesta, pazSalvo);
  const [detalle, setDetalle] = React.useState<boolean>(false)
  const [selectedDetalle, setSelectedDetalle] = React.useState<string>("")

  React.useEffect(() => {
    loadPazSalvoRespuestas();
  }, [loadPazSalvoRespuestas]);

const uiRows = React.useMemo(() => {
  return pazSalvo.Solicitados.map((s, index) => {
    // Todas las respuestas de este participante
    const respuestasParticipante = rows.filter(
      (r: respuestas) => r.Correo === s.correo
    );

    let estadoFinal = "En espera";

    if (respuestasParticipante.length > 0) {
      if (respuestasParticipante.some(r => r.Estado === "Aprobado")) {
        estadoFinal = "Aprobado";
      } else if (respuestasParticipante.some(r => r.Estado === "Rechazado")) {
        estadoFinal = "Rechazado";
      } else {
        // Tiene respuestas pero ninguna marcada explícitamente,
        // puedes dejarlo como En espera o poner otro estado si quisieras
        estadoFinal = "En espera";
      }
    } else {
      // Sin respuestas → me quedo con el estado del solicitado o En espera
      estadoFinal = s.estado ?? "En espera";
    }

    return {
      id: `${pazSalvo.Id ?? "paz"}-${index}`,
      nombre: s.nombre,
      correo: s.correo,
      estado: estadoFinal,
    };
  });
}, [pazSalvo.Solicitados, pazSalvo.Id, rows]);


  return (
    <div className="contenedor">
        <table className="ps-table">
            <thead>
                <tr>
                    <th className="ps-th">Nombre</th>
                    <th className="ps-th">Correo</th>
                    <th className="ps-th">Estado</th>
                </tr>
            </thead>

            <tbody>
                {uiRows.map((row) => (
                    <tr key={row.id} className="ps-tr" onClick={() => {setSelectedDetalle(row.correo); setDetalle(true)}}>
                        <td className="ps-td">{row.nombre || LABEL_SIN_RESPUESTA}</td>
                        <td className="ps-td">{row.correo || LABEL_SIN_RESPUESTA}</td>
                        <td className="ps-td">
                            <span className={"ps-status-dot " + (row.estado === "Aprobado" ? "ps-status-dot--ok" : row.estado === "Rechazado" ? "ps-status-dot--bad" : "ps-status-dot--pending")}/>
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
        <RespuestasDetalleModal open={detalle} onClose={() => setDetalle(false)} solicitado={selectedDetalle} PazSalvoId={pazSalvo}/>
    </div>
  );
};
