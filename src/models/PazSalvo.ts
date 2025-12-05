import type { ImagenRead, ImagenWrite } from "./Imagenes";

export type solicitados = {
    correo: string;
    nombre: string;
    estado: "En espera" | "Aprobado" | "Rechazado";
    fechaRespuesta?: string;
}

export type PazSalvo = {
    Id?: string;
    Consecutivo: string;
    Title: string
    Nombre: string;
    Empresa: string;
    Cargo: string; 
    CO: string;
    Jefe: string;
    CorreoJefe: string;
    FechaSalida: string  |null;
    FechaIngreso: string |null;
    Estado: string;
    Solicitados: solicitados[],
    Solicitante: string;
}

export type PazSalvoErrors = Partial<Record<keyof PazSalvo, string>>;
export type permisosErrors = Partial<Record<keyof permisos, string>>;
export type respuestaErrors = Partial<Record<keyof respuestas, string>>;

export type permisos = {
    Id?: string;
    Title: string;
    Correo: string;
}

export type renovar = {
    Id?: string;
    Title: string;
    Nombre: string;
    Estado: string
}

// Modelo del item para CREAR/ACTUALIZAR
export interface MiItemConFotoCreate {
  Title: string;
  Firma?: ImagenWrite; // nombre interno de tu columna
}

export interface ItemFirma {
  Id?: string;
  Title: string;
  Firma?: ImagenRead | null;  // lectura desde Graph
}

export interface ItemFirmaCreate {
  Id?: string;
  Title: string;
  Firma?: ImagenWrite | null;  // lectura desde Graph
}

export type respuestas = {
  Id?: string;
  Correo: string;
  Title: string;
  IdPazSalvo: string;
  Respuesta: string;
  Estado: string; 
  Area: string
}

