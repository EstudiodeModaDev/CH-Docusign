import { usePermissions } from "../Permisos";
import * as React from "react";

export function useDocumentPermissions() {
  const { engine } = usePermissions();

  return React.useMemo(() => ({
    canInactivateRegister: engine.can("documents.retirement"),
    canCheckFinishedFolder: engine.can("documents.check"),
    canDelete: engine.can("documents.delete"),
    canApprove: engine.can("documents.approve"),
  }), [engine]);
}