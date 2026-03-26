export type solicitud = {
  Id?: string
  Title: string //Promocion | Habeas | Contrato | Retail | Cesacion
  IdRegistro: string  
  Estado: string
  NombreSolicitante: string,
  CorreoSolicitante: string,
  fechaSolicitud: string | null
  Razon: string
  Aprobador: string
  fechaAprobacion: string | null,
  comentarioAprobador: string
}

export type solicitudErrors = Partial<Record<keyof solicitud, string>>;


export type detalle = {
  Id?: string
  Title: string //IdSoliciitud
  NombreCampo: string  
  EtiquetaCampo: string
  ValorAnterior: string,
  ValorNuevo: string,
  TipoDato: string | null
}

export type detalleErrors = Partial<Record<keyof detalle, string>>;