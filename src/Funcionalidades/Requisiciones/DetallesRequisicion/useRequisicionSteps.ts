import { useRequisicionesServices } from "../../../graph/graphContext";
import { useStepCompletion } from "./useStepCompletion";
import { useStepDecisionState } from "./useStepDecisionState";
import { useStepDetails } from "./useStepDetails";
import { useStepsCatalogRequisicion } from "./useStepsCatalogRequisicion";

export function useRequisicionSteps(requisicionId?: string) {
  const { pasosVacante, detalleRequisicion, requisiciones } = useRequisicionesServices();
  const decisionState = useStepDecisionState();

  const catalog = useStepsCatalogRequisicion({
    getAll: pasosVacante.getAllPlain.bind(pasosVacante),
    update: pasosVacante.update.bind(pasosVacante),
    includeInactive: true,
  });

  const details = useStepDetails({
    detailsService: detalleRequisicion,
    requisicionId,
    templates: catalog.rows,
  });

  const completion = useStepCompletion({
    detailsService: detalleRequisicion,
    requisicionesService: requisiciones,
    templates: catalog.rows,
    details: details.rows,
    byTemplateId: catalog.byTemplateId,
    decisiones: decisionState.decisiones,
    motivos: decisionState.motivos,
  });

  return {
    templates: catalog.rows,
    templatesById: catalog.byTemplateId,
    loadingTemplates: catalog.loading,
    templatesError: catalog.error,
    loadTemplates: catalog.load,
    activateTemplate: catalog.activate,
    desactivateTemplate: catalog.desactivate,
    details: details.rows,
    detailsByTemplateId: details.byTemplateId,
    resolvedRows: details.resolvedRows,
    loadingDetails: details.loading,
    detailsError: details.error,
    loadDetails: details.load,
    ...decisionState,
    ...completion,
  };
}

export function useRequisicionStepDetails(requisicionId?: string) {
  const {
    details,
    detailsByTemplateId,
    resolvedRows,
    loadingDetails,
    detailsError,
    loadDetails,
  } = useRequisicionSteps(requisicionId);

  return {
    rows: details,
    byTemplateId: detailsByTemplateId,
    resolvedRows,
    loading: loadingDetails,
    error: detailsError,
    load: loadDetails,
  };
}
