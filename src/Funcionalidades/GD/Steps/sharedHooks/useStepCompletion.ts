import { useAuth } from "../../../../auth/authProvider";
import type { DetallesPasos, PasosProceso, StepDecisionMap, StepReasonMap } from "../../../../models/Pasos";
import { buildCompletedStepPayload, buildOmitStepPayload } from "../utils/stepPayloads";
import { notify } from '../../../../utils/notify';
import { useAuditLog } from "../../../Common/useAuditLog";


interface UpdateSvc {
  update: (id: string, payload: Partial<Omit<DetallesPasos, 'ID'>>) => Promise<any>;
}

interface Params {
  detailsService: UpdateSvc;
  byId: Record<string, PasosProceso>;
  decisiones: StepDecisionMap;
  motivos: StepReasonMap;
}

export function useStepCompletion({detailsService, byId, decisiones, motivos,}: Params) {
  const { account } = useAuth();
  const { withAudit } = useAuditLog("Contrataciones");

  //Funcion para completar un paso
  const handleCompleteStep = async (detalle: DetallesPasos, estado: string) => {
    
    const idDetalle = detalle.Id;
    if (!idDetalle) return;
    console.log("Paso")
    
    //Encontrar el paso correspondiente a este detalle para conocer su tipo y aplicar la lógica de completación correspondiente, dependiendo del tipo de paso.
    const paso = byId[String(detalle.NumeroPaso)] ?? null;
    console.log("Detalle del paso a completar:", detalle); 
    
    if (!paso) {
      console.error("No se encontró el paso", {
        numeroPaso: detalle.NumeroPaso,
        byId,
        detalle,
      });
      notify.auto("No se encontró la configuración del paso.");
      return;
    }

    const estadoAnterior = detalle.EstadoPaso;
    if (estadoAnterior === "Completado" || estadoAnterior === "Omitido"){
      notify.auto(`Este paso ya se encuentra en estado ${estadoAnterior}`);
      return;
    } 

    const userName = account?.name ?? "";
    const tipoPaso = String(paso.TipoPaso ?? "");

    const detalleLog = { proceso_id: detalle.Title, numero_paso: detalle.NumeroPaso, tipo_paso: tipoPaso, estado_anterior: estadoAnterior };
    const auditStep = <T,>(
      accion: "Edicion" | "Aprobacion" | "Rechazo",
      descripcion: string,
      descripcionError: string,
      estadoResultante: string,
      op: () => Promise<T>
    ) => withAudit({ accion, descripcion, descripcionError, id_item_afectado: idDetalle, detalle: { ...detalleLog, estado_resultante: estadoResultante } }, op);

    if (estado === "Omitido") {
      await auditStep("Edicion", "Se omitió un paso de un proceso", "Falló la omisión de un paso de un proceso", "Omitido",
        () => detailsService.update(idDetalle, buildOmitStepPayload(userName)));
      notify.auto("Paso omitido");
      return;
    }

    if (tipoPaso === "SubidaDocumento") {
      const a = await auditStep("Edicion", "Se completó un paso de subida de documento", "Falló la completación de un paso de subida de documento", "Completado",
        () => detailsService.update(idDetalle, buildCompletedStepPayload(userName, "Archivo subido")));
      console.log(a)
      notify.auto("Se ha completado con éxito");
      return;
    }

    if (tipoPaso === "Aprobacion") {
      const decision = decisiones[idDetalle] ?? "";
      const motivo = (motivos[idDetalle] ?? "").toString();

      if (!decision) {
        notify.auto("Debe seleccionar un estado");
        return;
      }

      if (decision === "Rechazado" && !motivo.trim()) {
        notify.auto("Debe indicar el motivo del rechazo");
        return;
      }

      console.log("Paso todos los returns, procediendo a actualizar el paso con la decisión:", decision, "y motivo:", motivo)

      const notas =
        decision === "Rechazado"
          ? `Rechazado con el motivo: ${motivo}`
          : "Aceptado";

      if (decision === "Rechazado") {
        await auditStep("Rechazo", "Se rechazó un paso de aprobación de un proceso", "Falló el rechazo de un paso de aprobación de un proceso", "Completado",
          () => detailsService.update(idDetalle, buildCompletedStepPayload(userName, notas)));
      } else {
        await auditStep("Aprobacion", "Se aprobó un paso de aprobación de un proceso", "Falló la aprobación de un paso de aprobación de un proceso", "Completado",
          () => detailsService.update(idDetalle, buildCompletedStepPayload(userName, notas)));
      }
      notify.auto("Se ha completado con éxito");
      return;
    }

    if (tipoPaso === "Notificacion") {
      await auditStep("Edicion", "Se completó un paso de notificación", "Falló la completación de un paso de notificación", "Completado",
        () => detailsService.update(idDetalle, buildCompletedStepPayload(userName, "Notificación enviada")));
      notify.auto("Se ha completado con éxito");
      return;
    }

    await auditStep("Edicion", "Se completó un paso de un proceso", "Falló la completación de un paso de un proceso", "Completado",
      () => detailsService.update(idDetalle, buildCompletedStepPayload(userName)));
    notify.auto("Se ha completado con éxito");
  };

  return { handleCompleteStep };
}

