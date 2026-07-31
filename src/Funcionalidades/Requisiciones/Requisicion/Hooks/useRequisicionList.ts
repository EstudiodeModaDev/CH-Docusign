import React from "react";
import { useRequisicionesServices } from "../../../../graph/graphContext";
import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";
import type { useRequisicionFilters } from "./useRequisicionFilters";
import { useAuth } from "../../../../auth/authProvider";
import type { useNewRequisicionPagination } from "./useRequisicionPagination";

type Props = {
  filters: ReturnType<typeof useRequisicionFilters>;
  pagination: ReturnType<typeof useNewRequisicionPagination>;
};

type PageCache = {
  rows: requisiciones[];
  nextLink: string | null;
};

export function useRequisicionesList({ filters, pagination }: Props) {
  const { requisiciones } = useRequisicionesServices();
  const { account } = useAuth();

  const [rows, setRows] = React.useState<requisiciones[]>([]);
  const [pages, setPages] = React.useState<PageCache[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!account?.username) return;

    setLoading(true);
    setError(null);

    try {
      const filtro = filters.buildFilter();
      const { items, nextLink: serverNextLink } = await requisiciones.getAll(filtro);
      const firstPageRows = items ?? [];
      const normalizedNextLink = serverNextLink ?? null;

      setRows(firstPageRows);
      setPages([{ rows: firstPageRows, nextLink: normalizedNextLink }]);
      pagination.resetPagination(normalizedNextLink);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando requisiciones");
      setRows([]);
      setPages([]);
      pagination.resetPagination(null);
    } finally {
      setLoading(false);
    }
  }, [account?.username, filters.buildFilter, pagination.resetPagination, requisiciones]);

  const loadFirstPage = React.useCallback(async () => {
    await load();
  }, [load]);

  const nextPage = React.useCallback(async () => {
    if (!pagination.nextLink) return;

    setLoading(true);
    setError(null);

    try {
      const { items, nextLink: serverNextLink } = await requisiciones.getByNextLink(pagination.nextLink);
      const nextRows = items ?? [];
      const normalizedNextLink = serverNextLink ?? null;

      setRows(nextRows);
      setPages((currentPages) => {
        const currentIndex = Math.max(pagination.pageIndex - 1, 0);
        const trimmedPages = currentPages.slice(0, currentIndex + 1);
        return [...trimmedPages, { rows: nextRows, nextLink: normalizedNextLink }];
      });
      pagination.goToNextPage(normalizedNextLink);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando mas requisiciones");
    } finally {
      setLoading(false);
    }
  }, [pagination, requisiciones]);

  const prevPage = React.useCallback(() => {
    if (pagination.pageIndex <= 1) return;

    const previousPage = pages[pagination.pageIndex - 2];
    if (!previousPage) return;

    setRows(previousPage.rows);
    pagination.goToPreviousPage(previousPage.nextLink);
  }, [pagination, pages]);

  const applyRange = React.useCallback(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const reloadAll = React.useCallback(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  React.useEffect(() => {
    if (!account?.username) return;
    void loadFirstPage();
  }, [account?.username, loadFirstPage]);

  return {
    rows,
    loading,
    error,
    nextPage,
    prevPage,
    applyRange,
    reloadAll,
    loadFirstPage,
  };
}
