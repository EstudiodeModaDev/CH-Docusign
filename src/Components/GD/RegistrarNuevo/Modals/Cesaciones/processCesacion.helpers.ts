import type { DetallesPasos, PasosProceso } from "../../../../../models/Pasos";

export type TipoPaso = "Aprobacion" | "Notificacion" | "SubidaDocumento";
export type EstadoFinal = "Completado" | "Omitido";

export function toRecipients(addresses: string[]) {
  return addresses.map((address) => ({ emailAddress: { address } }));
}

export function sanitizeFileName(name: string) {
  const bad = /["*:<>\?\/\\|]/g;
  let normalized = (name ?? "").replace(bad, "-").trim();
  normalized = normalized.replace(/[\. ]+$/g, "");
  normalized = normalized.replace(/\s+/g, " ");
  return normalized || "Evidencia";
}

export function withSuffix(name: string, index: number) {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return `${name} (${index})`;
  return `${name.slice(0, dot)} (${index})${name.slice(dot)}`;
}

export function normalizeProcessText(value: string) {
  return (value ?? "")
    .toString()
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/[â€-â€’â€“â€”â€•]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectTipoPaso(paso?: PasosProceso | null): TipoPaso {
  const tipo = paso?.TipoPaso ?? "";
  if (tipo === "Aprobacion" || tipo === "Notificacion" || tipo === "SubidaDocumento") {
    return tipo;
  }
  return "Aprobacion";
}

export function isEstadoDone(estado?: string | null) {
  return estado === "Completado" || estado === "Omitido";
}

export function getCurrentDetalle(detallesRows: DetallesPasos[]) {
  if (!detallesRows?.length) return null;

  for (let index = 0; index < detallesRows.length; index++) {
    const detalle = detallesRows[index];
    const previous = detallesRows[index - 1];
    const unlocked = index === 0 || isEstadoDone(previous?.EstadoPaso);
    const pending = !isEstadoDone(detalle?.EstadoPaso);

    if (unlocked && pending) return detalle;
  }

  return detallesRows[detallesRows.length - 1] ?? null;
}
