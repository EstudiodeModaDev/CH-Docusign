export type PasosProceso = {
    Id?: string;
    Title: string;
    NombrePaso: string;
    Orden: number;
    NombreEvidencia: string;
    TipoPaso: string;
    PlantillaCorreo: string
    PlantillaAsunto: string;
    Obligatorio: boolean
}

export type DetallesPasos = {
    Id?: string;
    Title: string //IdPromocion
    Paso: number;
    NumeroPaso: string;
    EstadoPaso: string;
    CompletadoPor: string;
    FechaCompletacion: string;
    Notas: string;
    TipoPaso: string;
}

export type PasoRestriccion = {
  Id?: string
  Title: string //IdPaso 
  Proceso: string
  CargoNombre: string
  TipoRegla: string
  Activo: boolean
}

export type pasoUsuarioPermitido = {
    Id?: string
    Title: string //IdPaso
    Proceso: string
    correoUsuario: string
    Activo: boolean
}

export type Procesos = "Contratacion" | "Cesacion" | "Promocion" | "Retail"
export type TipoReglaCargo = "Incluir" | "Excluir"
