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