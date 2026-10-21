import React from "react";
import type { DateRange, GetAllOpts, SortDir, SortField } from "../../../../models/Commons";
import type { HabeasData } from "../../../../models/HabeasData";
import { buildHabeasServerFilter } from "../utils/habeasFilters";
import { useDebouncedValue } from "../../../Common/debounce";
import { useGestorServices } from "../../../../graph/graphContext";

export function useHabeasList(username: string) {
  const {HabeasData} = useGestorServices()

  const [baseRows, setBaseRows] = React.useState<HabeasData[]>([]);
  const [rows, setRows] = React.useState<HabeasData[]>([]);
  const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);
  const [search, setSearch] = React.useState<string>("");
  const [range, setRange] = React.useState<DateRange>({from: "", to: ""})


  const debouncedSearch = useDebouncedValue(search, 250);

  const loadBase = React.useCallback(async (): Promise<{nextLink: string | null, ok: boolean, message: string}>  => {
    if (!username) return{
      message: "No hay usuario loggeado",
      nextLink: null,
      ok: false
    };

    try {
      const opts: GetAllOpts = buildHabeasServerFilter(range,);
      const { items, nextLink } = await HabeasData.getAll(opts);
      setBaseRows(items ?? []);
      return {
        message: "Exitoso",
        nextLink,
        ok: true
      }
      
    } catch (e: any) {
      setBaseRows([]);
      setRows([]);
      return {
        message: "Ocurrio un error " + e,
        nextLink: null,
        ok: false
      }
    }
  }, [range, username]);

  const loadFirstPage = React.useCallback(async () => {
    await loadBase();
  }, [loadBase]);

  const toggleSort = React.useCallback((field: SortField, additive = false) => {
    setSorts(prev => {
      const idx = prev.findIndex(s => s.field === field);

      if (!additive) {
        if (idx >= 0) {
          const dir: SortDir = prev[idx].dir === "desc" ? "asc" : "desc";
          return [{ field, dir }];
        }
        return [{ field, dir: "asc" }];
      }

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { field, dir: copy[idx].dir === "desc" ? "asc" : "desc" };
        return copy;
      }

      return [...prev, { field, dir: "asc" }];
    });
  }, []);

  return {
    rows, range, search, sorts,  setRange, setSearch, setSorts, setRows, toggleSort, loadBase, debouncedSearch, baseRows, loadFirstPage
  };
}