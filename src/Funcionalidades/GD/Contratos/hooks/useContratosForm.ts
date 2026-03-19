import React from "react";
import { createEmptyContratos } from "../utils/contratosState";
import type { Novedad, NovedadErrors } from "../../../../models/Novedades";
import { validateContrato } from "../utils/contratosValidation";

export function useContratosForm(reportadoPor: string) {
  const [state, setState] = React.useState<Novedad>(() => createEmptyContratos(reportadoPor ?? ""));
  const [errors, setErrors] = React.useState<NovedadErrors>({});

  const setField = React.useCallback(<K extends keyof Novedad>(k: K, v: Novedad[K]) => {
    setState(prev => ({ ...prev, [k]: v }));
  }, []);

  const reset = React.useCallback(() => {
    setState(createEmptyContratos(reportadoPor ?? ""));
    setErrors({});
  }, [reportadoPor]);

  const validate = React.useCallback(() => {
    const nextErrors = validateContrato(state);
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