import React from "react";
import type { ControlRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { useGestorServices } from "../../../../../graph/graphContext";

export function useSpecificFolderSearch() {
  const {controlRevisionCarpetas} = useGestorServices()

  const [folders, setFolders] = React.useState<ControlRevisionCarpetas[]>([]);

  const searchSpecificFolder = React.useCallback(async (query: string): Promise<{founded: boolean, folders: ControlRevisionCarpetas | null}> => {
    const resp = await controlRevisionCarpetas.getAll({filter: `fields/Cedula eq '${query}'`, top: 1,});

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
  }, [controlRevisionCarpetas]);

  return {
    searchSpecificFolder,
    folders,
  };
}
