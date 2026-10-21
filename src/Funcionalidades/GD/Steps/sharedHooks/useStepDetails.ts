import React from "react";
import type { DetallesPasos, PasosProceso, Procesos } from "../../../../models/Pasos";

import { shouldActivate } from "../../StepRules/pasoActivationResolver";
import { buildDetailCreatePayload } from "../utils/stepPayloads";
import { calculateCompletedPercentage } from "../utils/stepProgress";
import type { pasoRestriccionProcesoService } from "../../../../Services/PasoRestriccionProceso.Service";
import { notify } from '../../../../utils/notify';
import { useAuditLog } from "../../../Common/useAuditLog";


interface DetailsService {
  getAll: (args?: any) => Promise<DetallesPasos[]>;
  create: (payload: any) => Promise<any>;
}

interface Params {
  detailsService: DetailsService;
  selected?: string;
  activationModule: Procesos;
  entityLabel?: string;
  service: {
    pasoRestriccion: pasoRestriccionProcesoService
  };
  sortItems?: (items: DetallesPasos[]) => DetallesPasos[];
}

export function useStepDetails({detailsService, selected, activationModule, service, sortItems,}: Params) {
  const [rows, setRows] = React.useState<DetallesPasos[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { withAudit } = useAuditLog("Contrataciones");

  //Cargar los detalles de los pasos
  const load = React.useCallback(async (): Promise<DetallesPasos[]> => {
    setLoading(true);
    setError(null);

    try {
      const items = await detailsService.getAll({filter: `fields/Title eq '${selected}'`, orderby: "fields/NumeroPaso asc",});

      const finalItems = sortItems ? sortItems(items) : items;
      setRows(finalItems);
      return finalItems;
    } catch (e: any) {
      setError(e?.message ?? "Error cargando detalles de pasos");
      setRows([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [detailsService, selected, sortItems]);

  //Crear todos los detalles pasos para un proceso dado, aplicando las reglas de activación
  const handleCreateAllSteps = async (pasos: PasosProceso[], entityId: string, cargoNegocio: string) => {
    if (!pasos || pasos.length === 0) {
      notify.auto("No hay un proceso definido");
      return;
    }

    try {
      const creates: Promise<any>[] = [];

      for (const paso of pasos) {
        const idPaso = String(paso.Id ?? "");
        const aplica = await shouldActivate({proceso: activationModule, idPaso, cargo: cargoNegocio, service});

        if (!aplica) continue;

        creates.push(detailsService.create(buildDetailCreatePayload(entityId, paso)));
      }

      if (creates.length === 0) {
        notify.auto("No hay pasos aplicables para este cargo.");
        return;
      }

      // Un solo registro de log para todos los pasos creados.
      await withAudit(
        {
          accion: "Creacion",
          descripcion: "Se crearon los pasos de un proceso",
          descripcionError: "Falló la creación de los pasos de un proceso",
          id_item_afectado: entityId,
          detalle: { proceso: activationModule, pasos_creados: creates.length, pasos_definidos: pasos.length },
        },
        () => Promise.all(creates)
      );
    } catch (e) {
      console.error("Error creando pasos", e);
      notify.auto("Ha ocurrido un error");
    }
  };

  const calcPorcentaje = async (): Promise<number> => {
    const items = await load();
    return calculateCompletedPercentage(items);
  };

  return {
    rows,
    loading,
    error,
    load,
    handleCreateAllSteps,
    calcPorcentaje,
  };
}

