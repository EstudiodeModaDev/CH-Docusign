import React from "react";
import { useGraphServices } from "../../../../../graph/graphContext";
import type { ControlRevisionCarpetas } from "../../../../../models/DocumentViewer";

export function useSpecificFolderSearch() {
  const graph = useGraphServices()

  const [folders, setFolders] = React.useState<ControlRevisionCarpetas[]>([]);

  const searchSpecificFolder = React.useCallback(async (query: string): Promise<{founded: boolean, folders: ControlRevisionCarpetas | null}> => {
    const resp = await graph.controlRevisionCarpetas.getAll({filter: `fields/Cedula eq '${query}'`, top: 1,});

    const foundFolders = resp ?? [];
    setFolders(foundFolders);

    if(foundFolders.length > 0) {
      return {
        founded: true,
        folders: foundFolders[0]
      };
    }

    return {
      founded: false,
      folders: null
    };
  }, [graph]);

  return {
    searchSpecificFolder,
    folders,
  };
}
