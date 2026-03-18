import React from "react";
import {createDefaultCargoCiudadAnalistaErrors, createDefaultCargoCiudadAnalistaState,} from "../utils/cargoCiudadAnalistaDefaults";
import {isCargoCiudadAnalistaFormValid, validateCargoCiudadAnalistaForm,} from "../utils/cargoCiudadAnalistaValidation";
import type { cargoCiudadAnalista, cargoCiudadAnalistaErrors } from "../../../../models/requisiciones";

export function useCargoCiudadAnalistaForm() {
  const [state, setState] = React.useState<cargoCiudadAnalista>(createDefaultCargoCiudadAnalistaState());
  const [errors, setErrors] = React.useState<cargoCiudadAnalistaErrors>(createDefaultCargoCiudadAnalistaErrors());

  const setField = React.useCallback(<K extends keyof cargoCiudadAnalista>(key: K, value: cargoCiudadAnalista[K]) => {setState((prev) => ({ ...prev, [key]: value }));}, []);

  const cleanState = React.useCallback(() => {
    setState(createDefaultCargoCiudadAnalistaState());
    setErrors(createDefaultCargoCiudadAnalistaErrors());
  }, []);

  const validate = React.useCallback((): boolean => {
    const nextErrors = validateCargoCiudadAnalistaForm(state);
    setErrors(nextErrors);
    return isCargoCiudadAnalistaFormValid(nextErrors);
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