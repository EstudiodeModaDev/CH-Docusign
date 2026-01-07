import type { ParamTab } from "../Components/Settings/SettingsPage";
import type { Proceso } from "../utils/unify";
import type { Cesacion, DetallesPasos, PasosProceso } from "./Cesaciones";
import type { Novedad } from "./Novedades";
import type { Promocion } from "./Promociones";
import type { Retail } from "./Retail";

export type PropsProceso = {
  titulo: string;
  selectedCesacion: Cesacion | Promocion | Novedad | Retail;
  loadingPasos: boolean;
  errorPasos: string | null;
  pasosById: Record<string, PasosProceso>;
  decisiones: Record<string, "" | "Aceptado" | "Rechazado">;
  motivos: Record<string, string>;
  setMotivos: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDecisiones: React.Dispatch<React.SetStateAction<Record<string, "" | "Aceptado" | "Rechazado">>>;
  onClose: () => void;
  handleCompleteStep: (detalle: DetallesPasos, path?: string) => void;
  detallesRows: DetallesPasos[];
  loadingDetalles: boolean;
  errorDetalles: string | null;
  loadDetalles: () => void;
  proceso: Proceso;
};

export type TablaParametrosProps = {
  tabs: ParamTab[];
  value: string;                     // id activo
  onChange: (id: string) => void;
};
