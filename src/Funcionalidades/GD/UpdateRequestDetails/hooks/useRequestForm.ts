import React from "react";
import type { detalle, solicitud,  } from "../../../../models/solicitudCambio";
import { createEmptyRequestDetail } from "../utils/requestState";

export function useRequestDetailsForm() {
  const [state, setState] = React.useState<detalle>(() => createEmptyRequestDetail());

  const setField = React.useCallback(<K extends keyof solicitud>(k: K, v: solicitud[K]) => {
    setState(prev => ({ ...prev, [k]: v }));
  }, []);

  const reset = React.useCallback(() => {
    setState(createEmptyRequestDetail());
  }, []);

  return {
    state,
    setState,
    setField,
    reset,
  };
}