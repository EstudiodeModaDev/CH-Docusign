// src/hooks/useColaboradoresExplorer.ts
import * as React from "react";
import { useGraphServices } from "../graph/graphContext";
import type { Archivo } from "../models/archivos";
import { parseDateFlex } from "../utils/Date";

export type EmpresaKey = "estudio" | "dh" | "denim" | "visual";

type PathsState = {estudio: string; dh: string; denim: string; visual: string};

export function useColaboradoresExplorer() {
  const { ColaboradoresEDM, ColaboradoresDH, ColaboradoresDenim, ColaboradoresVisual } = useGraphServices();

  const [empresa, setEmpresaState] = React.useState<EmpresaKey>("estudio");
  const [paths, setPaths] = React.useState<PathsState>({
    estudio: "",
    dh: "",
    denim: "",
    visual: ""
  });

  const [rawItems, setRawItems] = React.useState<Archivo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [organizacion, setOrganizacion] = React.useState("asc")

  const currentPath = empresa === "estudio" ? paths.estudio : empresa === "dh" ? paths.dh : empresa === "denim" ? paths.denim : empresa === "visual" ? paths.visual : "";
  const activeService = empresa === "estudio" ? ColaboradoresEDM : empresa === "dh" ? ColaboradoresDH : empresa === "denim" ? ColaboradoresDenim : empresa=== "visual" ? ColaboradoresVisual : ColaboradoresEDM;

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
        setSearch("")
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
  const base = !search.trim()
    ? rawItems
    : rawItems.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  const getTime = (x: Archivo) => {
    const d = parseDateFlex(x.lastModified ?? "");
    return d ? d.getTime() : 0; // si no hay fecha, al inicio
  };

  const sorted = [...base].sort((a, b) => {
    // si quieres que carpetas siempre vayan arriba:
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;

    if (organizacion === "asc") {
      // más antiguos primero
      return getTime(a) - getTime(b);
    }
    // "desc" más nuevos primero
    return getTime(b) - getTime(a);
  });

  return sorted;
}, [rawItems, search, organizacion]);

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
      await load()
      alert("Archivo subido correctamente");
    } catch (e: any) {
      console.error(e);
      alert("Error subiendo archivo: " + e.message);
    }
  };

  const parentPathOf = (path: string) => {
    const parts = path.split("/").filter(Boolean);
    parts.pop();
    return parts.join("/");
  };

  const handleCancelProcess = async () => {
    if (!currentPath) return;

    const parentPath = parentPathOf(currentPath);

    setLoading(true);
    setError(null);

    try {
      await activeService.moveFolderByPath(currentPath, "Procesos Cancelados");

      setPaths(prev => ({
        ...prev,
        [empresa]: parentPath,
      }));  
      const items = await activeService.getFilesInFolder(parentPath);
      setRawItems(items);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "No se pudo cancelar el proceso.");
    } finally {
      setLoading(false);
    }
  }

  const moveCarpeta = async (path: string) => {
    if (!currentPath) return;

    const parentPath = parentPathOf(currentPath);

    setLoading(true);
    setError(null);

    try {
      await activeService.moveFolderByPath(currentPath, path);

      setPaths(prev => ({
        ...prev,
        [empresa]: parentPath,
      }));  
      const items = await activeService.getFilesInFolder(parentPath);
      setRawItems(items);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "No se pudo cancelar el proceso.");
    } finally {
      setLoading(false);
    }
  }

    return {
      empresa, currentPath, items, rawItems, loading, error, search, depth, organizacion,
      setEmpresa, setSearch, openFolder, goUp, reload: load, openItem, handleUploadClick, handleCancelProcess, moveCarpeta, setOrganizacion
    };
  }

