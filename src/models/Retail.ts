export type Retail = {
    Id?: string;
    Title: string; //Cedula
    TipoDoc: string;
    Nombre: string;
    Empresaalaquepertenece: string;
    CorreoElectronico: string;
    Celular: string;
    FechaIngreso: string | null;
    NivelCargo: string;
    Cargo: string;
    Salario: string;
    SalarioLetras: string;
    Auxiliodetransporte: string;
    Auxiliotransporteletras: string;
    Depedencia: string;
    Departamento: string;
    Ciudad: string;
    Temporal: string;
    CentroCostos: string;
    CodigoCentroCostos: string;
    CentroOperativo: string;
    CodigoCentroOperativo: string;
    UnidadNegocio: string;
    CodigoUnidadNegocio: string;
    PerteneceModelo: boolean;
    Autonomia: string;
    Presupuesto: string;
    Impacto: string;
    Contribucion: string;
    Promedio: string;
    GrupoCVE: string;
    OrigenSeleccion: string;
    InformacionEnviadaPor: string;
    FechaReporte: string | null;
    Estado: string;
}

export type RetailErrors = Partial<Record<keyof Retail, string>>;