import React from "react";
import type { RequisicionDecisionMap, RequisicionReasonMap } from "./types";

export function useStepDecisionState() {
  const [decisiones, setDecisiones] = React.useState<RequisicionDecisionMap>({});
  const [motivos, setMotivos] = React.useState<RequisicionReasonMap>({});

  return {
    decisiones,
    motivos,
    setDecisiones,
    setMotivos,
  };
}
