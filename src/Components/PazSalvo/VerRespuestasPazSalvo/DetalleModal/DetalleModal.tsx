import * as React from "react";
import "./DetalleModal.css";
import { useGraphServices } from "../../../../graph/graphContext";
import { useRespuestasPazSalvos } from "../../../../Funcionalidades/PazSalvos/Respuesta";
import type { PazSalvo, respuestas } from "../../../../models/PazSalvo";

type Props = {
  open: boolean;
  onClose: () => void;
  titulo?: string;
  solicitado: string;   // correo del solicitado
  PazSalvoId: PazSalvo;
};

type AdjuntoSimplificado = {
  name: string;
  url: string;
};

export const RespuestasDetalleModal: React.FC<Props> = ({open, onClose, titulo = "Detalle de respuestas", solicitado, PazSalvoId,}) => {
  const { Respuesta } = useGraphServices();
  const { loadAllPazRespuestas, getAttachments } = useRespuestasPazSalvos(Respuesta, PazSalvoId);

  const [respuestas, setRespuestas] = React.useState<respuestas[]>([]);
  const [adjuntos, setAdjuntos] = React.useState<Record<string, AdjuntoSimplificado[]>>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;          // si el modal está cerrado, no hago nada
    if (!PazSalvoId?.Id) return;

    const loadData = async () => {
      setLoading(true);

      // 1) Traer todas las respuestas del Paz y Salvo
      const all = (await loadAllPazRespuestas(PazSalvoId.Id ?? "")) ?? [];

      // 2) Filtrar solo las del solicitado
      const filtered = all.filter((r) => r.Correo === solicitado);
      setRespuestas(filtered);

      // 3) Traer adjuntos por respuesta (una llamada al flujo por fila)
      const mapAdjuntos: Record<string, AdjuntoSimplificado[]> = {};

      await Promise.all(
        filtered
          .filter((r) => r.Id)
          .map(async (r) => {
            try {
              const data = await getAttachments(r.Id!);
              // data = { ok, length, items }
              if (data?.ok && Array.isArray(data.items)) {
                mapAdjuntos[r.Id!] = data.items.map((item: any) => ({
                  name: item.name,
                  // AJUSTA esto a lo que devuelva tu flujo
                  url: item.url ?? item.contentUrl ?? "#",
                }));
              }
            } catch (err) {
              console.error("Error obteniendo adjuntos de", r.Id, err);
            }
          })
      );

      setAdjuntos(mapAdjuntos);
      setLoading(false);
    };

    loadData();
    // 👇 MUY IMPORTANTE: solo dependencias ESTABLES
  }, [open, PazSalvoId?.Id, solicitado]); 

  if (!open) return null;

  return (
    <div className="psm-overlay" onClick={onClose}>
      <div className="psm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="psm-header">
          <h2 className="psm-title">{titulo}</h2>
          <button className="psm-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="psm-body">
          {loading && <p>Cargando respuestas...</p>}

          <table className="psm-table">
            <thead>
              <tr>
                <th className="psm-th">Respuesta</th>
                <th className="psm-th">Motivo</th>
                <th className="psm-th">Adjunto</th>
              </tr>
            </thead>
            <tbody>
              {respuestas.map((row) => {
                const rowAdjuntos = adjuntos[row.Id ?? ""] || [];

                return (
                  <tr key={row.Id} className="psm-tr">
                    <td className="psm-td">{row.Estado}</td>

                    <td className="psm-td">
                      {row.Respuesta ? (
                        <div
                          className="psm-html"
                          dangerouslySetInnerHTML={{ __html: row.Respuesta }}
                        />
                      ) : (
                        "Sin motivo registrado"
                      )}
                    </td>

                    <td className="psm-td">
                      {rowAdjuntos.length === 0 && "Sin adjuntos"}
                      {rowAdjuntos.length > 0 &&
                        rowAdjuntos.map((a, i) => (
                          <div key={i}>
                            <a href={a.url} target="_blank" rel="noreferrer" className="psm-link">
                              📎 {a.name}
                            </a>
                          </div>
                        ))}
                    </td>
                  </tr>
                );
              })}

              {respuestas.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} className="psm-empty">
                    No hay respuestas para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="psm-footer">
          <button className="psm-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
