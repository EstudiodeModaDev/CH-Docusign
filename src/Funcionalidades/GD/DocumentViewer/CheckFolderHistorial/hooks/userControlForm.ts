import React from "react";
import type { ControlRevisionCarpetas, HistorialRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { createEmptyHistorialCarpeta } from "../utils/controlRevisionState";
import { useAuth } from "../../../../../auth/authProvider";


export function useFolderControlForm(folderInfo: {cedula: string, nombre: string, fullname: string, path: string},) {
  const auth = useAuth(); 
  const [state, setState] = React.useState<HistorialRevisionCarpetas>(() => createEmptyHistorialCarpeta(folderInfo, auth.account,));

  const setField = React.useCallback(<K extends keyof ControlRevisionCarpetas>(k: K, v: ControlRevisionCarpetas[K]) => {
    setState(prev => ({ ...prev, [k]: v }));
  }, []);

  const reset = React.useCallback(() => {
    setState(createEmptyHistorialCarpeta(folderInfo, auth.account));
  }, [folderInfo, auth.account]);

  return {
    state,
    setState,
    setField,
    reset,
  };
}