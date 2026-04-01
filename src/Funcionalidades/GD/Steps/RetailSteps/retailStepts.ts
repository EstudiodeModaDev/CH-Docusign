import React from "react";
import { useGraphServices } from "../../../../graph/graphContext";
import { useStepCompletion } from "../sharedHooks/useStepCompletion";
import { useStepDecisionState } from "../sharedHooks/useStepDecisionState";
import { useStepDetails } from "../sharedHooks/useStepDetails";
import { useStepsCatalog } from "../sharedHooks/useStepsCatalog";

//Todo el hook para retail usando funciones reutilizables
export function useRetailSteps() {
  const { pasosRetail, detallesPasosRetail } = useGraphServices();

  const decisionState = useStepDecisionState();

  const catalog = useStepsCatalog({getAll: pasosRetail.getAll.bind(pasosRetail), includeInactive: true, update: pasosRetail.update.bind(pasosRetail)});

  React.useEffect(() => {
    catalog.load();
  }, []);

  React.useEffect(() => {
    console.log(catalog.byId)
  }, [catalog.byId]);

  const completion = useStepCompletion({
    detailsService: detallesPasosRetail,
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

//Hook para los detalles de los pasos de retail, usando el hook genérico de detalles de pasos
export function useRetailStepDetails(selected?: string) {
  const { detallesPasosRetail } = useGraphServices();
  const graph = useGraphServices();

  return useStepDetails({
    detailsService: detallesPasosRetail,
    selected,
    activationModule: "Retail",
    graph,
    sortItems: items => items.sort((a, b) => Number(a.NumeroPaso) - Number(b.NumeroPaso)),
  });
}