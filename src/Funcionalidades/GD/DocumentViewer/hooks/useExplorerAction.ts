import * as React from "react";
import { appendSegment, parentPathOf } from "../utils/explorerPath";
import type { EmpresaKey, PathsState } from "../../../../models/DocumentViewer";
import type { Archivo } from "../../../../models/archivos";

type Params = {
  empresa: EmpresaKey;
  currentPath: string;
  activeService: any;
  setPaths: React.Dispatch<React.SetStateAction<PathsState>>;
  setRawItems: React.Dispatch<React.SetStateAction<Archivo[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  reload: () => Promise<void>;
};

export function useExplorerActions({empresa, currentPath,  activeService, setPaths, setRawItems, setLoading, setError, setSearch, reload,}: Params) {
  const openFolder = React.useCallback((folder: Archivo) => {
    setPaths(prev => ({
      ...prev,
      [empresa]: appendSegment(prev[empresa], folder.name),
    }));
  }, [empresa, setPaths]);

  const openItem = React.useCallback((item: Archivo) => {
    if (item.isFolder) {
      openFolder(item);
      setSearch("");
      return;
    }

    window.open(item.webUrl, "_blank");
  }, [openFolder, setSearch]);

  const goUp = React.useCallback(() => {
    setPaths(prev => {
      const current = prev[empresa];
      const clean = current.replace(/^\/|\/$/g, "");
      if (!clean) return prev;

      const parts = clean.split("/");
      parts.pop();

      return {
        ...prev,
        [empresa]: parts.join("/"),
      };
    });
  }, [empresa, setPaths]);

  const handleUploadClick = React.useCallback(async (path: string, file: File) => {
    if (!file) {
      alert("Debes seleccionar un archivo antes de subirlo");
      return;
    }

    try {
      await activeService.uploadFile(path, file);
      await reload();
      alert("Archivo subido correctamente");
    } catch (e: any) {
      console.error(e);
      alert("Error subiendo archivo: " + e.message);
    }
  }, [activeService, reload]);


  const handleDelete = React.useCallback(async (itemId: string, nombre: string) => {
    if (!itemId) {
      alert("No se puede eliminar");
      return;
    }

    const ok = window.confirm("Esta seguro que desea eliminar el archivo " + nombre + " de forma permanente")

    if(!ok){
      return
    }

    try {
      await activeService.deleteArchivoById(itemId);
      await reload();
      alert("Archivo eliminado correctamente");
    } catch (e: any) {
      console.error(e);
      alert("Error eliminando archivo: " + e.message);
    }
  }, [activeService, reload]);

  const moveToPath = React.useCallback(async (targetPath: string, fallbackMessage: string) => {
    if (!currentPath) return;

    const parentPath = parentPathOf(currentPath);

    setLoading(true);
    setError(null);

    try {
      await activeService.moveFolderByPath(currentPath, targetPath);

      setPaths(prev => ({
        ...prev,
        [empresa]: parentPath,
      }));

      const items = await activeService.getFilesInFolder(parentPath);
      setRawItems(items);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? fallbackMessage);
    } finally {
      setLoading(false);
    }
  }, [activeService, currentPath, empresa, setPaths, setRawItems, setLoading, setError]);

  const handleCancelProcess = React.useCallback(async () => {
    await moveToPath("Procesos Cancelados", "No se pudo cancelar el proceso.");
  }, [moveToPath]);

  const moveCarpeta = React.useCallback(async (path: string) => {
    await moveToPath(path, "No se pudo mover la carpeta.");
  }, [moveToPath]);

  return {
    openFolder,
    openItem,
    goUp,
    handleUploadClick,
    handleCancelProcess,
    moveCarpeta,
    handleDelete
  };
}