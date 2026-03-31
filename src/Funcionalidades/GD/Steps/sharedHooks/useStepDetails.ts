import React from "react";
import type { DetallesPasos, PasosProceso, Procesos } from "../../../../models/Pasos";

import { shouldActivate } from "../../StepRules/pasoActivationResolver";
import { buildDetailCreatePayload } from "../utils/stepPayloads";
import { calculateCompletedPercentage } from "../utils/stepProgress";


interface DetailsService {
  getAll: (args?: any) => Promise<DetallesPasos[]>;
  create: (payload: any) => Promise<any>;
}

interface Params {
  detailsService: DetailsService;
  selected?: string;
  activationModule: Procesos;
  entityLabel?: string;
  graph: any;
  sortItems?: (items: DetallesPasos[]) => DetallesPasos[];
}

export function useStepDetails({detailsService, selected, activationModule, graph, sortItems,}: Params) {
  const [rows, setRows] = React.useState<DetallesPasos[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      alert("No hay un proceso definido");
      return;
    }

    try {
      const creates: Promise<any>[] = [];

      for (const paso of pasos) {
        const idPaso = String(paso.Id ?? "");
        const aplica = await shouldActivate(activationModule, idPaso, cargoNegocio, graph);

        if (!aplica) continue;

        creates.push(detailsService.create(buildDetailCreatePayload(entityId, paso)));
      }

      if (creates.length === 0) {
        alert("No hay pasos aplicables para este cargo.");
        return;
      }

      await Promise.all(creates);
    } catch (e) {
      console.error("Error creando pasos", e);
      alert("Ha ocurrido un error");
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