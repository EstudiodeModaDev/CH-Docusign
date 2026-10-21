import * as React from "react";
import { appendSegment, parentPathOf } from "../utils/explorerPath";
import type { EmpresaKey, PathsState } from "../../../../models/DocumentViewer";
import type { Archivo } from "../../../../models/archivos";
import { notify } from '../../../../utils/notify';
import { useAuditLog } from "../../../Common/useAuditLog";

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
  const { withAudit } = useAuditLog("Documentos");

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

  const handleUploadClick = React.useCallback(async (path: string, file: File, name?: string) => {
    if (!file) {
      notify.auto("Debes seleccionar un archivo antes de subirlo");
      return;
    }

    try {
      await withAudit(
        {
          accion: "Creacion",
          descripcion: "Se subió un documento a la carpeta de un colaborador",
          descripcionError: "Falló la carga de un documento a la carpeta de un colaborador",
          id_item_afectado: path,
          detalle: { empresa, ruta: path, archivo: name || file.name },
        },
        () => activeService.uploadFile(path, file, name)
      );
      await reload();
      notify.auto("Archivo subido correctamente");
    } catch (e: any) {
      console.error(e);
      notify.auto("Error subiendo archivo: " + e.message);
    }
  }, [activeService, reload, withAudit, empresa]);


  const handleDelete = React.useCallback(async (itemId: string, nombre: string) => {
    if (!itemId) {
      notify.auto("No se puede eliminar");
      return;
    }

    const ok = window.confirm("Esta seguro que desea eliminar el archivo " + nombre + " de forma permanente")

    if(!ok){
      return
    }

    try {
      await withAudit(
        {
          accion: "Eliminacion",
          descripcion: "Se eliminó un documento de la carpeta de un colaborador",
          descripcionError: "Falló la eliminación de un documento de la carpeta de un colaborador",
          id_item_afectado: itemId,
          detalle: { empresa, ruta: currentPath, archivo: nombre },
        },
        () => activeService.deleteArchivoById(itemId)
      );
      await reload();
      notify.auto("Archivo eliminado correctamente");
    } catch (e: any) {
      console.error(e);
      notify.auto("Error eliminando archivo: " + e.message);
    }
  }, [activeService, reload, withAudit, empresa, currentPath]);

  const moveToPath = React.useCallback(async (targetPath: string, fallbackMessage: string) => {
    if (!currentPath) return;

    const parentPath = parentPathOf(currentPath);

    setLoading(true);
    setError(null);

    try {
      await withAudit(
        {
          accion: "Edicion",
          descripcion: targetPath === "Procesos Cancelados"
            ? "Se movió la carpeta de un colaborador a procesos cancelados"
            : "Se movió la carpeta de un colaborador",
          descripcionError: targetPath === "Procesos Cancelados"
            ? "Falló el movimiento de la carpeta de un colaborador a procesos cancelados"
            : "Falló el movimiento de la carpeta de un colaborador",
          id_item_afectado: currentPath,
          detalle: { empresa, ruta_origen: currentPath, ruta_destino: targetPath },
        },
        () => activeService.moveFolderByPath(currentPath, targetPath)
      );

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
  }, [activeService, currentPath, empresa, setPaths, setRawItems, setLoading, setError, withAudit]);

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

