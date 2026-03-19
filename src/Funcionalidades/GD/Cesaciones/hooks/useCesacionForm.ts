import React from "react";
import { validateCesacion } from "../utils/cesacionValidation";
import { createEmptyCesacion } from "../utils/cesacionesState";
import type { Cesacion, CesacionErrors } from "../../../../models/Cesaciones";

export function useCesacionForm(reportadoPor: string) {
  const [state, setState] = React.useState<Cesacion>(() => createEmptyCesacion(reportadoPor ?? ""));
  const [errors, setErrors] = React.useState<CesacionErrors>({});

  const setField = React.useCallback(<K extends keyof Cesacion>(k: K, v: Cesacion[K]) => {
    setState(prev => ({ ...prev, [k]: v }));
  }, []);

  const reset = React.useCallback(() => {
    setState(createEmptyCesacion(reportadoPor ?? ""));
    setErrors({});
  }, [reportadoPor]);

  const validate = React.useCallback(() => {
    const nextErrors = validateCesacion(state);
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