import React from "react";
import { useGraphServices } from "../../../../graph/graphContext";
import { useStepCompletion } from "../sharedHooks/useStepCompletion";
import { useStepDecisionState } from "../sharedHooks/useStepDecisionState";
import { useStepDetails } from "../sharedHooks/useStepDetails";
import { useStepsCatalog } from "../sharedHooks/useStepsCatalog";

//Todo el hook para cesación usando funciones reutilizables
export function useCesacionSteps() {
  const graph = useGraphServices();

  const decisionState = useStepDecisionState();

  const catalog = useStepsCatalog({
    getAll: graph.PasosCesacion.getAll.bind(graph.PasosCesacion),
    includeInactive: true,
    update: graph.PasosCesacion.update.bind(graph.PasosCesacion),
  });

  React.useEffect(() => {
    catalog.load();
  }, []);

  const completion = useStepCompletion({
    detailsService: graph.DetallesPasosCesacion,
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

//Hook para los detalles de los pasos de cesación, usando el hook genérico de detalles de pasos
export function useCesacionStepDetails(selected?: string) {
  const graph = useGraphServices();

  return useStepDetails({
    detailsService: graph.DetallesPasosCesacion,
    selected,
    activationModule: "Cesacion",
    graph,
  });
}