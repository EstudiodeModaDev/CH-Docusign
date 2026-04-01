export type PathsState = {
  estudio: string;
  dh: string;
  denim: string;
  visual: string;
  meta: string;
  broken: string;
};

export type ControlRevisionCarpetas = {
  Id?: string;
  Title: string;
  Cedula: string;
  NombreColaborador: string;
  Empresa: string;
  FolderPath: string;
  FolderName: string;
  Estado: string;
  FechaEnvioRevision: string | null;
  EnviadoRevisionPor: string;
  FechaAprobacion: string | null;
  CorreoEnviadoRevisionPor: string;
  AprobadoPor: string;
  CorreoAprobadoPor: string;
  FechaDevolucion: string | null;
  DevueltoPor: string;
  CorreoDevueltoPor: string;
  MotivoUltimaDevolucion: string;
  CantidadDevoluciones: Number;
  UltimaAccion: string;
  FechaUltimaAccion: string | null;
  UltimoActor: string
}

export type HistorialRevisionCarpetas = {
  Id?: string;
  Title: string;
  ControlRevisionId: string;
  Cedula: string;
  NombreColaborador: string;
  FolderPath: string;
  EstadoAnterior: string;
  Accion: string;
  EstadoResultante: string;
  Comentario: string;
  RealizadoPor: string | null;
  CorreoRealizadoPor: string;
  FechaAccion: string | null;
}

export type EmpresaKey = "estudio" | "dh" | "denim" | "visual" | "meta" | "broken";