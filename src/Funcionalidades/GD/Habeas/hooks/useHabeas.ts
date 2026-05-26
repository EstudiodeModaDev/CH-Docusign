import React from "react";
import { useHabeasForm } from "./useHabeasForm";
import { useHabeasActions } from "./useHabeasActions";
import { useHabeasPagintation } from "./useHabeasPagination";
import type { HabeasData } from "../../../../models/HabeasData";
import { useHabeasList } from "./useHabeasList";
import { useSpecificHabeasSearches } from "./useSpecificSearches";
import { useAuth } from "../../../../auth/authProvider";
import { includesHabeasSearch } from "../utils/habeasSearch";
import { compareHabeas } from "../utils/habeasSorts";
import { useRequestActions } from "../../UpdateRequest/hooks/useRequestActions";
import { detallePayloadFromHabeas } from "../../UpdateRequestDetails/utils/requestPayload";
import { notifyUpdateRequest } from "../../../../utils/mail";
import { useCoreGraphServices, useGestorServices } from "../../../../graph/graphContext";
import { notify } from '../../../../utils/notify';

export function useHabeasData() {
  const {HabeasData} = useGestorServices()
  const {mail, graph} = useCoreGraphServices()
  const auth = useAuth()
  const formController = useHabeasForm(auth.account?.name ?? "")
  const actionsController = useHabeasActions()
  const paginationController = useHabeasPagintation(HabeasData)
  const requestController = useRequestActions()
  const listController = useHabeasList(paginationController.pageSize, auth.account?.name ?? "")
  const searchesController = useSpecificHabeasSearches()

  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (): Promise<{ created: HabeasData | null; ok: boolean }> => {
    const validationErrors = formController.validate()

    if (!validationErrors) {
      notify.auto("Hay campos sin rellenar");
      return { ok: false, created: null };
    }

    setLoading(true);

    try {
      const creado = await actionsController.handleSubmitBd(formController.state)
      return { ok: true, created: creado };
    } catch {
      return { ok: false, created: null };
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent, habeasSeleccionado: HabeasData, canEdit: boolean) => {
    e.preventDefault();

    const validationErrors = formController.validate()

    if (!validationErrors) {
      notify.auto("Hay algunos campos faltantes")
      return
    };
    if (!habeasSeleccionado.Id) {
      notify.auto("Registro sin Id");
      return;
    }

    setLoading(true);

    try {
      const toEdit = await HabeasData.get(habeasSeleccionado.Id!)

      if(!canEdit){
        await actionsController.handleEditBd(toEdit, formController.state)
        notify.auto("Se ha actualizado el registro con éxito");
      } else {

        const request = await requestController.createRequest("Habeas", habeasSeleccionado.Id)
        if(!request.created || !request.ok) return

        const realRegister = await HabeasData.get(habeasSeleccionado.Id)

        const DetallesPayload = detallePayloadFromHabeas(realRegister, formController.state, request.created.Id!)

        console.log(DetallesPayload)

        requestController.genericProcess("Habeas", DetallesPayload,)

        const groupMembers = await graph.getAllGroupMembers("3dc57761-477f-4096-99c8-e533b6fd7423", {excludeEmail: "larendon@estudiodemoda.com.co"})
        await notifyUpdateRequest(mail, "Habeas data", auth.account?.name ?? "", habeasSeleccionado.NumeroDocumento, groupMembers,)
        
        notify.auto("Se ha enviado la solicitud, se te notificara el resultado")
        
      }
    } catch {
      notify.auto("Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  const deleteHabeasData = React.useCallback(async (Id: string) => {
    setLoading(true)
      try {
        await actionsController.deleteHabeasDataBd(Id)
        await listController.loadBase()
        notify.auto("Se ha eliminado el registro con exito.")
      } catch {
        throw new Error("Ha ocurrido un error eliminando la cesación");
      }
    },
  [actionsController]);

  const nextPage = React.useCallback(async (): Promise<void> => {
    try {
      paginationController.nextPageBd()
    } catch (e: any) {
    } 
  }, []);

  React.useEffect(() => {
    listController.loadBase();
  }, [listController.loadBase]);

  React.useEffect(() => {
    let data = listController.baseRows;

    if (listController.debouncedSearch.trim()) {
      data = data.filter(r => includesHabeasSearch(r, listController.debouncedSearch));
    }

    if (listController.sorts.length) {
      data = [...data].sort((a, b) => {
        for (const s of listController.sorts) {
          const result = compareHabeas(a, b, s.field, s.dir);
          if (result !== 0) return result;
        }
        return 0;
      });
    }

    const start = (paginationController.pageIndex - 1) * paginationController.pageSize;
    const page = data.slice(start, start + paginationController.pageSize);

    listController.setRows(page);
    paginationController.setNextLink(data.length > start + paginationController.pageSize ? "local" : null);
    paginationController.setNextLink(data.length > start + paginationController.pageSize ? "local" : null);
  }, [listController.baseRows, listController.debouncedSearch, listController.sorts, paginationController.pageIndex, paginationController.pageSize]);

  return {
    handleSubmit,
    ...searchesController,
    ...listController,
    handleEdit,
    deleteHabeasData,
    nextPage,
    ...formController,
    ...actionsController,
    ...paginationController,
    loading
  };
}

