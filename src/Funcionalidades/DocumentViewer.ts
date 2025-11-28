// src/hooks/useColaboradoresExplorer.ts
import * as React from "react";
import { useGraphServices } from "../graph/graphContext";
import type { Archivo } from "../models/archivos";

export type EmpresaKey = "estudio" | "dh";

type PathsState = {estudio: string; dh: string;};

export function useColaboradoresExplorer() {
  const { ColaboradoresEDM, ColaboradoresDH } = useGraphServices();

  const [empresa, setEmpresaState] = React.useState<EmpresaKey>("estudio");
  const [paths, setPaths] = React.useState<PathsState>({
    estudio: "",
    dh: "",
  });

  const [rawItems, setRawItems] = React.useState<Archivo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const currentPath = empresa === "estudio" ? paths.estudio : paths.dh;

  const activeService = empresa === "estudio" ? ColaboradoresEDM : ColaboradoresDH;

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
  }, [activeService, currentPath]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const setEmpresa = (emp: EmpresaKey) => {
    setEmpresaState(emp);
    setSearch(""); // opcional: limpiar el buscador al cambiar
  };

  const appendSegment = (base: string, segment: string) => {
    const cleanBase = base.replace(/^\/|\/$/g, "");
    const cleanSeg = segment.replace(/^\/|\/$/g, "");
    if (!cleanBase) return cleanSeg;
    return `${cleanBase}/${cleanSeg}`;
  };

  const openFolder = (folder: Archivo) => {
    // asumimos que folder.name es el nombre de la carpeta en el path
    setPaths((prev) => ({
      ...prev,
      [empresa]: appendSegment(prev[empresa], folder.name),
    }));
  };

  const openItem = (item: Archivo) => {
    if (item.isFolder) {
        openFolder(item); // navegas
    } else {
        // es archivo → lo abres en nueva pestaña, por ejemplo
        window.open(item.webUrl, "_blank");
    }
    };

  const goUp = () => {
    setPaths((prev) => {
      const current = prev[empresa];
      const clean = current.replace(/^\/|\/$/g, "");
      if (!clean) return prev;

      const parts = clean.split("/");
      parts.pop(); // subimos un nivel
      const newPath = parts.join("/");

      return {
        ...prev,
        [empresa]: newPath,
      };
    });
  };

  const items: Archivo[] = React.useMemo(() => {
    if (!search.trim()) return rawItems;
    const term = search.toLowerCase();
    return rawItems.filter((i) => i.name.toLowerCase().includes(term));
  }, [rawItems, search]);

  const depth = React.useMemo(() => {
    if (!currentPath) return 0;
    return currentPath.split("/").filter(Boolean).length;
  }, [currentPath]);

  const handleUploadClick = async (path: string, file: File) => {

    if (!file) {
      alert("Debes seleccionar un archivo antes de subirlo");
      return;
    }

    const servicioColaboradores = empresa === "dh" ? ColaboradoresDH : ColaboradoresEDM;

    try {
      const item = await servicioColaboradores.uploadFile(path, file);

      console.log("Archivo subido:", item.webUrl);
      alert("Archivo subido correctamente");

      // si quieres, aquí llamas a tu handleCompleteStep(detalle)
      // await handleCompleteStep(detalle);
    } catch (e: any) {
      console.error(e);
      alert("Error subiendo archivo: " + e.message);
    }
  };

  return {
    empresa, currentPath, items, rawItems, loading, error, search, depth,
    setEmpresa, setSearch, openFolder, goUp, reload: load, openItem, handleUploadClick
  };
}
