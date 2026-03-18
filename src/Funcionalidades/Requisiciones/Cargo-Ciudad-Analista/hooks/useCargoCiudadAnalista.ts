import React from "react";

import { useCargoCiudadAnalistaForm } from "./useCargoCiudadAnalistaForm";

import { useCargoCiudadAnalistaActions } from "./useCargoCiudadAnalistaActions";
import { useCargoCiudadAnalistaQueries } from "./useCargoCidudadAnalistaQueries";
import { useCargoCiudadAnalistaFilters } from "./useCarcoCiudadAnalistaFilters";
import { useGraphServices } from "../../../../graph/graphContext";

export function useCargoCiudadAnalista() {
  const graph = useGraphServices()
  const filters = useCargoCiudadAnalistaFilters();
  const form = useCargoCiudadAnalistaForm();

  const queries = useCargoCiudadAnalistaQueries({service: graph.cargoCiudadAnalista,});

  const actions = useCargoCiudadAnalistaActions({
    service: graph.cargoCiudadAnalista,
    state: form.state,
    validate: form.validate,
    setLoading: queries.setLoading,
    existsCargoCiudad: queries.existsCargoCiudad,
  });

  const applyRange = React.useCallback(() => {
    queries.loadItems();
  }, [queries.loadItems]);

  const reloadAll = React.useCallback(() => {
    queries.loadItems();
  }, [queries.loadItems]);

  return {
    rows: queries.rows,
    loading: queries.loading,
    error: queries.error,

    pageSize: filters.pageSize,
    range: filters.range,
    search: filters.search,
    sorts: filters.sorts,
    estado: filters.estado,

    state: form.state,
    errors: form.errors,

    applyRange,
    reloadAll,

    setRange: filters.setRange,
    setPageSize: filters.setPageSize,
    setSearch: filters.setSearch,
    setSorts: filters.setSorts,
    setEstado: filters.setEstado,

    setField: form.setField,
    setState: form.setState,
    cleanState: form.cleanState,

    handleCreate: actions.handleCreate,
    handleEdit: actions.handleEdit,
    handleDelete: actions.handleDelete,

    lookForAnalistaEncargado: queries.lookForAnalistaEncargado,
  };
}