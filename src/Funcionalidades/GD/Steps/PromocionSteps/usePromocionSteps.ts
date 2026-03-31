import React from "react";
import { useGraphServices } from "../../../../graph/graphContext";
import { useStepCompletion } from "../sharedHooks/useStepCompletion";
import { useStepDecisionState } from "../sharedHooks/useStepDecisionState";
import { useStepDetails } from "../sharedHooks/useStepDetails";
import { useStepsCatalog } from "../sharedHooks/useStepsCatalog";

//Todo el hook para promoción usando funciones reutilizables
export function usePromocionSteps() {
  const { PasosPromocion, DetallesPasosPromocion } = useGraphServices();

  const decisionState = useStepDecisionState();

  const catalog = useStepsCatalog({
    getAll: PasosPromocion.getAll.bind(PasosPromocion),
    includeInactive: true,
    update: PasosPromocion.update.bind(PasosPromocion),
  });

  React.useEffect(() => {
    
    catalog.load();
  }, []);

  const completion = useStepCompletion({
    detailsService: DetallesPasosPromocion,
    byId: catalog.byId,
    decisiones: decisionState.decisiones,
    motivos: decisionState.motivos,
  });

  return {
    ...catalog,
    ...decisionState,
    ...completion,
  };
}

//Hook para los detalles de los pasos de promoción, usando el hook genérico de detalles de pasos
export function usePromocionStepDetails(selected?: string) {
  const { DetallesPasosPromocion } = useGraphServices();
  const graph = useGraphServices();

  return useStepDetails({
    detailsService: DetallesPasosPromocion,
    selected,
    activationModule: "Promocion",
    graph,
  });
}