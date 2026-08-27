import * as React from "react";
import type { RequisicionesMetrics } from "../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";

type RequisicionesMetricasDataValue = {
  loading: boolean;
  error: string | null;
  rowsCount: number;
  metrics: RequisicionesMetrics;
};

const RequisicionesMetricasDataContext = React.createContext<RequisicionesMetricasDataValue | null>(null);

export const RequisicionesMetricasDataProvider = RequisicionesMetricasDataContext.Provider;

export function useRequisicionesMetricasData(): RequisicionesMetricasDataValue {
  const ctx = React.useContext(RequisicionesMetricasDataContext);

  if (!ctx) {
    throw new Error("useRequisicionesMetricasData debe usarse dentro de RequisicionesMetricasLayout");
  }

  return ctx;
}
