import React from "react";
import { useGraphServices } from "../../../../graph/graphContext";
import type { PasosProceso } from "../../../../models/Pasos";
import { useStepDecisionState } from "../sharedHooks/useStepDecisionState";
import { useStepsCatalog } from "../sharedHooks/useStepsCatalog";
import { useStepCompletion } from "../sharedHooks/useStepCompletion";
import { useStepDetails } from "../sharedHooks/useStepDetails";


export function useNovedadesSteps() {
  const { PasosNovedades, DetallesPasosNovedades } = useGraphServices();

  const decisionState = useStepDecisionState();

  const catalog = useStepsCatalog({
    getAll: PasosNovedades.getAll.bind(PasosNovedades),
    includeInactive: true,
    update: PasosNovedades.update.bind(PasosNovedades),
  });

  React.useEffect(() => {
    catalog.load();
  }, []);

  const completion = useStepCompletion({
    detailsService: DetallesPasosNovedades, 
    byId: catalog.byId,
    decisiones: decisionState.decisiones,
    motivos: decisionState.motivos,
  });

  const [state, setState] = React.useState<PasosProceso>({
    NombreEvidencia: "",
    Activado: true,
    NombrePaso: "",
    Orden: 0,
    TipoPaso: "",
    Title: "",
    PlantillaCorreo: "",
    PlantillaAsunto: "",
    Obligatorio: true,
  });

  const setField = <K extends keyof PasosProceso>(k: K, v: PasosProceso[K]) =>
    setState(s => ({ ...s, [k]: v }));

  return {
    ...catalog,
    ...decisionState,
    ...completion,
    state,
    setState,
    setField,
  };
}

export function useNovedadesStepDetails(selected?: string) {
  const { DetallesPasosNovedades } = useGraphServices();
  const graph = useGraphServices();

  return useStepDetails({
    detailsService: DetallesPasosNovedades,
    selected,
    activationModule: "Contratacion",
    graph,
  });
}