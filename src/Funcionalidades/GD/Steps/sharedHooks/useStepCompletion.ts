import { useAuth } from "../../../../auth/authProvider";
import type { DetallesPasos, PasosProceso, StepDecisionMap, StepReasonMap } from "../../../../models/Pasos";
import { buildCompletedStepPayload, buildOmitStepPayload } from "../utils/stepPayloads";


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

  //Funcion para completar un paso
  const handleCompleteStep = async (detalle: DetallesPasos, estado: string) => {
    const idDetalle = detalle.Id;
    console.log(idDetalle)
    if (!idDetalle) return;
    console.log("Paso")
    const paso = byId[detalle.NumeroPaso] ?? null;
    if (!paso) return;
    console.log("Paso encontrado", paso)
    const estadoAnterior = detalle.EstadoPaso;
    if (estadoAnterior === "Completado" || estadoAnterior === "Omitido") return;

    const userName = account?.name ?? "";
    const tipoPaso = String(paso.TipoPaso ?? "");

    if (estado === "Omitido") {
      await detailsService.update(idDetalle, buildOmitStepPayload(userName));
      alert("Paso omitido");
      return;
    }

    console.log(detalle)
    console.log(paso)
    console.log(estado)
    if (tipoPaso === "SubidaDocumento") {
      const a = await detailsService.update(idDetalle, buildCompletedStepPayload(userName, "Archivo subido"));
      console.log(a)
      alert("Se ha completado con éxito");
      return;
    }

    if (tipoPaso === "Aprobacion") {
      const decision = decisiones[idDetalle] ?? "";
      const motivo = (motivos[idDetalle] ?? "").toString();

      if (!decision) {
        alert("Debe seleccionar un estado");
        return;
      }

      if (decision === "Rechazado" && !motivo.trim()) {
        alert("Debe indicar el motivo del rechazo");
        return;
      }

      const notas =
        decision === "Rechazado"
          ? `Rechazado con el motivo: ${motivo}`
          : "Aceptado";

      await detailsService.update(idDetalle, buildCompletedStepPayload(userName, notas));
      alert("Se ha completado con éxito");
      return;
    }

    if (tipoPaso === "Notificacion") {
      await detailsService.update(idDetalle, buildCompletedStepPayload(userName, "Notificación enviada"));
      alert("Se ha completado con éxito");
      return;
    }

    await detailsService.update(idDetalle, buildCompletedStepPayload(userName));
    alert("Se ha completado con éxito");
  };

  return { handleCompleteStep };
}