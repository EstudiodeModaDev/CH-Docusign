import type { AccountInfo } from "@azure/msal-browser";
import type { ControlRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { toISODateFlex } from "../../../../../utils/Date";

const EMPRESA_LABELS: Record<string, string> = {
  broken: "BROKEN",
  estudio: "ESTUDIO DE MODA",
  dh: "DH RETAIL",
  denim: "DENIM HEAD",
  meta: "METAGRAPHICS",
  visual: "VISUAL",
};

const convertEmpresaToLegible = (empresa: string) => {
  return EMPRESA_LABELS[empresa] || empresa;
}

export function buildFirstTimeControlRevisionPayload(state: ControlRevisionCarpetas): Partial<ControlRevisionCarpetas> {
  console.log("Payload antes de conversión:", state);

  return {
    CantidadDevoluciones: 0,
    Cedula: state.Cedula,
    Empresa: convertEmpresaToLegible(state.Empresa),
    FolderName: state.FolderName,
    FolderPath: state.FolderPath,
    NombreColaborador: state.NombreColaborador,
    Estado: "En construcción",
    UltimoActor: "Sistema",
    UltimaAccion: "Creación de control de revisión",
    Title: `Control de revisión: ${state.Cedula} - ${state.NombreColaborador}`,
    FechaUltimaAccion: toISODateFlex(new Date()),
  };
}

export function buildSendRevisionPayload(state: ControlRevisionCarpetas, account: AccountInfo | null): Partial<ControlRevisionCarpetas> {
  return {
    CantidadDevoluciones: 0, 
    CorreoEnviadoRevisionPor: account ? account.username : undefined,
    EnviadoRevisionPor: account ? account.name : undefined,
    Estado: "En revisión",
    FechaEnvioRevision: toISODateFlex(new Date()),
    UltimaAccion: "Envió a revisión",
    Title: `Control de revisión: ${state.Cedula} - ${state.NombreColaborador}`,
    UltimoActor: account ? account.name : undefined,
  };
}

export function buildReturnedPayload(state: ControlRevisionCarpetas, account: AccountInfo | null): Partial<ControlRevisionCarpetas> {
  return {
    CantidadDevoluciones: Number(state.CantidadDevoluciones) + 1, 
    DevueltoPor: account ? account.username : undefined,
    CorreoDevueltoPor: account ? account.name : undefined,
    Estado: "En construcción",
    FechaDevolucion: toISODateFlex(new Date()),
    UltimaAccion: "Devolución de carpeta",
    Title: `Control de revisión: ${state.Cedula} - ${state.NombreColaborador}`,
    UltimoActor: account ? account.name : undefined,  
  };
}

export function buildApprovePayload(state: ControlRevisionCarpetas, account: AccountInfo | null): Partial<ControlRevisionCarpetas> {
  return {
    Estado: "Aprobado",
    FechaAprobacion: toISODateFlex(new Date()),
    AprobadoPor: account ? account.username : undefined,
    CorreoAprobadoPor: account ? account.name : undefined,
    FechaUltimaAccion: toISODateFlex(new Date()),
    UltimaAccion: "Aprobación de carpeta",
    Title: `Control de revisión: ${state.Cedula} - ${state.NombreColaborador}`,
    UltimoActor: account ? account.name : undefined,  
  };
}