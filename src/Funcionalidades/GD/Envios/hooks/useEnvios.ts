import { useGraphServices } from "../../../../graph/graphContext";
import type { EnvioErrors } from "../../../../models/Envios";
import { useEnviosForm } from "./useEnviosForm";
import { validateEnvio } from "../utils/enviosValidations";
import { useEnviosList } from "./useEnviosList";
import { useEnviosActions } from "./useEnviosActions";
import React from "react";
import { useEnviosPagintation } from "./useEnviosPagintation";


export function useEnvios() {
  const graph = useGraphServices()
  const formController = useEnviosForm()
  const paginationController = useEnviosPagintation(graph)
  const listController = useEnviosList(paginationController.pageSize)
  const actionsController = useEnviosActions()

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<EnvioErrors>({});

  const handleSubmit = async () => {
    const errors = validateEnvio(formController.state)
    setErrors(errors)
    
    if (!(Object.keys(errors).length === 0)){
      alert("Hay algunos campos obligatorios vacios")
      return
    };
    setLoading(true);
    try {
      await actionsController.handleSubmitBd(formController.state)
    } finally {
        setLoading(false);
      }
  };

  const loadToReport = React.useCallback(async (from: string, to: string, EnviadoPor?: string, destinatario?: string, plantilla?: string) => {
    setLoading(true); setError(null);

    try {
      const action = await actionsController.loadToReport(from, to, EnviadoPor, destinatario, plantilla)
      if(!action.ok){
        alert(action.message)
        throw new Error(action.message!)
      }

      listController.setRows(action.data)
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      listController.setRows([]);
    } finally {
      setLoading(false);
    }
  }, [actionsController, listController]);

  const nextPage = React.useCallback(async () => {
    setLoading(true); setError(null);
    
    try {
      const nextPage = await paginationController.nextPageBd()
      if(!nextPage) return
      listController.setRows(nextPage)
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      listController.setRows([]);
    } finally {
      setLoading(false);
    }
  }, [paginationController, listController]);

  const reload = React.useCallback(async () => {
    setLoading(true); setError(null);
    
    try {
      const res = await listController.loadFirstPage();
      if(!res.ok) return
      paginationController.setNextLink(res.nextLink)
      paginationController.setPageIndex(1)
    } catch (e: any) {
      setError(e?.message ?? "Error cargando los envios");
      listController.setRows([]);
    } finally {
      setLoading(false);
    }
  }, [listController.loadFirstPage, listController.setRows, paginationController.setNextLink, paginationController.setPageIndex]);


  React.useEffect(() => {
    reload();
  }, [listController.range, listController.search, paginationController.pageSize]);
  

  return {
    loading, errors, handleSubmit, ...formController, ...paginationController, nextPage, ...listController, ...actionsController, loadToReport, error, reload
  };
}



