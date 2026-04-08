import React from "react";
import type { PasosProceso,  } from "../../../../models/Pasos";
import { buildStepsMap, findStepByKey } from "../utils/stepMaps";


type GetAllFn = (args?: any) => Promise<PasosProceso[]>;
type updateFn = (id: string, payload: any) => Promise<PasosProceso>;

interface UseStepsCatalogParams {
  getAll: GetAllFn;
  update: updateFn;
  orderby?: string;
  includeInactive?: boolean;
  defaultLoadAll?: boolean;
}

export function useStepsCatalog({getAll, update, orderby = "fields/Orden asc", includeInactive = true,}: UseStepsCatalogParams) {
  const [rows, setRows] = React.useState<PasosProceso[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  //cargar los pasos de la tabla necesitada pasando el getAll desde el componente padre, para mantener esta lógica de carga y estado en este hook reutilizable.
  const load = React.useCallback(async (all = includeInactive): Promise<PasosProceso[]> => {
    setLoading(true);
    setError(null);

    try {
      const items = await getAll({ orderby });
      console.log(items)
      const filtered = all ? items : items.filter(i => i.Activado === true);
      setRows(filtered);
      return filtered;
    } catch (e: any) {
      setError(e?.message ?? "Error cargando pasos");
      setRows([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getAll, orderby, includeInactive]);

  const desactivate = React.useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await update(id, { Activado: false });
      return true;
    } catch (e: any) {
      setError(e?.message ?? "Error desactivando el paso");
      return false
    } finally {
      setLoading(false);
    }
  }, []);

  const activate = React.useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await update(id, { Activado: true });
      return true;
    } catch (e: any) {
      setError(e?.message ?? "Error activando el paso");
      return false
    } finally {
      setLoading(false);
    }
  }, []);

  //Construir un mapa de pasos por Orden para facilitar la búsqueda y acceso a los datos de cada paso.
  const byId = React.useMemo(() => buildStepsMap(rows,), [rows,]);

  const searchStep = React.useCallback(
    (idPaso: string) => findStepByKey(byId, idPaso),
    [byId]
  );

  return {
    rows,
    loading,
    error,
    byId,
    searchStep,
    load,
    desactivate,
    activate
  };
}