export type Envio = {
    Id?: string;
    Title: string; //Documento enviado
    Cedula: string;
    Fechadeenvio: string | null;
    Estado: string;
    Receptor: string;
    CorreoReceptor: string;
    EnviadoPor: string;
    Datos: string;
    Recipients: string;
    IdSobre: string;
    ID_Novedad: string;
    Compa_x00f1_ia: string;
    Fuente: string
}

export type EnvioErrors = Partial<Record<keyof Envio, string>>;