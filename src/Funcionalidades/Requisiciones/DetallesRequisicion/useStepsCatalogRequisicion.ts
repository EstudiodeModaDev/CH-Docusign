import React from "react";
import type { pasoRequisicion } from "../../../models/Requisiciones/pasos";
import { buildTemplateStepMap, sortTemplateSteps } from "./utils";
import { useAuditLog } from "../../Common/useAuditLog";

type GetAllFn = (args?: any) => Promise<pasoRequisicion[]>;
type UpdateFn = (id: string, payload: any) => Promise<pasoRequisicion>;

type UseStepsCatalogParams = {
  getAll: GetAllFn;
  update: UpdateFn;
  orderby?: string;
  includeInactive?: boolean;
};

export function useStepsCatalogRequisicion({
  getAll,
  update,
  orderby = "fields/OrdenPaso asc",
  includeInactive = true,
}: UseStepsCatalogParams) {
  const { withAudit } = useAuditLog("Requisiciones");
  const [rows, setRows] = React.useState<pasoRequisicion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (all = includeInactive): Promise<pasoRequisicion[]> => {
      setLoading(true);
      setError(null);

      try {
        const items = await getAll({ orderby });
        const filtered = all ? items : items.filter((item) => item.Activo === true);
        const ordered = sortTemplateSteps(filtered);
        setRows(ordered);
        return ordered;
      } catch (e: any) {
        setError(e?.message ?? "Error cargando pasos de la plantilla");
        setRows([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [getAll, includeInactive, orderby]
  );

  const desactivate = React.useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await withAudit(
          {
            accion: "Edicion",
            descripcion: "Se desactivó un paso de la plantilla de requisiciones",
            descripcionError: "Falló la desactivación de un paso de la plantilla de requisiciones",
            id_item_afectado: id,
            detalle: { campo_modificado: "Activo", valor_resultante: false },
          },
          () => update(id, { Activo: false })
        );
        return true;
      } catch (e: any) {
        setError(e?.message ?? "Error desactivando el paso");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [update, withAudit]
  );

  const activate = React.useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await withAudit(
          {
            accion: "Edicion",
            descripcion: "Se activó un paso de la plantilla de requisiciones",
            descripcionError: "Falló la activación de un paso de la plantilla de requisiciones",
            id_item_afectado: id,
            detalle: { campo_modificado: "Activo", valor_resultante: true },
          },
          () => update(id, { Activo: true })
        );
        return true;
      } catch (e: any) {
        setError(e?.message ?? "Error activando el paso");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [update, withAudit]
  );

  const byTemplateId = React.useMemo(() => buildTemplateStepMap(rows), [rows]);

  return {
    rows,
    byTemplateId,
    loading,
    error,
    load,
    desactivate,
    activate,
  };
}
