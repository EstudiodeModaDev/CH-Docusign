import React from "react";

import { CARGO_CIUDAD_ANALISTA_MESSAGES } from "../utils/cargoCiudadAnalistaMessages";
import type { cargoCiudadAnalistaService } from "../../../../Services/cargoCiudadAnalista.service";
import type { cargoCiudadAnalista } from "../../../../models/requisiciones";

type UseCargoCiudadAnalistaQueriesParams = {
  service: cargoCiudadAnalistaService;
};

export function useCargoCiudadAnalistaQueries({service,}: UseCargoCiudadAnalistaQueriesParams) {
  const [rows, setRows] = React.useState<cargoCiudadAnalista[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadItems = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await service.getAll();
      setRows(items);
    } catch (e: any) {
      setRows([]);
      setError(e?.message ?? CARGO_CIUDAD_ANALISTA_MESSAGES.loadError);
    } finally {
      setLoading(false);
    }
  }, [service]);

  const lookForAnalistaEncargado = React.useCallback(async (cargoSeleccionado: string, ciudadSeleccionada: string): Promise<cargoCiudadAnalista | null> => {
    //Buscar analista encargado por ciudad
      const items = await service.getAll({filter: `fields/Cargo eq '${cargoSeleccionado}' and fields/Ciudad eq '${ciudadSeleccionada}'`,});
      return items[0] ?? null;
    },
    [service]
  );

  const existsCargoCiudad = React.useCallback(async (cargo: string, ciudad: string, excludeId?: string): Promise<boolean> => {
    //Validar si ya existe la combinación de cargo y ciudad
    const items = await service.getAll({filter: `fields/Cargo eq '${cargo}' and fields/Ciudad eq '${ciudad}'`,});

      if (!excludeId) return items.length > 0;

      return items.some((item) => item.Id !== excludeId);
    },
    [service]
  );

  React.useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    rows,
    setRows,
    loading,
    setLoading,
    error,
    setError,
    loadItems,
    lookForAnalistaEncargado,
    existsCargoCiudad,
  };
}