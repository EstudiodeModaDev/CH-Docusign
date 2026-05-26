import type { detalleRequisicion, pasoRequisicion } from "../../../../models/Requisiciones/pasos";
import type { PhaseSummary, StepType } from "./types";

export function normalizeStepType(value: string | null | undefined): StepType {
  const normalized = String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized === "numerico" || normalized === "numero") return "Numerico";
  if (normalized === "texto") return "Texto";
  return "Aprobacion";
}

export function sortChecklistSteps(rows: pasoRequisicion[]): pasoRequisicion[] {
  return [...(rows ?? [])].sort((a, b) => {
    const aId = Number(a.Id ?? Number.MAX_SAFE_INTEGER);
    const bId = Number(b.Id ?? Number.MAX_SAFE_INTEGER);

    if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) {
      return aId - bId;
    }

    return String(a.Title ?? "").localeCompare(String(b.Title ?? ""), "es");
  });
}

export function resolveChecklistPhase(steps: pasoRequisicion[], details: detalleRequisicion[]): PhaseSummary {
  if (!steps.length) {
    return { label: "Sin checklist", tone: "pending", completed: 0, total: 0 };
  }

  const detailByStepId = new Map((details ?? []).map((detail) => [String(detail.Title ?? ""), detail]));
  const orderedSteps = sortChecklistSteps(steps);
  const completed = orderedSteps.reduce(
    (count, step) => count + (isStepDone(detailByStepId.get(String(step.Id ?? ""))?.Estado) ? 1 : 0),
    0
  );

  const currentStep = orderedSteps.find((step, index) => {
    const current = detailByStepId.get(String(step.Id ?? ""));
    const previous = index > 0 ? detailByStepId.get(String(orderedSteps[index - 1].Id ?? "")) : null;
    const unlocked = index === 0 || isStepDone(previous?.Estado);
    return unlocked && !isStepDone(current?.Estado);
  });

  if (currentStep) {
    return {
      label: currentStep.Title || "Paso pendiente",
      tone: completed > 0 ? "current" : "pending",
      completed,
      total: orderedSteps.length,
    };
  }

  return {
    label: "Checklist completado",
    tone: "done",
    completed,
    total: orderedSteps.length,
  };
}

export function isStepDone(status: string | null | undefined): boolean {
  const normalized = String(status ?? "").trim().toLowerCase();
  return normalized === "completado" || normalized === "omitido";
}
