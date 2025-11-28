export type HabeasData = {
    Id?: string, 
    Title: string, //
    Informacionreportadapor: string, //
    Fechaenlaquesereporta: string | null, //
    Tipodoc: string, //
    AbreviacionTipoDoc: string,
    Ciudad: string,
    NumeroDocumento: string,
    Correo: string
    Empresa: string
}

export type HabeasErrors = Partial<Record<keyof HabeasData, string>>;