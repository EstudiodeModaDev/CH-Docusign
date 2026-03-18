import * as React from "react";
import { calculateDepth } from "../utils/explorerPath";
import { buildVisibleItems } from "../utils/explorerSort";
import { useExplorerState } from "./useExplorerState";
import { useExplorerData } from "./useExplorerData";
import { useGraphServices } from "../../../../graph/graphContext";
import { buildExplorerServiceMap, getCurrentPath } from "../utils/empresaExplorerMap";
import { useExplorerActions } from "./useExplorerAction";

export function useColaboradoresExplorer() {
  const graph = useGraphServices();

  const {empresa, paths, rawItems, loading, error, search, organizacion, setEmpresa, setPaths, setRawItems, setLoading, setError, setSearch, setOrganizacion,} = useExplorerState();

  const serviceMap = React.useMemo(() => buildExplorerServiceMap(graph), [graph]);
  const activeService = serviceMap[empresa];
  const currentPath = getCurrentPath(paths, empresa);

  const { load } = useExplorerData({
    activeService,
    currentPath,
    setRawItems,
    setLoading,
    setError,
  });

  const actions = useExplorerActions({
    empresa,
    currentPath,
    activeService,
    setPaths,
    setRawItems,
    setLoading,
    setError,
    setSearch,
    reload: load,
  });

  const items = React.useMemo(
    () => buildVisibleItems(rawItems, search, organizacion),
    [rawItems, search, organizacion]
  );

  const depth = React.useMemo(
    () => calculateDepth(currentPath),
    [currentPath]
  );

  return {
    empresa,
    currentPath,
    items,
    rawItems,
    loading,
    error,
    search,
    depth,
    organizacion,
    setEmpresa,
    setSearch,
    reload: load,
    setOrganizacion,
    ...actions,
  };
}