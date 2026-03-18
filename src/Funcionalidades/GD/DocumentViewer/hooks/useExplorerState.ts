import * as React from "react";
import type { EmpresaKey, PathsState } from "../../../../models/DocumentViewer";
import type { Archivo } from "../../../../models/archivos";
import type { OrganizacionType } from "../utils/explorerSort";


const initialPaths: PathsState = {
  estudio: "",
  dh: "",
  denim: "",
  visual: "",
  meta: "",
  broken: "",
};

export function useExplorerState() {
  const [empresa, setEmpresaState] = React.useState<EmpresaKey>("estudio");
  const [paths, setPaths] = React.useState<PathsState>(initialPaths);
  const [rawItems, setRawItems] = React.useState<Archivo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [organizacion, setOrganizacion] = React.useState<OrganizacionType>("asc");

  const setEmpresa = React.useCallback((emp: EmpresaKey) => {
    setEmpresaState(emp);
    setSearch("");
  }, []);

  const updateEmpresaPath = React.useCallback((empresa: EmpresaKey, nextPath: string) => {
    setPaths(prev => ({
      ...prev,
      [empresa]: nextPath,
    }));
  }, []);

  return {
    empresa,
    paths,
    rawItems,
    loading,
    error,
    search,
    organizacion,
    setEmpresa,
    setPaths,
    setRawItems,
    setLoading,
    setError,
    setSearch,
    setOrganizacion,
    updateEmpresaPath,
  };
}