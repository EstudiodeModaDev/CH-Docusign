import React from "react";

export function useNewRequisicionPagination() {

  const [pageSize, setPageSize] = React.useState<number>(10); 
  const [pageIndex, setPageIndex] = React.useState<number>(1);
  const [nextLink, setNextLink] = React.useState<string | null>(null);
 
  React.useEffect(() => {
    setPageIndex(1);
  }, []);


  // siguiente página: seguir el nextLink tal cual
  const hasNext = !!nextLink;

  const nextPage = React.useCallback(async (n2: string | null) => {
    try {            // 👈 reemplaza la página visible
      setNextLink(n2 ?? null);     // null si no hay más
      setPageIndex(i => i + 1);
    } catch (e: any) {
      
    } 
  }, [nextLink, ]);

  

  return {
    pageSize, pageIndex, hasNext, nextLink,
    nextPage, setPageSize, setNextLink, setPageIndex
  };
}



