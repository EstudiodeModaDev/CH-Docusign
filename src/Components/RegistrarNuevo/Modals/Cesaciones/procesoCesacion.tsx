import * as React from "react";
import "../PasosPromocion.css";
import { useGraphServices } from "../../../../graph/graphContext";
import type { Cesacion, DetallesPasos, PasosProceso } from "../../../../models/Cesaciones";
import type { GraphSendMailPayload } from "../../../../graph/graphRest";
import type { Promocion } from "../../../../models/Promociones";
import { toUnifyVM, type Proceso } from "../../../../utils/unify";
import type { Novedad } from "../../../../models/Novedades";

export type TipoPaso = "Aprobacion" | "Notificacion" | "SubidaDocumento";

type Props = {
  titulo: string;
  selectedCesacion: Cesacion | Promocion | Novedad;
  loadingPasos: boolean
  errorPasos: string | null;
  pasosById: Record<string, PasosProceso>,
  decisiones: Record<string, "" | "Aceptado" | "Rechazado">;
  motivos: Record<string, string>;
  setMotivos: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDecisiones: React.Dispatch<React.SetStateAction<Record<string, "" | "Aceptado" | "Rechazado">>>;
  onClose: () => void;
  handleCompleteStep: (detalle: DetallesPasos, path?: string) => void
  detallesRows: DetallesPasos[],
  loadingDetalles: boolean,
  errorDetalles: string | null,
  loadDetalles: () => void,
  proceso: Proceso;
};

function safeString(v: any) {
  return (v ?? "").toString();
}

