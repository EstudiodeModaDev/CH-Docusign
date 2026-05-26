import React from "react";
import type { detalleRequisicion, pasoRequisicion } from "../../../models/Requisiciones/pasos";
import type { RequisicionStepResolved } from "./types";
import { buildDetailStepMap, resolveStepRows } from "./utils";

type DetailsService = {
  getAllPlain: (args?: any) => Promise<detalleRequisicion[]>;
  create: (payload: any) => Promise<any>;
};

type Params = {
  detailsService: DetailsService;
  requisicionId?: string;
  templates?: pasoRequisicion[];
  sortItems?: (items: detalleRequisicion[]) => detalleRequisicion[];
};

export function useStepDetails({ detailsService, requisicionId, templates = [], sortItems }: Params) {
  const [rows, setRows] = React.useState<detalleRequisicion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (): Promise<detalleRequisicion[]> => {
    if (!requisicionId) {
      setRows([]);
      return [];
    }

    console.log(requisicionId)

    setLoading(true);
    setError(null);

    try {
      const items = await detailsService.getAllPlain({
        filter: `fields/IdRequisicion eq '${String(requisicionId).replace(/'/g, "''")}'`,
      });

      const finalItems = sortItems ? sortItems(items) : items;
      setRows(finalItems);
      return finalItems;
    } catch (e: any) {
      setError(e?.message ?? "Error cargando detalles de requisicion");
      setRows([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [detailsService, requisicionId, sortItems]);

  const byTemplateId = React.useMemo(() => buildDetailStepMap(rows), [rows]);
  const resolvedRows = React.useMemo<RequisicionStepResolved[]>(
    () => resolveStepRows(templates, rows),
    [rows, templates]
  );

  return {
    rows,
    byTemplateId,
    resolvedRows,
    loading,
    error,
    load,
  };
}
