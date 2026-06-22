import { normalize, normalizeDate } from "../../../../utils/Date";

const blankZeroEquivalentFields = new Set<string>([
  "PROMEDIO_x0020_",
  "Promedio",
  "VALOR_x0020_GARANTIZADO",
  "ValorGarantizado",
  "auxConectividadValor",
  "Auxiliodetransporte",
]);

function isBlankOrZero(value: unknown) {
  return value === null || value === undefined || value === "" || value === 0 || value === "0";
}

export function areFieldValuesEqual(
  field: string,
  previous: unknown,
  next: unknown,
  type: "text" | "date" = "text"
) {
  const normalizedPrevious = type === "date" ? normalizeDate(previous) : normalize(previous);
  const normalizedNext = type === "date" ? normalizeDate(next) : normalize(next);

  if (normalizedPrevious === normalizedNext) return true;

  if (blankZeroEquivalentFields.has(field)) {
    return isBlankOrZero(normalizedPrevious) && isBlankOrZero(normalizedNext);
  }

  return false;
}
