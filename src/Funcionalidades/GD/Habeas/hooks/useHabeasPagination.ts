import React from "react";
import type { useGraphServices } from "../../../../graph/graphContext";
import type { HabeasData } from "../../../../models/HabeasData";

export function useHabeasPagintation(servicio: ReturnType<typeof useGraphServices>) {
  const [pageSize, setPageSize] = React.useState<number>(10); 
  const [pageIndex, setPageIndex] = React.useState<number>(1);
  const [nextLink, setNextLink] = React.useState<string | null>(null);
  const hasNext = !!nextLink;

  const resetPagination = React.useCallback(() => {
    setPageIndex(1);
    setNextLink(null);
  }, []);

  const nextPageBd = React.useCallback(async (): Promise<HabeasData[] | null> => {
    if (!hasNext) return null;
    try {
      const { items, nextLink: n2 } = await servicio.HabeasData.getByNextLink(nextLink ?? "");
      setNextLink(n2 ?? null);     
      setPageIndex(i => i + 1);
      return items
    } catch (e: any) {
      return null
    } 
  }, [nextLink,]);

  return {
    pageSize, setPageSize, pageIndex, setPageIndex, hasNext, resetPagination, setNextLink, nextLink, nextPageBd
  };
}