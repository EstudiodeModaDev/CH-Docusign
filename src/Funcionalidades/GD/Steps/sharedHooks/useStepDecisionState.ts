import React from "react";
import type { StepDecisionMap, StepReasonMap } from "../../../../models/Pasos";

export function useStepDecisionState() {
  const [decisiones, setDecisiones] = React.useState<StepDecisionMap>({});
  const [motivos, setMotivos] = React.useState<StepReasonMap>({});

  return {
    decisiones,
    motivos,
    setDecisiones,
    setMotivos,
  };
}