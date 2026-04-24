import React from "react";
import { useRequisicionesActions } from "./useRequisicionActions";
import { useRequisicionFilters } from "./useRequisicionFilters";
import { useNewRequisicionForm } from "./useRequisicionForm";
import { useRequisicionesList } from "./useRequisicionList";
import { useNewRequisicionPagination } from "./useRequisicionPagination";
import { useNotifyRequisiciones } from "./useRequisicionNotifications";
import type { requisiciones } from "../../../../models/requisiciones";

export function useRequisicion() {
  const formController = useNewRequisicionForm()
  const paginationController = useNewRequisicionPagination()
  const filtersController = useRequisicionFilters(paginationController.pageSize)
  const actionsController = useRequisicionesActions({setErrors: formController.setErrors, state: formController.state})
  const listController = useRequisicionesList({filters: filtersController, pagination: paginationController})
  const notificationController = useNotifyRequisiciones()

  // Traer de Graph cuando cambien filtros, búsqueda o tamaño de página.
  React.useEffect(() => {
    listController.reloadAll()
  }, [listController.reloadAll]);

  // Mantiene la numeración consistente al cambiar la búsqueda antes de recargar.
  React.useEffect(() => {
    paginationController.setPageIndex(1);
  }, []);

  const cancelarRequisicion = async (r: requisiciones): Promise<boolean> => {
    await actionsController.cancelarBD(r)
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
    cancelarRequisicion
  };
}



