import React from "react";
import type { requisiciones, RequisicionesErrors } from "../../../../models/requisiciones";
import type { SortDir, SortField } from "../../../../models/Commons";
import { cleanStateRequisicion } from "../utils/requisicionState";
import { useAuth } from "../../../../auth/authProvider";

export function useNewRequisicionForm() {
  const auth = useAuth()
  const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);
  const [state, setState] = React.useState<requisiciones>(cleanStateRequisicion(auth.account));
  const [errors, setErrors] = React.useState<RequisicionesErrors>({});
  
  const setField = React.useCallback(<K extends keyof requisiciones>(k: K, v: requisiciones[K]) => { setState((s) => ({ ...s, [k]: v }));}, []);
  

  const cleanState = () => {
    setState(cleanStateRequisicion(auth.account))
  };

  return {
    errors, sorts, state,  setErrors, setState,  setSorts, setField,  cleanState, 
  };
}



