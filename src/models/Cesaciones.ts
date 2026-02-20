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
    FechaLimiteDocumentos: string | null;
    Jefedezona: string;
    Reportadopor: string;
    Empresaalaquepertenece: string;
    Fechaenlaquesereporta: string | null;
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
    Promedio: string;
    Estado: string;
    direccionResidencia: string;
    CanceladoPor: string;
    RazonCancelacion: string;
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

export type CesacionCancelada = {
    Id?: string;
    Title: string //Fecha en la que se inicio el proceso inicialmente
    Informacionenviadapor: string
    Procesocanceladopor: string
    Empresaquesolicito: string
    TipoDocumento: string
    Numeroidentificacion: string;
    Correo: string;
    Celular?: string;
    Ciudad: string;
    RazonCancelacion: string;
    Nombre: string
    Created?: string
}