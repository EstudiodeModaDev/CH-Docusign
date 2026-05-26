import React from "react";
import { useANSFilters } from "./useANSFilters";
import { useANSForm } from "./useANSForm";
import { useANSQueries } from "./useANSQueries";
import { useANSActions } from "./useANSActions";

import { useAuth } from "../../../../auth/authProvider";
import { useRequisicionesServices } from "../../../../graph/graphContext";

export function useANSRequisicion() {
  const {ansRequisicion} = useRequisicionesServices()
  const { account } = useAuth();

  const filters = useANSFilters();
  const form = useANSForm();

  const queries = useANSQueries({service: ansRequisicion, enabled: !!account?.username,});

  const actions = useANSActions({service:  ansRequisicion, state: form.state, validate: form.validate, setLoading: queries.setLoading,});

  const applyRange = React.useCallback(() => {
    queries.loadANS();
  }, [queries]);

  const reloadAll = React.useCallback(() => {
    queries.loadANS();
  }, [queries]);

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

    setRange: filters.setRange,
    setPageSize: filters.setPageSize,
    setSearch: filters.setSearch,
    setSorts: filters.setSorts,
    setEstado: filters.setEstado,

    setField: form.setField,
    setState: form.setState,
    cleanState: form.cleanState,

    applyRange,
    reloadAll,

    ...actions,

    lookForANS: queries.lookForANS,
  };
}