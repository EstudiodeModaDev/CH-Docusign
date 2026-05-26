import React from "react";
import { useStepCompletion } from "../sharedHooks/useStepCompletion";
import { useStepDecisionState } from "../sharedHooks/useStepDecisionState";
import { useStepDetails } from "../sharedHooks/useStepDetails";
import { useStepsCatalog } from "../sharedHooks/useStepsCatalog";
import { useGestorServices } from "../../../../graph/graphContext";

//Todo el hook para cesación usando funciones reutilizables
export function useCesacionSteps() {
  const {PasosCesacion, DetallesPasosCesacion} = useGestorServices();

  const decisionState = useStepDecisionState();

  const catalog = useStepsCatalog({
    getAll: PasosCesacion.getAll.bind(PasosCesacion),
    includeInactive: true,
    update: PasosCesacion.update.bind(PasosCesacion),
  });

  React.useEffect(() => {
    catalog.load();
  }, []);

  const completion = useStepCompletion({
    detailsService: DetallesPasosCesacion,
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
  const {DetallesPasosCesacion, pasoRestriccion} = useGestorServices();

  return useStepDetails({
    detailsService: DetallesPasosCesacion,
    selected,
    activationModule: "Cesacion",
    service: {
      pasoRestriccion
    },
  });
}