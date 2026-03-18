import React from "react";
import { createEmptyHabeas } from "../utils/habeasState";
import type { HabeasData, HabeasErrors } from "../../../../models/HabeasData";
import { validateHabeas } from "../utils/habeasValidation";

export function useHabeasForm(reportadoPor?: string) {
  const [state, setState] = React.useState<HabeasData>(() => createEmptyHabeas(reportadoPor ?? ""));
  const [errors, setErrors] = React.useState<HabeasErrors>({});

  const setField = React.useCallback(<K extends keyof HabeasData>(k: K, v: HabeasData[K]) => {
    setState(prev => ({ ...prev, [k]: v }));
  }, []);

  const reset = React.useCallback(() => {
    setState(createEmptyHabeas(reportadoPor ?? ""));
    setErrors({});
  }, [reportadoPor]);

  const validate = React.useCallback(() => {
    const nextErrors = validateHabeas(state);
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