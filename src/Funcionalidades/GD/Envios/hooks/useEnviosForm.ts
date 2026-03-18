import React from "react";
import type { Envio } from "../../../../models/Envios";
import { createEmptyEnvio } from "../utils/enviosState";
import { useAuth } from "../../../../auth/authProvider";

export function useEnviosForm() {
  const {account} = useAuth()
  const [state, setState] = React.useState<Envio>(()  => createEmptyEnvio(account?.name ?? ""));
  
  const setField = <K extends keyof Envio>(k: K, v: Envio[K]) => setState((s) => ({ ...s, [k]: v }));

  return {
    state, setState, setField
  };
}
