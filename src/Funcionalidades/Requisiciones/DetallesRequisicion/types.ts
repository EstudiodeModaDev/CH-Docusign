import type { detalleRequisicion, pasoRequisicion } from "../../../models/Requisiciones/pasos";

export type RequisicionDecisionMap = Record<string, "" | "Aprobado" | "Rechazado">;
export type RequisicionReasonMap = Record<string, string>;

export type RequisicionStepResolved = {
  templateId: string;
  detailId: string;
  nombrePaso: string;
  descripcion: string;
  tipoPaso: string;
  ordenPaso: number;
  obligatorio: boolean;
  activo: boolean;
  idRequisicion: string;
  estado: string;
  completadoPor: string;
  notas: string;
  fechaCompletadoPor: string | null;
  plantilla: pasoRequisicion | null;
  detalle: detalleRequisicion | null;
};
