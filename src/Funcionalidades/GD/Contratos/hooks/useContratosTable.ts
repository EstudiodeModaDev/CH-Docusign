import React from "react";
import type { DateRange, GetAllOpts, SortDir, SortField } from "../../../../models/Commons";
import type { ContratosService } from "../../../../Services/Contratos.service";
import type { Novedad } from "../../../../models/Novedades";
import { useDebouncedValue } from "../../../Common/debounce";
import { buildContartosServerFilter, buildContratosReportFilter } from "../utils/contratosFilters";
import { includesSearch } from "../utils/contratosSearch";
import { compareContratos } from "../utils/contratosSort";

export function useContratosTable(contratosSvc: ContratosService, username?: string) {
  const [baseRows, setBaseRows] = React.useState<Novedad[]>([]);
  const [rows, setRows] = React.useState<Novedad[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<DateRange>({ from: "", to: "" });
  const [pageSize, setPageSize] = React.useState(10);
  const [pageIndex, setPageIndex] = React.useState(1);
  const [nextLink, setNextLink] = React.useState<string | null>(null);
  const [sorts, setSorts] = React.useState<Array<{ field: SortField; dir: SortDir }>>([{ field: "id", dir: "desc" } as any,]);
  const [search, setSearch] = React.useState("");
  const [estado, setEstado] = React.useState("proceso");

  const debouncedSearch = useDebouncedValue(search, 250);

  const loadBase = React.useCallback(async () => {
    if (!username) return;

    setLoading(true);
    setError(null);

    try {
      const opts: GetAllOpts = buildContartosServerFilter(estado, range);
      const { items } = await contratosSvc.getAll(opts);
      setBaseRows(items ?? []);
      setPageIndex(1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando cesaciones");
      setBaseRows([]);
      setRows([]);
      setNextLink(null);
      setPageIndex(1);
    } finally {
      setLoading(false);
    }
  }, [estado, range, username]);

  React.useEffect(() => {
    loadBase();
  }, [loadBase]);

  React.useEffect(() => {
    setPageIndex(1);
  }, [debouncedSearch]);

  React.useEffect(() => {
    let data = baseRows;

    if (debouncedSearch.trim()) {
      data = data.filter(r => includesSearch(r, debouncedSearch));
    }

    if (sorts.length) {
      data = [...data].sort((a, b) => {
        for (const s of sorts) {
          const result = compareContratos(a, b, s.field, s.dir);
          if (result !== 0) return result;
        }
        return 0;
      });
    }

    const start = (pageIndex - 1) * pageSize;
    const page = data.slice(start, start + pageSize);

    setRows(page);
    setNextLink(data.length > start + pageSize ? "local" : null);
  }, [baseRows, debouncedSearch, sorts, pageIndex, pageSize]);

  const loadFirstPage = React.useCallback(async () => {
    await loadBase();
    setPageIndex(1);
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

  const nextPage = React.useCallback(async () => {
    if (!nextLink) return;

    if (nextLink === "local") {
      setPageIndex((i) => i + 1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { items, nextLink: n2 } = await contratosSvc.getByNextLink(nextLink);
      setRows(items);
      setNextLink(n2 ?? null);
      setPageIndex((i) => i + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más tickets");
    } finally {
      setLoading(false);
    }
  }, [nextLink,]);

  const loadToReport = React.useCallback(async (from: string, to: string, enviadoPor?: string, cargo?: string, empresa?: string, ciudad?: string) => {
      setLoading(true);

      try {
        const { items, } = await contratosSvc.getAll( buildContratosReportFilter(from, to, enviadoPor, cargo, empresa, ciudad));
        setRows(items);
      } catch (e: any) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reloadAll  = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage, range, search]);

  return {
    rows,
    baseRows,
    loading,
    error,
    range,
    setRange,
    pageSize,
    setPageSize,
    pageIndex,
    setPageIndex,
    search,
    setSearch,
    sorts,
    setSorts,
    estado,
    setEstado,
    hasNext: !!nextLink,
    loadBase,
    loadFirstPage,
    toggleSort,
    nextPage,
    loadToReport,
    reloadAll
  };
}