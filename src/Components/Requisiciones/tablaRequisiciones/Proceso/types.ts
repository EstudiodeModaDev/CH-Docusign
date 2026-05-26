import type { detalleRequisicion, pasoRequisicion } from "../../../../models/Requisiciones/pasos";
import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";

export type ProcesoRequisicionModalProps = {
  open: boolean;
  row: requisiciones | null;
  onClose: () => void;
  onChecklistChanged?: () => void | Promise<void>;
};

export type StepType = "Aprobacion" | "Numerico" | "Texto";
export type StatusTone = "done" | "current" | "pending";

export type PhaseSummary = {
  label: string;
  tone: StatusTone;
  completed: number;
  total: number;
};

export type StepFieldState = {
  approvalValues: Record<string, "" | "Aprobado" | "Rechazado">;
  textValues: Record<string, string>;
  numberValues: Record<string, string>;
  loadingId: string;
};

export type StepCardProps = {
  rowId: string;
  step: pasoRequisicion;
  detail: detalleRequisicion;
  stepTone: StatusTone;
  busy: boolean;
  approvalValue: "" | "Aprobado" | "Rechazado";
  textValue: string;
  numberValue: string;
  onApprovalChange: (detailId: string, value: "" | "Aprobado" | "Rechazado") => void;
  onTextChange: (detailId: string, value: string) => void;
  onNumberChange: (detailId: string, value: string) => void;
  onOmit: (detail: detalleRequisicion) => void | Promise<void>;
  onComplete: (detail: detalleRequisicion, step: pasoRequisicion) => void | Promise<void>;
};
