import React from "react";
import { useGraphServices } from "../../../../graph/graphContext";
import type { requisiciones } from "../../../../models/requisiciones";
import type { useRequisicionFilters } from "./useRequisicionFilters";
import { useAuth } from "../../../../auth/authProvider";
import type { useNewRequisicionPagination } from "./useRequisicionPagination";

type Props = {
  filters: ReturnType<typeof useRequisicionFilters>;
  pagination: ReturnType<typeof useNewRequisicionPagination>;
};

export function useRequisicionesList({filters, pagination}: Props) {
  const graph = useGraphServices()
  const {account} = useAuth()
  
  const [rows, setRows] = React.useState<requisiciones[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!account?.username) return;

    setLoading(true);
    setError(null);

    try {
      const { items, nextLink: serverNextLink } = await graph.requisiciones.getAll(filters.buildFilter());
      setRows(items ?? []);
      pagination.setNextLink(serverNextLink ?? null);
      pagination.setPageIndex(1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      setRows([]);
      pagination.setNextLink(null);
      pagination.setPageIndex(1);
    } finally {
      setLoading(false);
    }
  }, [account?.username, filters.buildFilter, pagination.pageSize, graph, ]);


  // =========================
  // API-compatible: loadFirstPage / paging
  // =========================
  const loadFirstPage = React.useCallback(async () => {
    await load();
    pagination.setPageIndex(1);
  }, [load]);


  // siguiente página: seguir el nextLink tal cual
 
  const nextPage = React.useCallback(async () => {
    if (!pagination.nextLink) return;
    setLoading(true); setError(null);
    try {
      const { items, nextLink: n2 } = await graph.requisiciones.getByNextLink(pagination.nextLink);
      setRows(items); 
      pagination.nextPage(n2)
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más tickets");
    } finally {
      setLoading(false);
    }
  }, [pagination.nextLink,]);

  // recargas por cambios externos
  const applyRange = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage]);
  const reloadAll  = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage,]);

  return {
    rows, loading, error, nextPage, applyRange, reloadAll,
  };
}



