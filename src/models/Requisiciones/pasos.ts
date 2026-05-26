export type pasoRequisicion = {
  Id?: string,
  Title: string //Nombre del paso
  TipoPaso: string
  Descripcion: string;
  Obligatorio: boolean;
  Activo: boolean
  OrdenPaso: number
};

export type detalleRequisicion = {
  Id?: string,
  Title: string //IdPasoPlantilla
  IdRequisicion: string
  Estado: string
  CompletadoPor: string;
  Notas: string;
  FechaCompletadoPor: string | null;
};

