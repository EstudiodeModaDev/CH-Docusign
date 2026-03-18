import * as React from "react";
import type { Archivo } from "../../../../models/archivos";

type UseExplorerDataParams = {
  activeService: any;
  currentPath: string;
  setRawItems: React.Dispatch<React.SetStateAction<Archivo[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useExplorerData({activeService, currentPath, setRawItems, setLoading, setError,}: UseExplorerDataParams) {
  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await activeService.getFilesInFolder(currentPath);
      setRawItems(items);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Error cargando elementos de la carpeta.");
      setRawItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeService, currentPath, setRawItems, setLoading, setError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { load };
}