export const ProcessDetail: React.FC<Props> = ({detallesRows, loadingDetalles, errorDetalles, loadDetalles, titulo, selectedCesacion, onClose, loadingPasos, errorPasos, pasosById, decisiones, motivos, setMotivos, setDecisiones, handleCompleteStep, proceso }) => {
  const {ColaboradoresDH, ColaboradoresEDM, ColaboradoresDenim, ColaboradoresVisual, ColaboradoresMeta, mail}: any = useGraphServices();

  const vm = React.useMemo(() => {
    return toUnifyVM(proceso as Proceso, selectedCesacion as any);
  }, [proceso, selectedCesacion]);

  const [files, setFiles] = React.useState<Record<string, File | null>>({});
  const [destinatario, setDestinatario] = React.useState<string>("")
  const [asunto, setAsunto] = React.useState<string>("")
  const [cuerpo, setBody] = React.useState<string>("")
  const [sending, setSending] = React.useState<boolean>(false)
  const [uploading, setUploading] = React.useState<boolean>(false);

  const detectTipoPaso = (paso: DetallesPasos): TipoPaso => {
    const t = (paso?.TipoPaso ?? "");
    if (t === "Aprobacion" || t === "Notificacion" || t === "SubidaDocumento") return t;
    return "Aprobacion";
  };

  const handleSubmit = async (detalle: DetallesPasos) => {
    await handleCompleteStep(detalle,);
    await loadDetalles();
  };

  /** ======= Subida de documento ======= */
  const handleUploadAndComplete = async (detalle: DetallesPasos, paso: any) => {
    const idDetalle = detalle.Id ?? "";
    const file = files[idDetalle];

    if (!file) {
      alert("Debes seleccionar un archivo antes de subirlo");
      return;
    }

    const empresa = vm.empresa?.toLocaleLowerCase().trim() ?? "";
    const servicioColaboradores =
      empresa === "dh retail" ? ColaboradoresDH: 
      empresa === "movimiento" ? ColaboradoresVisual:
      empresa === "denim head" ? ColaboradoresDenim:
      empresa === "estudio de moda" ? ColaboradoresEDM:
      empresa === "metagraphics" ? ColaboradoresMeta : ColaboradoresEDM

    // Nombre final del archivo (si hay NombreEvidencia definido)
    const ext = file.name.split(".").pop() ?? "pdf";
    const nombreBase = (paso?.NombreEvidencia ?? paso?.NombrePaso ?? "Evidencia").toString().trim();
    const fileName = `${nombreBase}.${ext}`;
    const renamedFile = new File([file], fileName, { type: file.type, lastModified: file.lastModified });

    setUploading(true)
    try {
      const carpeta = `Colaboradores Activos/${vm.numeroDoc} - ${vm.nombre}`;

      await servicioColaboradores.uploadFile(carpeta, renamedFile);

      // Completa el paso guardando lo mínimo (SIN LOG)
      await handleSubmit(detalle,);

      // Limpia file local
      setFiles((prev) => ({ ...prev, [idDetalle]: null }));
      alert("Archivo subido correctamente");
    } catch (e: any) {
      console.error(e);
      alert("Error subiendo archivo: " + (e?.message ?? e));
    } finally {
      setUploading(false)
    }
  };

  /** ======= Notificación ======= */
  const sendNotification = async (to: string, subject: string, htmlBody: string) => {
    // Opción A: si tienes MailService con sendEmail(payload) (como me mostraste antes)
    // Ajusta a tu implementación real.
    if (mail.sendEmail) {
      const payload: GraphSendMailPayload = {
        message: {
          subject,
          body: { contentType: "HTML", content: htmlBody },
          toRecipients: [{ emailAddress: { address: to } }],
        },
      };
      await mail.sendEmail(payload);
      return;
    }

    // Opción B: si NO tienes MailService aquí, lanza error para que lo conectes.
    throw new Error("No hay MailService disponible. Conecta aquí tu envío (Graph o Power Automate).");
  };

  const handleSendAndComplete = async (detalle: DetallesPasos,) => {
    const isDone = detalle.EstadoPaso === "Completado";
    if (isDone) return;

    // Destino desde paso (configurado) o fallback
    const destino = destinatario

    if (!destino) {
      alert("Este paso no tiene correo destino configurado.");
      return;
    }

    if (!asunto) {
      alert("El asunto no puede estar vacío.");
      return;
    }
    if (!cuerpo) {
      alert("El mensaje no puede estar vacío.");
      return;
    }

    setSending(true)
    try {
      await sendNotification(destino, asunto, cuerpo);


      await handleSubmit(detalle,);

      alert("Notificación enviada.");
    } catch (e: any) {
      console.error(e);
      alert("Error enviando notificación: " + (e?.message ?? e));
    } finally {
      setSending(false)
    }
  };

  /** ======= Aprobación ======= */
  const handleApproveAndComplete = async (detalle: DetallesPasos) => {
    const idDetalle = detalle.Id ?? "";
    const decision = (decisiones[idDetalle] ?? "") as "" | "Aceptado" | "Rechazado";
    const motivo = safeString(motivos[idDetalle] ?? "");

    if (!decision) {
      alert("Selecciona Aceptado o Rechazado.");
      return;
    }
    if (decision === "Rechazado" && !motivo.trim()) {
      alert("Debes ingresar el motivo del rechazo.");
      return;
    }

    await handleSubmit(detalle,);
  };

  if (loadingPasos || loadingDetalles) return <div>Cargando pasos…</div>;

  if (errorPasos|| errorDetalles) {
    return (
      <div>
        Error cargando la información.
        <br />
        {errorPasos ?? errorDetalles}
      </div>
    );
  }

  return (
    <section className="promo-steps">
      <header className="promo-steps__header">
        <h2 className="promo-steps__title">{titulo}</h2>
      </header>

      <div className="promo-steps__grid">
        {detallesRows.map((detalle, index) => {
          const idDetalle = detalle.Id ?? "";
          const paso: PasosProceso | any = pasosById[detalle.NumeroPaso] ?? null;

          const previous = detallesRows[index - 1];
          const isVisible = index === 0 || previous?.EstadoPaso === "Completado";
          if (!isVisible) return null;

          const isCompleted = detalle.EstadoPaso === "Completado";
          const tipoPaso = detectTipoPaso(paso);

          const busySend = !!sending;
          const busyUpload = !!uploading

          return (
            <article key={idDetalle} className="step-card">
              <div className="step-card__header">
                <h3 className="step-card__name">{paso?.NombrePaso ?? "Paso sin nombre"}</h3>

                <span className={`step-card__status step-card__status--${isCompleted ? "done" : "pending"}`}>{detalle.EstadoPaso} </span>
              </div>

              <div className="step-card__body">
                {/* ======== APROBACIÓN ======== */}
                {tipoPaso === "Aprobacion" && (
                  <>
                    {!isCompleted ? (
                      <>
                        <select className="step-card__select" value={(decisiones[idDetalle] ?? "") as any} onChange={(e) => {
                                                                                                                          const value = e.target.value as "" | "Aceptado" | "Rechazado";
                                                                                                                          setDecisiones((prev: any) => ({ ...prev, [idDetalle]: value }));
                                                                                                                        }}>
                          <option value="">Seleccione…</option>
                          <option value="Aceptado">Aceptado</option>
                          <option value="Rechazado">Rechazado</option>
                        </select>

                        {(decisiones[idDetalle] ?? "") === "Rechazado" && (
                          <input type="text" className="step-card__input" placeholder="Motivo del rechazo" value={motivos[idDetalle] ?? ""} onChange={(e) => {
                                                                                                                                              const motivo = e.target.value;
                                                                                                                                              setMotivos((prev: any) => ({ ...prev, [idDetalle]: motivo }));
                                                                                                                                            }}/>
                        )}

                        <button type="button" className={`step-card__check ${isCompleted ? "step-card__check--active" : ""}`} disabled={isCompleted} onClick={() => handleApproveAndComplete(detalle)} title="Completar paso">
                          ✓
                        </button>
                      </>
                    ) : (
                      <div className="step-card__notes">
                        <p className="step-card__note">{detalle.Notas}</p>
                      </div>
                    )}
                  </>
                )}

                {/* ======== NOTIFICACIÓN ======== */}
                {tipoPaso === "Notificacion" && (
                  <>
                    {!isCompleted ? (
                      <>
                        <input type="email" className="step-card__input" placeholder="Ingrese el correo de la persona a la que se le notificara" value={destinatario} onChange={(e) => setDestinatario(e.target.value)} disabled={busySend}/>

                        <input type="text" className="step-card__input" placeholder="Asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} disabled={busySend}/>

                        <textarea className="step-card__textarea" placeholder="Mensaje (HTML permitido)" value={cuerpo} onChange={(e) => setBody(e.target.value)} disabled={busySend} rows={3}/>

                        <button type="button" className="btn btn-xs" disabled={busySend} onClick={() => handleSendAndComplete(detalle,)} title="Enviar notificación y completar">
                          {busySend ? "Enviando…" : "Enviar ✓"}
                        </button>
                      </>
                    ) : (
                      <div className="step-card__notes">
                        <p className="step-card__note">{detalle.Notas}</p>
                      </div>
                    )}
                  </>
                )}

                {/* ======== SUBIDA DE DOCUMENTO ======== */}
                {tipoPaso === "SubidaDocumento" && (
                  <>
                    {!isCompleted ? (
                      <>
                        <div className="step-card__upload-wrapper">
                          <input id={`file-${idDetalle}`} type="file"
                            accept={safeString(paso?.AceptaTipos ?? ".pdf,.jpg,.jpeg,.png")}
                            className="step-card__file-input"
                            onChange={(e) => {
                              const f = e.target.files?.[0] ?? null;
                              setFiles((prev) => ({ ...prev, [idDetalle]: f }));
                            }}
                            disabled={busyUpload}
                          />

                          <label htmlFor={`file-${idDetalle}`} className="step-card__upload-btn">
                            Seleccionar archivo
                          </label>

                          {files[idDetalle] && <span className="step-card__file-name">{files[idDetalle]?.name}</span>}
                        </div>

                        <button
                          type="button"
                          className="btn btn-xs"
                          disabled={busyUpload || !files[idDetalle]}
                          onClick={() => handleUploadAndComplete(detalle, paso)}
                          title="Subir y completar"
                        >
                          {busyUpload ? "Subiendo…" : "Subir ✓"}
                        </button>
                      </>
                    ) : (
                      <div className="step-card__notes">
                        <p className="step-card__note">{detalle.Notas}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <button className="btn btn-xs" onClick={onClose}>
        Cerrar
      </button>
    </section>
  );
};


