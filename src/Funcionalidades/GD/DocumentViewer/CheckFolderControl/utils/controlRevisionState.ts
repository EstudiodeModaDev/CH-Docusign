import type { ControlRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { toISODateFlex } from "../../../../../utils/Date";

export function createEmptyControlCarpeta(folderInfo: {cedula: string, nombre: string, fullname: string, path: string}, empresa: string): ControlRevisionCarpetas {
  return {
    Title: `Control de revisión: ${folderInfo.cedula} - ${folderInfo.nombre}`,
    AprobadoPor: "",
    Cedula: folderInfo.cedula,
    CorreoAprobadoPor: "",
    CorreoDevueltoPor: "",
    CorreoEnviadoRevisionPor: "",
    DevueltoPor: "",
    Empresa: empresa,
    CantidadDevoluciones: 0,
    Estado: "En construcción",
    EnviadoRevisionPor: "",
    FechaAprobacion: null,
    FechaDevolucion: null,
    FechaEnvioRevision: null,
    FechaUltimaAccion: toISODateFlex(new Date()),
    FolderName: folderInfo.nombre,
    FolderPath: folderInfo.path,
    MotivoUltimaDevolucion: "",
    NombreColaborador: folderInfo.nombre,
    UltimaAccion: "",
    UltimoActor: "Sistema"
  };
}