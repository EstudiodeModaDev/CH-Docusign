import React from "react";
import type { ControlRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { createEmptyControlCarpeta } from "../utils/controlRevisionState";


export function useFolderControlForm(folderInfo: {cedula: string, nombre: string, fullname: string, path: string}, empresa: string) {
  const [state, setState] = React.useState<ControlRevisionCarpetas>(() => createEmptyControlCarpeta(folderInfo, empresa));

  const setField = React.useCallback(<K extends keyof ControlRevisionCarpetas>(k: K, v: ControlRevisionCarpetas[K]) => {
    setState(prev => ({ ...prev, [k]: v }));
  }, []);

  const reset = React.useCallback(() => {
    setState(createEmptyControlCarpeta(folderInfo, empresa));
  }, [folderInfo, empresa]);

  return {
    state,
    setState,
    setField,
    reset,
  };
}