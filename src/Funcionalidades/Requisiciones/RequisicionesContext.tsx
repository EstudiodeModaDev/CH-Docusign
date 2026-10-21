import * as React from "react";
import { Outlet } from "react-router-dom";
import { useRequisicion } from "./Requisicion/Hooks/requisicion";


type RequisicionesContextValue = ReturnType<typeof useRequisicion>;

const RequisicionesContext = React.createContext<RequisicionesContextValue | null>(null);

export function RequisicionesProvider() {
  const value = useRequisicion();

  return (
    <RequisicionesContext.Provider value={value}>
      <Outlet />
    </RequisicionesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRequisicionesContext() {
  const ctx = React.useContext(RequisicionesContext);

  if (!ctx) {
    throw new Error("useRequisicionesContext debe usarse dentro de RequisicionesProvider");
  }

  return ctx;
}
