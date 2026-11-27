import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";
import type { DetailField } from "../../../../consts/requisicionesFields";
import { spDateToDDMMYYYY } from "../../../../utils/Date";
import { formatPesosEsCO } from "../../../../utils/Number";

export type EstadoTone = "active" | "closed" | "cancel" | "neutral";

export function countWords(value: string): number {
  const words = value.trim().match(/\S+/g);
  return words ? words.length : 0;
}

export function formatValue(row: requisiciones, field: DetailField): string {
  if (field.key === "Id") {
    return row.Id ? String(row.Id) : "Sin dato";
  }

  const value = row[field.key];

  if (value === null || value === undefined || value === "") {
    return "Sin dato";
  }

  if (field.kind === "date") {
    return spDateToDDMMYYYY(value as string);
  }

  if (field.kind === "money") {
    return "$ " + formatPesosEsCO(value as string);
  }

  return String(value);
}

export function getToneByEstado(estado: string): EstadoTone {
  const normalized = String(estado ?? "").trim().toLowerCase();

  if (normalized.includes("cancel")) return "cancel";
  if (normalized.includes("cerr")) return "closed";
  if (normalized.includes("activo") || normalized.includes("abiert")) return "active";
  return "neutral";
}
