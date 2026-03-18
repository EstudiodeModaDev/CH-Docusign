import React from "react";
import { useGraphServices } from "../../../../graph/graphContext";
import type { Envio } from "../../../../models/Envios";
import type { DateRange, SortDir, SortField } from "../../../../models/Commons";
import { buildEnviosFilter } from "../utils/enviosFilters";
import { resolveNextSort } from "../../../Common/resolveSorts";

export function useEnviosList(pageSize: number) {
  const graph = useGraphServices()

  const [rows, setRows] = React.useState<Envio[]>([]);
  const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);
  const [search, setSearch] = React.useState<string>("");
  const [range, setRange] = React.useState<DateRange>({from: "", to: ""})

  const loadFirstPage = React.useCallback(async (): Promise<{nextLink: string | null, ok: boolean, message: string}> => {
    try {
      const { items, nextLink } = await graph.Envios.getAll(buildEnviosFilter(range, pageSize, search, sorts)); 
      setRows(items);
      return {
        nextLink,
        message: "Correcto",
        ok: true
      }
    } catch (e: any) {
      setRows([]);
      return {
        nextLink: null,
        message: e.message,
        ok: false
      }
    } finally {
    }
  }, [sorts, search, range, graph, pageSize]);

  const toggleSort = React.useCallback((field: SortField, additive = false) => {
    setSorts(prev => resolveNextSort(prev, field, additive));
  }, []);

  return {
    rows, range, search, sorts,  setRange, setSearch, setSorts, loadFirstPage, setRows, toggleSort
  };
}