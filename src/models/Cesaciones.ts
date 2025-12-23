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
    DescripcionCC: string
}

export type CesacionErrors = Partial<Record<keyof Cesacion, string>>;
