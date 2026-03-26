import React from "react";
import type { solicitud, solicitudErrors } from "../../../../models/solicitudCambio";
import { createEmptyRequest } from "../utils/requestState";
import { validateRequest } from "../utils/requestValidation";

export function useRequestForm(reportadoPor: string, correo: string) {
  const [state, setState] = React.useState<solicitud>(() => createEmptyRequest(reportadoPor, correo));
  const [errors, setErrors] = React.useState<solicitudErrors>({});

  const setField = React.useCallback(<K extends keyof solicitud>(k: K, v: solicitud[K]) => {
    setState(prev => ({ ...prev, [k]: v }));
  }, []);

  const reset = React.useCallback(() => {
    setState(createEmptyRequest(reportadoPor, correo));
    setErrors({});
  }, [reportadoPor, correo]);

  const validate = React.useCallback(() => {
    const nextErrors = validateRequest(state);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [state]);

  return {
    state,
    setState,
    setField,
    errors,
    setErrors,
    validate,
    reset,
  };
}