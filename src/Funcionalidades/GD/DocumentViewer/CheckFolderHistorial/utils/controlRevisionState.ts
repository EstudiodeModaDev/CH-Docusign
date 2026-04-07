import type { AccountInfo } from "@azure/msal-browser";
import type { HistorialRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { toISODateFlex } from "../../../../../utils/Date";

export function createEmptyHistorialCarpeta(folderInfo: {cedula: string, nombre: string, fullname: string, path: string}, account: AccountInfo | null): HistorialRevisionCarpetas {
  return {
    Title: `Control de revisión: ${folderInfo.cedula} - ${folderInfo.nombre}`,
    Accion: "",
    Cedula: folderInfo.cedula,
    Comentario: "",
    ControlRevisionId: "",
    CorreoRealizadoPor: "",
    EstadoAnterior: "",
    EstadoResultante: "",
    FechaAccion: toISODateFlex(new Date()),
    RealizadoPor: account?.name ?? "Desconocido",
    FolderPath: folderInfo.path,
    NombreColaborador: folderInfo.fullname,
  };
}