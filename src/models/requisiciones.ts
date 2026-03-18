export type requisiciones = {
    Id?: string;
    Title: string;
    Ciudad: string;
    tipoRequisicion: string;
    Area: string;
    descripcionCentroOperativo: string;
    codigoCentroOperativo: string;
    descripcionCentroCosto: string;
    codigoCentroCosto: string;
    codigoUnidadNegocio: string;
    descripcionUnidadNegocio: string;
    genero: string;
    motivo: string;
    razon: string;
    tipoConvocatoria: string;
    salarioBasico: string;
    comisiones: string;
    observacionesSalario: string;
    fechaInicioProceso: string | null;
    solicitante: string;
    correoSolicitante: string;
    correoProfesional: string;
    nombreProfesional: string;
    fechaLimite: string | null;
    diasHabiles: number;
    Created?: string
    fechaIngreso: string | null;
    ANS: string;
    cumpleANS: string;
    direccion: string;
    grupoCVE: string;
    empresaContratista: string;
    Estado: string;
    fechaTerna: string | null;
    motivoNoCumplimiento: string;
    nombreEmpleadoVinculado: string
    Identificador: string;
    cedulaEmpleadoVinculado: string;
    nuevoPromocion: string
}

export type ansRequisicion ={
    Id?: string;
    Title: string;
    AplicaVDPNuevo: boolean;
    AplicaVDPPromocion: boolean;
    Cargo: string;
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