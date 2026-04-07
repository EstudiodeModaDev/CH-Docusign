import type { AccountInfo } from "@azure/msal-browser";
import type { HistorialRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { toISODateFlex } from "../../../../../utils/Date";

export function buildSendRevisionPayload(state: HistorialRevisionCarpetas, account: AccountInfo | null, Accion: string): Partial<HistorialRevisionCarpetas> {
  console.log("Payload antes de conversión:", state);

  return {
    Accion,
    Cedula: state.Cedula,
    Comentario: state.Comentario,
    ControlRevisionId: state.ControlRevisionId,
    FolderPath: state.FolderPath,
    NombreColaborador: state.NombreColaborador,
    CorreoRealizadoPor: account?.username ?? "Desconocido",
    EstadoAnterior: state.EstadoAnterior,
    EstadoResultante: "En revisión",
    Title: `Control de revisión: ${state.Cedula} - ${state.NombreColaborador}`,
    FechaAccion: toISODateFlex(new Date()),
    RealizadoPor: account?.name ?? "Desconocido"
  };
}