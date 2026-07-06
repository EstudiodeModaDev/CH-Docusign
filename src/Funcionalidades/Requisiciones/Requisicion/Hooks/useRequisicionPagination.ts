import React from "react";

export function useNewRequisicionPagination() {
  const [pageSize, setPageSize] = React.useState<number>(10);
  const [pageIndex, setPageIndex] = React.useState<number>(1);
  const [nextLink, setNextLink] = React.useState<string | null>(null);

  const hasNext = !!nextLink;
  const hasPrevious = pageIndex > 1;

  const goToNextPage = React.useCallback((newNextLink: string | null) => {
    setNextLink(newNextLink ?? null);
    setPageIndex((currentPage) => currentPage + 1);
  }, []);

  const goToPreviousPage = React.useCallback((previousNextLink: string | null) => {
    setNextLink(previousNextLink ?? null);
    setPageIndex((currentPage) => Math.max(1, currentPage - 1));
  }, []);

  const resetPagination = React.useCallback((firstNextLink: string | null = null) => {
    setPageIndex(1);
    setNextLink(firstNextLink);
  }, []);

  return {
    pageSize,
    pageIndex,
    hasNext,
    hasPrevious,
    nextLink,
    setPageSize,
    setNextLink,
    setPageIndex,
    goToNextPage,
    goToPreviousPage,
    resetPagination,
  };
}
