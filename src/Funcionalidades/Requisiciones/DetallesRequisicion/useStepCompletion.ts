import { useAuth } from "../../../auth/authProvider";
import type { detalleRequisicion, pasoRequisicion } from "../../../models/Requisiciones/pasos";
import type { RequisicionesService } from "../../../Services/Requisiciones/Requisiciones.service";
import { calcularEstadoCierre } from "../Requisicion/utils/requisicionesCalcularEstadoCierre";
import type { RequisicionDecisionMap, RequisicionReasonMap } from "./types";
import { calculatePorcentaje } from "./utils";
import { notify } from '../../../utils/notify';

interface UpdateSvc {
  update: (id: string, payload: Partial<Omit<detalleRequisicion, "Id">>) => Promise<any>;
}

interface Params {
  detailsService: UpdateSvc;
  requisicionesService: RequisicionesService;
  templates: pasoRequisicion[];
  details: detalleRequisicion[];
  byTemplateId: Record<string, pasoRequisicion>;
  decisiones: RequisicionDecisionMap;
  motivos: RequisicionReasonMap;
}

export function useStepCompletion({
  detailsService,
  requisicionesService,
  templates,
  details,
  byTemplateId,
  decisiones,
  motivos,
}: Params) {
  const { account } = useAuth();

  function isCompleted(estado: string): boolean {
    const normalizedEstado = estado.trim().toLocaleLowerCase();
    return normalizedEstado === "completado" || normalizedEstado === "omitido";
  }

  async function updatePorcentajeRequisicion(
    detalle: detalleRequisicion,
    siguienteEstado: "Completado" | "Omitido"
  ) {
    const requisicionId = String(detalle.IdRequisicion ?? "").trim();

    if (!requisicionId) return;

    const updatedDetails = details.map((item) =>
      item.Id === detalle.Id
        ? {
            ...item,
            Estado: siguienteEstado,
          }
        : item
    );

    const porcentaje = calculatePorcentaje(templates, updatedDetails);
    if(porcentaje === 100) {
      const estadoCierre = await calcularEstadoCierre(requisicionId, requisicionesService);
      await requisicionesService.update(requisicionId, { Estado: "Completada", cumpleANS: estadoCierre });
    };
    await requisicionesService.update(requisicionId, { porceranje: porcentaje });
  }

  const handleCompleteStep = async (
    detalle: detalleRequisicion,
    estado: "Completado" | "Omitido" = "Completado"
  ): Promise<{ ok: boolean; message: string }> => {
    const idDetalle = detalle.Id;
    const estadoResuelto = isCompleted(detalle.Estado);
    const estadoAnterior = detalle.Estado;
    const userName = account?.name ?? account?.username ?? "";

    if (!idDetalle) {
      return {
        message: "El detalle enviado no contiene ID",
        ok: false,
      };
    }

    const templateId = String(detalle.Title ?? "");
    const paso = byTemplateId[templateId] ?? null;

    if (!paso) {
      console.error("No se encontro la plantilla del paso", { templateId, detalle, byTemplateId });
      notify.auto("No se encontro la plantilla del paso.");
      return {
        message: "No se encontro la plantilla del paso",
        ok: false,
      };
    }

    if (estadoResuelto) {
      notify.auto(`Este paso ya se encuentra en estado ${estadoAnterior}`);
      return {
        message: `Este paso ya se encuentra en estado ${estadoAnterior}`,
        ok: false,
      };
    }

    if (estado === "Omitido") {
      await detailsService.update(idDetalle, {
        Estado: "Omitido",
        CompletadoPor: userName,
        FechaCompletadoPor: new Date().toISOString(),
        Notas: detalle.Notas || "Paso omitido",
      });

      await updatePorcentajeRequisicion(detalle, "Omitido");

      return {
        message: "Paso omitido con exito",
        ok: true,
      };
    }

    const tipoPaso = String(paso.TipoPaso ?? "");
    let notas = detalle.Notas ?? "";

    if (tipoPaso === "Aprobacion") {
      const decision = decisiones[idDetalle] ?? "";
      const motivo = (motivos[idDetalle] ?? "").toString().trim();

      if (!decision) {
        notify.auto("Debe seleccionar un estado");
        return {
          message: "Debe seleccionar un estado",
          ok: false,
        };
      }

      if (decision === "Rechazado" && !motivo) {
        notify.auto("Debe indicar el motivo del rechazo");
        return {
          message: "Debe indicar el motivo del rechazo",
          ok: false,
        };
      }

      notas = decision === "Rechazado" ? `Rechazado con el motivo: ${motivo}` : "Aprobado";
    }

    if (tipoPaso === "Texto") {
      const motivo = (motivos[idDetalle] ?? "").toString().trim();
      if (!motivo) {
        notify.auto("Debe diligenciar el texto del paso");
        return {
          message: "Debe diligenciar el texto del paso",
          ok: false,
        };
      }
      notas = motivo;
    }

    if (tipoPaso === "Numerico") {
      const valor = (motivos[idDetalle] ?? "").toString().trim();
      if (!valor) {
        notify.auto("Debe diligenciar el valor numerico del paso");
        return {
          message: "Debe diligenciar el valor numerico del paso",
          ok: false,
        };
      }
      notas = valor;
    }

    await detailsService.update(idDetalle, {
      Estado: "Completado",
      CompletadoPor: userName,
      FechaCompletadoPor: new Date().toISOString(),
      Notas: notas,
    });

    await updatePorcentajeRequisicion(detalle, "Completado");

    return {
      message: "Se ha completado el paso con exito",
      ok: true,
    };
  };

  return { handleCompleteStep };
}


