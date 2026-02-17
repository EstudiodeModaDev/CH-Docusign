import * as React from "react";
import "../PasosPromocion.css";
import { useGraphServices } from "../../../../../graph/graphContext";
import type { DetallesPasos, PasosProceso } from "../../../../../models/Cesaciones";
import type { GraphSendMailPayload } from "../../../../../graph/graphRest";
import { toUnifyVM, type Proceso } from "../../../../../utils/unify";
import RichTextBase64 from "../../../../RichText/RichText";
import { parseEmails, renderTemplate, safeString } from "../../../../../utils/text";
import type { PropsProceso } from "../../../../../models/Props";
import { spDateToDDMMYYYY } from "../../../../../utils/Date";

export type TipoPaso = "Aprobacion" | "Notificacion" | "SubidaDocumento";
type EstadoFinal = "Completado" | "Omitido";

function toRecipients(addresses: string[]) {
  return addresses.map((address) => ({ emailAddress: { address } }));
}

function sanitizeFileName(name: string) {
  // caracteres no permitidos en OneDrive/SharePoint
  const bad = /["*:<>\?\/\\|]/g;
  let n = (name ?? "").replace(bad, "-").trim();
  // evitar terminar en punto/espacio
  n = n.replace(/[\. ]+$/g, "");
  // evitar dobles espacios
  n = n.replace(/\s+/g, " ");
  return n || "Evidencia";
}

function withSuffix(name: string, i: number) {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return `${name} (${i})`;
  return `${name.slice(0, dot)} (${i})${name.slice(dot)}`;
}

export const ProcessDetail: React.FC<PropsProceso> = ({detallesRows, loadingDetalles, errorDetalles, loadDetalles, titulo, selectedCesacion, onClose, loadingPasos, errorPasos, pasosById, decisiones, motivos, setMotivos, setDecisiones, handleCompleteStep, proceso,}) => {
  const {ColaboradoresDH,  ColaboradoresEDM, ColaboradoresDenim, ColaboradoresVisual, ColaboradoresMeta, mail,}: any = useGraphServices();

  const vm = React.useMemo(() => {
    return toUnifyVM(proceso as Proceso, selectedCesacion as any);
  }, [proceso, selectedCesacion]);

  const [files, setFiles] = React.useState<Record<string, File | null>>({});
  const [destinatario, setDestinatario] = React.useState<string>("");
  const [asunto, setAsunto] = React.useState<string>("");
  const [cuerpo, setBody] = React.useState<string>("");
  const [sending, setSending] = React.useState<boolean>(false);
  const [uploading, setUploading] = React.useState<boolean>(false);
  const [isCustomBody, setIsCustomBody] = React.useState<boolean>(false);

  const detectTipoPaso = (paso: any): TipoPaso => {
    const t = paso?.TipoPaso ?? "";
    if (t === "Aprobacion" || t === "Notificacion" || t === "SubidaDocumento") return t;
    return "Aprobacion";
  };

  const isEstadoDone = (estado?: string | null) => estado === "Completado" || estado === "Omitido";

  /** ======= PASO ACTUAL (1ero desbloqueado y pendiente) ======= */
  const currentDetalle = React.useMemo(() => {
    if (!detallesRows?.length) return null;

    for (let i = 0; i < detallesRows.length; i++) {
      const d = detallesRows[i];
      const prev = detallesRows[i - 1];

      const unlocked = i === 0 || isEstadoDone(prev?.EstadoPaso);
      const isPending = !isEstadoDone(d?.EstadoPaso);

      if (unlocked && isPending) return d;
    }

    return detallesRows[detallesRows.length - 1] ?? null;
  }, [detallesRows]);

  const currentPaso = React.useMemo(() => {
    if (!currentDetalle) return null;
    return pasosById?.[currentDetalle.NumeroPaso] ?? null;
  }, [currentDetalle, pasosById]);

  const data = React.useMemo(
    () => ({
      nombre: vm?.nombre ?? "",
      numeroDoc: vm?.numeroDoc ?? "",
      empresa: vm?.empresa ?? "",
      cargo: vm?.cargo ?? "",
      fecha_ingreso: spDateToDDMMYYYY(vm?.fechaIngreso ?? ""),
      tipo_trabajo: vm?.tipoTel ?? "",
    }),
    [vm?.nombre, vm?.numeroDoc, vm?.empresa, vm?.cargo, vm?.fechaIngreso, vm?.tipoTel]
  );

  React.useEffect(() => {
    // BODY
    const tplBody = String(currentPaso?.PlantillaCorreo ?? "");
    if (tplBody.trim() && !isCustomBody) {
      setBody((prev) => (prev?.trim() ? prev : renderTemplate(tplBody, data)));
    }

    // ASUNTO
    const tplSubject = String(currentPaso?.PlantillaAsunto ?? "");
    if (tplSubject.trim()) {
      setAsunto((prev) => (prev?.trim() ? prev : renderTemplate(tplSubject, data)));
    }

    // PARA
    setDestinatario((prev) => (prev?.trim() ? prev : vm?.correoElectronico ?? ""));
  }, [currentPaso?.PlantillaCorreo, currentPaso?.PlantillaAsunto, data, isCustomBody, vm?.correoElectronico]);

  /** ======= Completar u Omitir ======= */
  const handleSubmit = async (detalle: DetallesPasos, estado: EstadoFinal) => {
    await handleCompleteStep(detalle, estado);
    await loadDetalles();
  };

  const handleSkipStep = async (detalle: DetallesPasos) => {
    if (isEstadoDone(detalle?.EstadoPaso)) return;
    await handleSubmit(detalle, "Omitido");
  };

  /** ======= Subida de documento ======= */
  const uploadingRef = React.useRef(false);

  const handleUploadAndComplete = async (detalle: DetallesPasos, paso: any) => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;

    const idDetalle = detalle.Id ?? "";
    const file = files[idDetalle];

    if (!file) {
      uploadingRef.current = false;
      alert("Debes seleccionar un archivo antes de subirlo");
      return;
    }

    const canon = (s: string) =>
      (s ?? "")
        .toString()
        .normalize("NFKC")
        .replace(/\u00a0/g, " ")
        .replace(/[‐-‒–—―]/g, "-")
        .replace(/\s+/g, " ")
        .trim();

    const empresa = canon(vm?.empresa?.toLowerCase() ?? "");

    const servicioColaboradores =
      empresa === "dh retail"
        ? ColaboradoresDH
        : empresa === "movimiento"
        ? ColaboradoresVisual
        : empresa === "denim head"
        ? ColaboradoresDenim
        : empresa === "estudio de moda"
        ? ColaboradoresEDM
        : empresa === "metagraphics"
        ? ColaboradoresMeta
        : ColaboradoresEDM;

    const ext = (file.name.split(".").pop() ?? "pdf").trim();

    const evidenciaRaw = canon(paso?.NombreEvidencia ?? paso?.NombrePaso ?? "Evidencia");
    const nombreBaseRaw = canon(`${vm?.numeroDoc ?? ""} - ${evidenciaRaw}`);
    const baseSafe = sanitizeFileName(nombreBaseRaw);

    const folderName = canon(`${vm?.numeroDoc ?? ""} - ${vm?.nombre ?? ""}`);
    const carpetaFallback = `Colaboradores Activos/${folderName}`;

    setUploading(true);

    try {
      let targetFolderId: string | null = null;

      try {
        const found = await servicioColaboradores.findFolderByDocNumber(vm.numeroDoc);

        if (found?.id) targetFolderId = found.id;

      } catch {
        // no existe o falló la búsqueda → usamos fallback por ruta
        targetFolderId = null;
      }

      console.log("[UPLOAD] folderId:", targetFolderId, "path:", carpetaFallback);

      let uploadedName: string | null = null;
      let lastErr: any = null;

      for (let i = 0; i <= 15; i++) {
        const candidate = i === 0 ? `${baseSafe}.${ext}` : `${withSuffix(baseSafe, i)}.${ext}`;

        const renamedFile = new File([file], candidate, {
          type: file.type,
          lastModified: file.lastModified,
        });

        try {
          if (targetFolderId) {
            await servicioColaboradores.uploadFileByFolderId(targetFolderId, renamedFile);
          } else {
            await servicioColaboradores.uploadFile(carpetaFallback, renamedFile);
          }

          uploadedName = candidate;
          lastErr = null;
          break;
        } catch (e: any) {
          const msg = (e?.message ?? "").toLowerCase();
          const status = e?.status ?? e?.response?.status;

          if (
            status === 409 ||
            msg.includes("incompatible with a similar name") ||
            msg.includes("409")
          ) {
            lastErr = e;
            continue;
          }

          throw e;
        }
      }

      if (!uploadedName) throw lastErr;

      try {
        await handleSubmit(detalle, "Completado");
      } catch {
        alert(
          `El archivo se subió (${uploadedName}), pero falló completar el paso. ` +
            `Reintenta completar el paso (no necesitas volver a subir).`
        );
        return;
      }

      setFiles((prev) => ({ ...prev, [idDetalle]: null }));
      alert("Archivo subido y paso completado correctamente");
    } catch (e: any) {
      console.error("[UPLOAD] error:", e);
      alert("Error subiendo archivo: " + (e?.message ?? String(e)));
    } finally {
      setUploading(false);
      uploadingRef.current = false;
    }
  };

  /** ======= Notificación ======= */
  const sendNotification = async (toList: string[], subject: string, htmlBody: string) => {
    const payload: GraphSendMailPayload = {
      message: {
        subject,
        body: { contentType: "HTML", content: htmlBody },
        toRecipients: toRecipients(toList),
      },
    };
    await mail.sendEmail(payload);
  };

  const handleSendAndComplete = async (detalle: DetallesPasos) => {
    if (isEstadoDone(detalle.EstadoPaso)) return;

    const destinos = parseEmails(destinatario);

    if (!destinos.length) {
      alert("Ingresa al menos un correo válido (separa por coma o punto y coma).");
      return;
    }

    if (!asunto.trim()) {
      alert("El asunto no puede estar vacío.");
      return;
    }

    if (!cuerpo || !cuerpo.trim()) {
      alert("El mensaje no puede estar vacío.");
      return;
    }

    setSending(true);
    try {
      await sendNotification(destinos, asunto, cuerpo);

      await handleSubmit(detalle, "Completado");
      setAsunto("");
      setBody("");
      alert("Notificación enviada.");
    } catch (e: any) {
      console.error(e);
      alert("Error enviando notificación: " + (e?.message ?? e));
    } finally {
      setSending(false);
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

    await handleSubmit(detalle, "Completado");
  };

  if (loadingPasos || loadingDetalles) return <div>Cargando pasos…</div>;

  if (errorPasos || errorDetalles) {
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
          const paso: PasosProceso | any = pasosById?.[detalle.NumeroPaso] ?? null;

          const previous = detallesRows[index - 1];
          const prevDone = index === 0 ? true : isEstadoDone(previous?.EstadoPaso);
          const isVisible = index === 0 || prevDone;
          if (!isVisible) return null;

          const isCompleted = detalle.EstadoPaso === "Completado";
          const isOmitted = detalle.EstadoPaso === "Omitido";
          const isDone = isCompleted || isOmitted;

          const tipoPaso = detectTipoPaso(paso);

          const busySend = !!sending;
          const busyUpload = !!uploading;

          const obligatorio = paso?.Obligatorio ?? true;
          const canSkip = !obligatorio && !isDone;

          return (
            <article key={idDetalle} className="step-card">
              <div className="step-card__header">
                <h3 className="step-card__name">{paso?.NombrePaso ?? "Paso sin nombre"}</h3>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`step-card__status step-card__status--${isDone ? "done" : "pending"}`}>
                    {detalle.EstadoPaso}
                  </span>

                  {canSkip && (
                    <button type="button" className="btn btn-xs" onClick={() => handleSkipStep(detalle)} title="Omitir este paso">
                      Omitir
                    </button>
                  )}
                </div>
              </div>

              <div className="step-card__body">
                {isOmitted ? (
                  <div className="step-card__notes">
                    <p className="step-card__note">{detalle.Notas || "Paso omitido."}</p>
                  </div>
                ) : (
                  <>
                    {/* ======== APROBACIÓN ======== */}
                    {tipoPaso === "Aprobacion" && (
                      <>
                        {!isDone ? (
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

                            <button type="button" className={`step-card__check ${isDone ? "step-card__check--active" : ""}`} disabled={isDone} onClick={() => handleApproveAndComplete(detalle)} title="Completar paso">
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
                        {!isDone ? (
                          <div className="mail">
                            <div className="mail__topbar">
                              <div className="mail__title">Nuevo mensaje</div>

                              <div className="mail__actions">
                                <button type="button" className="mail__send btn btn-xs"  disabled={busySend} onClick={() => handleSendAndComplete(detalle)} title="Enviar notificación y completar">
                                  {busySend ? "Enviando…" : "Enviar"}
                                </button>
                              </div>
                            </div>

                            <div className="mail__main">
                              <div className="mail__fields">
                                <div className="mail__row">
                                  <div className="mail__label">Para</div>
                                  <input type="text" className="mail__input" placeholder="correo@dominio.com; correo2@gmail.com; correo3@hotmail.com" value={destinatario} onChange={(e) => setDestinatario(e.target.value)} disabled={busySend}/>
                                </div>

                                <div className="mail__row">
                                  <div className="mail__label">Asunto</div>
                                  <input type="text" className="mail__input" placeholder="Asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} disabled={busySend}/>
                                </div>
                              </div>

                              <div className="mail__editor">
                                <RichTextBase64 value={cuerpo} placeholder="Redacta tu mensaje… (HTML permitido)" readOnly={busySend} className="mail__rte-inner" imageSize={{ width: 240, fit: "contain" }} onChange={(html) => {
                                    setIsCustomBody(true);
                                    setBody(html);
                                  }}
                                />
                              </div>
                            </div>
                          </div>
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
                        {!isDone ? (
                          <>
                            <div className="step-card__upload-wrapper">
                              <input
                                id={`file-${idDetalle}`}
                                type="file"
                                disabled={busyUpload}
                                accept={safeString(paso?.AceptaTipos ?? ".pdf,.jpg,.jpeg,.png")}
                                className="step-card__file-input"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] ?? null;
                                  setFiles((prev) => ({ ...prev, [idDetalle]: f }));
                                }}
                              />

                              <label htmlFor={`file-${idDetalle}`} className="step-card__upload-btn">
                                Seleccionar archivo
                              </label>

                              {files[idDetalle] && (
                                <span className="step-card__file-name">{files[idDetalle]?.name}</span>
                              )}
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
