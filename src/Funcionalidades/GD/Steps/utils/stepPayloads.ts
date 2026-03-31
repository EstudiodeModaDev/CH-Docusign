import type { PasosProceso } from "../../../../models/Pasos";
import { todayISO } from "../../../../utils/Date";


// Construir los payloads para actualizar el estado de un paso a "Omitido"
export function buildOmitStepPayload(userName: string) {
  return {
    EstadoPaso: "Omitido",
    CompletadoPor: userName,
    FechaCompletacion: todayISO(),
    Notas: "Paso omitido",
  };
}

// Construir los payloads para actualizar el estado de un paso a "Completado"
export function buildCompletedStepPayload(userName: string, notas?: string) {
  return {
    EstadoPaso: "Completado",
    CompletadoPor: userName,
    FechaCompletacion: todayISO(),
    ...(notas ? { Notas: notas } : {}),
  };
}

//Construir el payload para crear un nuevo detalle de paso (cuando se asigna un paso a un proceso por primera vez)
export function buildDetailCreatePayload(entityId: string, paso: PasosProceso) {
  return {
    Title: entityId,
    CompletadoPor: "",
    EstadoPaso: "Pendiente",
    FechaCompletacion: "",
    Notas: "",
    NumeroPaso: paso.Orden ?? "",
    Paso: Number(paso.NombrePaso),
    TipoPaso: paso.TipoPaso,
  };
}

