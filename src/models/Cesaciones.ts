export type Cesacion = {
    Id?: string;
    Title: string; //Cedula
    Nombre: string;
    Cargo: string;
    Temporal: string;
    Tienda: string;
    Celular: string;
    Correoelectronico: string;
    FechaIngreso: string |null;
    FechaSalidaCesacion: string | null;
    FechaIngresoCesacion: string | null;
    FechaLimiteDocumentos: string | null;
    Jefedezona: string;
    Reportadopor: string;
    Empresaalaquepertenece: string;
    Fechaenlaquesereporta: string;
    TipoDoc: string;
    Departamento: string;
    Ciudad: string;
    Niveldecargo: string;
    CargoCritico: string;
    Dependencia: string;
    CodigoCC : string;
    DescripcionCC: string;
    CodigoCO: string;
    DescripcionCO: string;
    CodigoUN: string;
    DescripcionUN: string;
    Salario: string;
    SalarioTexto: string;
    auxConectividadTexto: string;
    auxConectividadValor: string;
    Pertenecealmodelo: boolean;
    GrupoCVE: string;
    PresupuestaVentas: string;
    Autonomia: string,
    ImpactoCliente: string;
    contribucionEstrategia: string;
    Promedio: string
}

export type CesacionErrors = Partial<Record<keyof Cesacion, string>>;

export type PasosProceso = {
    Id?: string;
    Title: string;
    NombrePaso: string;
    Orden: number;
    NombreEvidencia: string;
    TipoPaso: string;
    PlantillaCorreo: string
    PlantillaAsunto: string;
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