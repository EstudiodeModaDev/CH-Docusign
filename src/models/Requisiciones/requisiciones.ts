export type requisiciones = {
    //Comunes
    Id?: string;
    Title: string; //Cargo
    Ciudad: string;
    tipoRequisicion: string;
    codigoUnidadNegocio: string;
    descripcionUnidadNegocio: string;
    genero: string;
    motivo: string;
    tipoConvocatoria: string;
    salarioBasico: string;
    comisiones: string;
    fechaInicioProceso: string | null;
    fechaLimite: string | null;
    solicitante: string;
    diasHabiles: number;
    correoSolicitante: string;
    correoProfesional: string;
    nombreProfesional: string;
    descripcionCentroCosto: string; //Area o marca
    codigoCentroCosto: string;
    fechaIngreso: string | null;
    ANS: string;
    cumpleANS: string;
    direccion: string;
    perteneceCVE: string;
    grupoCVE: string;
    auxilioRodamiento: string;
    modalidadTeletrabajo: string;
    empresaContratista: string;
    Estado: string;
    fechaTerna: string | null;
    motivoNoCumplimiento: string;
    Identificador: string;
    nuevoPromocion: string
    NivelCargo: string
    porceranje: number

    //Retail
    tienda?: string; //Centro operativo
    codigoCentroOperativo?: string;

    notified?:boolean
}

export type ansRequisicion ={
    Id?: string;
    Title: string;
    AplicaVDPNuevo: boolean;
    AplicaVDPPromocion: boolean;
    NivelCargo: string;
    diasHabiles0: number;
}

export type cargoCiudadAnalista = {
    Id?: string;
    Title: string;
    Cargo: string;
    Ciudad: string;
    nombreAnalista: string
}

export type MaestroMotivos = {
    Id?: string;
    Title: string;
    destinatarios: string;
    notificacion: string;
    observaciones: string;
    realVsPpto: string;
}

export type moverAns = {
    Id?: string;
    Title: string;
    ANS: string;
    fechaComentario: string | null;
    fechaLimite: string | null;
    observacion: string;
}

export type RequisicionesErrors = Partial<Record<keyof requisiciones, string>>;
export type ansRequisionErrors = Partial<Record<keyof ansRequisicion, string>>;
export type cargoCiudadAnalistaErrors = Partial<Record<keyof cargoCiudadAnalista, string>>;
export type maestroMotivosErrors = Partial<Record<keyof MaestroMotivos, string>>;
export type moverANSErrors = Partial<Record<keyof moverAns, string>>;
