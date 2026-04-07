import React from "react";
import { useGraphServices } from "../../../../../graph/graphContext";
import type { HistorialRevisionCarpetas } from "../../../../../models/DocumentViewer";

export function useSpecificFolderHistorialSearch() {
  const graph = useGraphServices()

  const [history, setHistory] = React.useState<HistorialRevisionCarpetas[]>([]);

  const searchSpecificFolder = async (query: string): Promise<{founded: boolean, folders: HistorialRevisionCarpetas[] | null}> => {
    const resp = await graph.historialRevisionCarpetas.getAll({filter: `fields/Cedula eq '${query}'`, top: 50,});

    setHistory(resp ?? []);

    if(resp.length > 0) {
      return {
        founded: true,
        folders: resp
      };
    }

    return {
      founded: false,
      folders: null
    };
  };


  return {
    searchSpecificFolder,
    history,
  };
}