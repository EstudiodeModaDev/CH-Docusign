import React from "react";

import { createDefaultANSErrors, createDefaultANSState,} from "../utils/ansDefaults";
import { isANSFormValid, validateANSForm } from "../utils/ansValidation";
import type { ansRequisicion, ansRequisionErrors } from "../../../../models/requisiciones";

export function useANSForm() {
  const [state, setState] = React.useState<ansRequisicion>(createDefaultANSState());
  const [errors, setErrors] = React.useState<ansRequisionErrors>(createDefaultANSErrors());

  const setField = React.useCallback(<K extends keyof ansRequisicion>(key: K, value: ansRequisicion[K]) => {setState((prev) => ({ ...prev, [key]: value }));}, []);

  const cleanState = React.useCallback(() => {
    setState(createDefaultANSState());
    setErrors(createDefaultANSErrors());
  }, []);

  const validate = React.useCallback(() => {
    const nextErrors = validateANSForm(state);
    setErrors(nextErrors);
    return isANSFormValid(nextErrors);
  }, [state]);

  return {
    state,
    setState,
    errors,
    setErrors,
    setField,
    cleanState,
    validate,
  };
}