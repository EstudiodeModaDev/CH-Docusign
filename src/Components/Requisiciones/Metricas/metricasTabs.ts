import type { ParamTab } from "../../../models/Props";

export const METRICAS_TABS: ParamTab[] = [
  { id: "resumen", label: "Resumen", to: "/requisiciones/metricas/resumen" },
  { id: "encuesta", label: "Encuesta de satisfación", to: "/requisiciones/metricas/satisfaccion" },
  { id: "probationary", label: "Encuesta periodo de prueba", to: "/requisiciones/metricas/probationary" },
];
