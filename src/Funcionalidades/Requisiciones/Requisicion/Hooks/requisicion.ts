import React from "react";
import { useRequisicionesActions } from "./useRequisicionActions";
import { useRequisicionFilters } from "./useRequisicionFilters";
import { useNewRequisicionForm } from "./useRequisicionForm";
import { useRequisicionesList } from "./useRequisicionList";
import { useNewRequisicionPagination } from "./useRequisicionPagination";
import { useNotifyRequisiciones } from "./useRequisicionNotifications";
import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";
import type { commonResponse } from "../../../../models/Commons";

export function useRequisicion() {
  const formController = useNewRequisicionForm()
  const paginationController = useNewRequisicionPagination()
  const filtersController = useRequisicionFilters(paginationController.pageSize)
  const actionsController = useRequisicionesActions({setErrors: formController.setErrors, state: formController.state, stateController: formController})
  const listController = useRequisicionesList({filters: filtersController, pagination: paginationController, stateController: formController})
  const notificationController = useNotifyRequisiciones()

  // Mantiene la numeración consistente al cambiar la búsqueda antes de recargar.
  React.useEffect(() => {
    paginationController.setPageIndex(1);
  }, []);

  const cancelarRequisicion = async (r: requisiciones, motivo: string): Promise<commonResponse<void>> => {
    await actionsController.cancelarBD(r, motivo)
    await listController.reloadAll()
    return {
      ok: true
    }
  }

  const onPostergarANS = async (r: requisiciones, date: string, motivo: string): Promise<boolean> => {    
    await actionsController.postergarANS(r, date, motivo)
    await listController.reloadAll()
    return true
  }

  return {
    ...formController,
    ...paginationController,
    ...filtersController,
    ...actionsController,
    ... listController,
    ...notificationController,
    cancelarRequisicion,
    onPostergarANS
  };
}



