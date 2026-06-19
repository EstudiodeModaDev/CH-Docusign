import * as React from "react";
import "../PasosPromocion.css";
import { useCoreGraphServices, useGestorServices } from "../../../../../graph/graphContext";
import type { DetallesPasos, PasosProceso } from "../../../../../models/Pasos";
import type { GraphFileAttachment, GraphSendMailPayload } from "../../../../../graph/graphRest";
import { toUnifyVM, type Proceso } from "../../../../../utils/unify";
import { parseEmails, renderTemplate, safeString } from "../../../../../utils/text";
import type { PropsProceso } from "../../../../../models/Props";
import { spDateToDDMMYYYY } from "../../../../../utils/Date";
import { SimpleFileUpload } from "../../../../GD/AddFile/AddFile";
import { notify } from "../../../../../utils/notify";
import { blobToBase64 } from "../../../../../utils/Images";
import { detectTipoPaso, getCurrentDetalle, isEstadoDone, normalizeProcessText, sanitizeFileName, toRecipients, type EstadoFinal, withSuffix,} from "./processCesacion.helpers";
import { ApprovalStepContent, NotificationStepContent, StepCompletionNotes, UploadStepContent,} from "./processCesacionSections";

export const ProcessDetail: React.FC<PropsProceso> = ({detallesRows, loadingDetalles, errorDetalles, loadDetalles, titulo, selectedCesacion, onClose, loadingPasos, errorPasos, pasosById, decisiones, motivos, setMotivos, setDecisiones, handleCompleteStep, proceso,}) => {
  const { ColaboradoresDH, ColaboradoresEDM, ColaboradoresDenim, ColaboradoresVisual, ColaboradoresMeta, ColaboradoresBroken,} = useGestorServices();
  const { mail } = useCoreGraphServices();

  const vm = toUnifyVM(proceso as Proceso, selectedCesacion as any);

  const [files, setFiles] = React.useState<Record<string, File | null>>({});
  const [destinatario, setDestinatario] = React.useState("");
  const [asunto, setAsunto] = React.useState("");
  const [cuerpo, setBody] = React.useState("");
  const [mailAttachments, setMailAttachments] = React.useState<File[]>([]);
  const [sending, setSending] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [isCustomBody, setIsCustomBody] = React.useState(false);
  const [uploadPicker, setUploadPicker] = React.useState<{
    idDetalle: string;
    label: string;
    accept: string;
  } | null>(null);
  const uploadingRef = React.useRef(false);

  const catalogReady = Object.keys(pasosById ?? {}).length > 0;

  const currentDetalle = React.useMemo(() => getCurrentDetalle(detallesRows), [detallesRows]);

  const currentPaso = React.useMemo(() => {
    if (!currentDetalle) return null;
    return pasosById?.[currentDetalle.NumeroPaso] ?? null;
  }, [currentDetalle, pasosById]);

  const templateData = React.useMemo(
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
    const tplBody = String(currentPaso?.PlantillaCorreo ?? "");
    if (tplBody.trim() && !isCustomBody) {
      setBody((prev) => (prev?.trim() ? prev : renderTemplate(tplBody, templateData)));
    }

    const tplSubject = String(currentPaso?.PlantillaAsunto ?? "");
    if (tplSubject.trim()) {
      setAsunto((prev) => (prev?.trim() ? prev : renderTemplate(tplSubject, templateData)));
    }

    setDestinatario((prev) => (prev?.trim() ? prev : vm?.correoElectronico ?? ""));
  }, [
    currentPaso?.PlantillaAsunto,
    currentPaso?.PlantillaCorreo,
    isCustomBody,
    templateData,
    vm?.correoElectronico,
  ]);

  const handleSubmit = async (detalle: DetallesPasos, estado: EstadoFinal) => {
    await handleCompleteStep(detalle, estado);
    await loadDetalles();
  };

  const handleSkipStep = async (detalle: DetallesPasos) => {
    if (isEstadoDone(detalle?.EstadoPaso)) return;
    await handleSubmit(detalle, "Omitido");
  };

  const handleSelectFile = React.useCallback(
    async (_path: string, file: File) => {
      if (!uploadPicker?.idDetalle) return;
      setFiles((prev) => ({ ...prev, [uploadPicker.idDetalle]: file }));
      setUploadPicker(null);
    },
    [uploadPicker]
  );

  const handleAddMailAttachments = React.useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles?.length) return;
    const files = Array.from(selectedFiles)
    console.log(files)

    setMailAttachments((prev) => {
      const next = [...prev];

      for (const file of Array.from(files)) {

        next.push(file);
      }

      return next;
    });
  }, []);

  const handleRemoveMailAttachment = React.useCallback((index: number) => {
    setMailAttachments((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }, []);

  const handleUploadAndComplete = async (detalle: DetallesPasos, paso: PasosProceso | null) => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    setUploading(true);

    try {
      const idDetalle = detalle.Id ?? "";
      const file = files[idDetalle];

      if (!file) {
        notify.auto("Debes seleccionar un archivo antes de subirlo");
        return;
      }

      const numeroDoc = normalizeProcessText(vm?.numeroDoc ?? "");
      const nombre = normalizeProcessText(vm?.nombre ?? "");
      const empresa = normalizeProcessText(vm?.empresa?.toLowerCase() ?? "");

      if (!numeroDoc || !nombre) {
        notify.auto("Faltan datos del colaborador: número de documento o nombre.");
        return;
      }

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
                  : empresa === "broken"
                    ? ColaboradoresBroken
                    : null;

      if (!servicioColaboradores) {
        notify.auto(`Empresa no reconocida para subida de archivos: ${vm?.empresa ?? "sin empresa"}`);
        return;
      }

      const ext = (file.name.split(".").pop() ?? "pdf").trim();
      const evidenciaRaw = normalizeProcessText(paso?.NombreEvidencia ?? paso?.NombrePaso ?? "Evidencia");
      const baseSafe = sanitizeFileName(`${numeroDoc} - ${evidenciaRaw}`);
      const folderName = `${numeroDoc} - ${nombre}`;
      const carpetaFallback = `Colaboradores Activos/${folderName}`;

      let targetFolderId: string | null = null;

      try {
        const found = await servicioColaboradores.findFolderByDocNumber(numeroDoc);
        if (found?.id) targetFolderId = found.id;
      } catch {
        targetFolderId = null;
      }

      let uploadedName: string | null = null;
      let lastErr: unknown = null;

      for (let index = 0; index <= 15; index++) {
        const candidate =
          index === 0 ? `${baseSafe}.${ext}` : `${withSuffix(baseSafe, index)}.${ext}`;

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
        } catch (error: any) {
          const message = (error?.message ?? "").toLowerCase();
          const status = error?.status ?? error?.response?.status;

          if (
            status === 409 ||
            message.includes("incompatible with a similar name") ||
            message.includes("409")
          ) {
            lastErr = error;
            continue;
          }

          throw error;
        }
      }

      if (!uploadedName) throw lastErr;

      await handleSubmit(detalle, "Completado");
      setFiles((prev) => ({ ...prev, [idDetalle]: null }));
      notify.auto("Archivo subido y paso completado correctamente");
    } catch (error: any) {
      console.error("[UPLOAD] error:", error);
      notify.auto("Error subiendo archivo: " + (error?.message ?? String(error)));
    } finally {
      setUploading(false);
      uploadingRef.current = false;
    }
  };

  const buildMailAttachments = async (attachments: File[]): Promise<GraphFileAttachment[]> => {
    return Promise.all(
      attachments.map(async (file) => ({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: file.name,
        contentType: file.type || "application/octet-stream",
        contentBytes: await blobToBase64(file),
      }))
    );
  };

  const sendNotification = async (
    toList: string[],
    subject: string,
    htmlBody: string,
    attachments: File[]
  ) => {
    const payload: GraphSendMailPayload = {
      message: {
        subject,
        body: { contentType: "HTML", content: htmlBody },
        toRecipients: toRecipients(toList),
        ...(attachments.length ? { attachments: await buildMailAttachments(attachments) } : {}),
      },
    };
    await mail.sendEmail(payload);
  };

  const handleSendAndComplete = async (detalle: DetallesPasos) => {
    if (isEstadoDone(detalle.EstadoPaso)) return;

    const destinos = parseEmails(destinatario);

    if (!destinos.length) {
      notify.auto("Ingresa al menos un correo válido (separa por coma o punto y coma).");
      return;
    }

    if (!asunto.trim()) {
      notify.auto("El asunto no puede estar vacío.");
      return;
    }

    if (!cuerpo || !cuerpo.trim()) {
      notify.auto("El mensaje no puede estar vacío.");
      return;
    }

    setSending(true);
    try {
      await sendNotification(destinos, asunto, cuerpo, mailAttachments);
      await handleSubmit(detalle, "Completado");
      setAsunto("");
      setBody("");
      setMailAttachments([]);
      notify.auto("Notificación enviada.");
    } catch (error: any) {
      console.error(error);
      notify.auto("Error enviando notificación: " + (error?.message ?? error));
    } finally {
      setSending(false);
    }
  };

  const handleApproveAndComplete = async (detalle: DetallesPasos) => {
    const idDetalle = detalle.Id ?? "";
    const decision = (decisiones[idDetalle] ?? "") as "" | "Aceptado" | "Rechazado";
    const motivo = safeString(motivos[idDetalle] ?? "");

    if (!decision) {
      notify.auto("Selecciona Aceptado o Rechazado.");
      return;
    }

    if (decision === "Rechazado" && !motivo.trim()) {
      notify.auto("Debes ingresar el motivo del rechazo.");
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
          const paso: PasosProceso | null = pasosById?.[detalle.NumeroPaso] ?? null;
          const previous = detallesRows[index - 1];
          const prevDone = index === 0 ? true : isEstadoDone(previous?.EstadoPaso);
          const isVisible = index === 0 || prevDone;

          if (!isVisible) return null;

          const isCompleted = detalle.EstadoPaso === "Completado";
          const isOmitted = detalle.EstadoPaso === "Omitido";
          const isDone = isCompleted || isOmitted;
          const tipoPaso = detectTipoPaso(paso);
          const canSkip = !(paso?.Obligatorio ?? true) && !isDone;

          return (
            <article key={idDetalle} className="step-card">
              <div className="step-card__header">
                <h3 className="step-card__name">{paso?.NombrePaso ?? "Paso sin nombre"}</h3>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`step-card__status step-card__status--${isDone ? "done" : "pending"}`}>
                    {detalle.EstadoPaso}
                  </span>

                  {canSkip && (
                    <button
                      type="button"
                      className="btn btn-xs"
                      onClick={() => handleSkipStep(detalle)}
                      title="Omitir este paso"
                    >
                      Omitir
                    </button>
                  )}
                </div>
              </div>

              <div className="step-card__body">
                {tipoPaso === "Aprobacion" && (
                  <ApprovalStepContent
                    idDetalle={idDetalle}
                    isDone={isDone}
                    catalogReady={catalogReady}
                    decision={(decisiones[idDetalle] ?? "") as "" | "Aceptado" | "Rechazado"}
                    motivo={motivos[idDetalle] ?? ""}
                    setDecisiones={setDecisiones}
                    setMotivos={setMotivos}
                    onApprove={() => handleApproveAndComplete(detalle)}
                  />
                )}

                {tipoPaso === "Notificacion" && (
                  <NotificationStepContent
                    isDone={isDone}
                    busySend={sending}
                    destinatario={destinatario}
                    asunto={asunto}
                    cuerpo={cuerpo}
                    attachments={mailAttachments}
                    setDestinatario={setDestinatario}
                    setAsunto={setAsunto}
                    setBody={setBody}
                    setIsCustomBody={setIsCustomBody}
                    onAddAttachments={handleAddMailAttachments}
                    onRemoveAttachment={handleRemoveMailAttachment}
                    onSend={() => handleSendAndComplete(detalle)}
                  />
                )}

                {tipoPaso === "SubidaDocumento" && (
                  <UploadStepContent
                    idDetalle={idDetalle}
                    isDone={isDone}
                    busyUpload={uploading}
                    file={files[idDetalle] ?? null}
                    pasoNombreEvidencia={paso?.NombreEvidencia}
                    pasoNombre={paso?.NombrePaso}
                    pasoAceptaTipos={paso?.AceptaTipos}
                    onOpenPicker={setUploadPicker}
                    onUpload={() => handleUploadAndComplete(detalle, paso)}
                  />
                )}

                <StepCompletionNotes
                  isOmitted={isOmitted}
                  isCompleted={isCompleted}
                  completadoPor={detalle.CompletadoPor}
                  fechaCompletacion={detalle.FechaCompletacion}
                  notas={detalle.Notas}
                />
              </div>
            </article>
          );
        })}
      </div>

      <button className="btn btn-xs" onClick={onClose}>
        Cerrar
      </button>

      {uploadPicker ? (
        <SimpleFileUpload
          folderPath={uploadPicker.label}
          pathLabel="Documento requerido:"
          title="Seleccionar archivo"
          confirmLabel="Usar archivo"
          accept={uploadPicker.accept}
          hideNameInput
          fileHint={`Formatos permitidos: ${uploadPicker.accept}`}
          onClose={() => setUploadPicker(null)}
          handleUploadClick={handleSelectFile}
        />
      ) : null}
    </section>
  );
};
