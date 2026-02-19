export type Novedad = {
    Id?: string;
    SALARIO: string;
    salariotexto: string;
    ADICIONALES_x0020_: string;
    SALARIO_x0020_AJUSTADO: string;
    TEMPORAL: string;
    auxconectividadvalor: string;
    auxconectividadtexto: string;
    PROMEDIO_x0020_: string;
    DEPENDENCIA_x0020_: string;
    CIUDAD: string;
    CARGO: string;
    tipodoc: string;
    Title: string;
    FechaReporte: string | null;
    Departamento: string;
    NombreSeleccionado: string;
    Pertenecealmodelo: boolean; 
    Informaci_x00f3_n_x0020_enviada_: string; //Informacion enviada por
    Cargo_x0020_de_x0020_la_x0020_pe: string; //Cargo de la persona que reporta
    Empresa_x0020_que_x0020_solicita: string; //Empresa que solicita 
    Tipo_x0020_de_x0020_documento_x0: string; //Abreviacion tipo doc
    Numero_x0020_identificaci_x00f3_: string; //Numero de doc
    CORREO_x0020_ELECTRONICO_x0020_: string;  //Correo electronico
    CELULAR_x0020_: string;                   //Numero de celular
    DIRECCION_x0020_DE_x0020_DOMICIL: string; //Direccion
    BARRIO_x0020_: string;                     //Barrio
    ESPECIFICIDAD_x0020_DEL_x0020_CA: string  //Especificidad del cargo
    NIVEL_x0020_DE_x0020_CARGO: string;       //Nivel de cargo
    CARGO_x0020_CRITICO: string;              //Cargo critico
    CODIGO_x0020_CENTRO_x0020_DE_x00: string; //Codigo CC
    DESCRIPCION_x0020_DE_x0020_CENTR: string; //Descripcion CC
    CENTRO_x0020_OPERATIVO_x0020_: string;    //Codigo CO
    DESCRIPCION_x0020_CENTRO_x0020_O: string; //Descripcion CO
    UNIDAD_x0020_DE_x0020_NEGOCIO_x0: string; //Descripcion UN
    ID_x0020_UNIDAD_x0020_DE_x0020_N: string; //Codigo UN
    PERSONAS_x0020_A_x0020_CARGO: string;     //Personas a cargo
    ORIGEN_x0020_DE_x0020_LA_x0020_S: string; //Origen de la seleccion
    TIPO_x0020_DE_x0020_CONTRATO: string;     //Tipo de contrato
    TIPO_x0020_DE_x0020_VACANTE_x002: string; //Tipo de vacante
    MODALIDAD_x0020_TELETRABAJO: string;      //Modalidad de trabajo
    STATUS_x0020_DE_x0020_INGRESO_x0: string; //Status de ingreso
    FECHA_x0020_REQUERIDA_x0020_PARA: string | null; //Fecha requerida para la finalizacion
    FECHA_x0020_HASTA_x0020_PARA_x00: string | null; //Fecha hasta para el personal fijo
    FECHA_x0020_DE_x0020_AJUSTE_x002: string | null; //Fecha de ajuste academico
    FECHA_x0020_DE_x0020_ENTREGA_x00: string | null; //Fecha de entrega de la valoracion de potencial
    GARANTIZADO_x0020__x0020__x00bf_: string; //Garantizado si o no
    VALOR_x0020_GARANTIZADO: string;          //Valor garantizado
    Garantizado_x0020_en_x0020_letra: string; //Garantizado en letras
    PRESUPUESTO_x0020_VENTAS_x002f_M: string; //Presupuesto ventas/magnitud
    AUTONOM_x00cd_A_x0020_: string;           //Autonomia
    IMPACTO_x0020_CLIENTE_x0020_EXTE: string; //Impaco cliente externo
    CONTRIBUCION_x0020_A_x0020_LA_x0: string; //Contribucion a la estrategia
    GRUPO_x0020_CVE_x0020_: string;           //Gropo CVE
    HERRAMIENTAS_x0020_QUE_x0020_POS: string; //Herramientas que posee el colaborador
    SE_x0020_DEBE_x0020_HACER_x0020_: string; //Se debe hacer cargue de nuevo equipo de trabajo
    FECHA_x0020_REQUERIDA_x0020_PARA0:string | null; //Fecha requerida para el ingreso
    Auxilio_x0020_de_x0020_rodamient: string; //Auxilio de rodamiento
    Auxilio_x0020_de_x0020_rodamient0: string;//Auxilio de rodamiento en letras
    Ajustesalario: boolean;
    Auxilioderodamientosiono: boolean
    Universidad: string;
    NitUniversidad: string;
    FechaNac: string | null;
    Coordinadordepracticas: string;
    Especialidad: string;
    FechaInicioLectiva: string | null;
    FechaFinalLectiva: string | null;
    FechaInicioProductiva: string | null;
    FechaFinalProductiva: string | null;
    Etapa: string
    Practicante: boolean;
    Aprendiz: boolean
    Programa: string;
    Estado: string;
    LugarExpedicion: string;
    RazonCancelacion: string;
}

export type NovedadCancelada = {
    Id?: string;
    Title: string //Fecha en la que se inicio el proceso inicialmente
    Informacionenviadapor: string
    Procesocanceladopor: string
    Empresaquesolicito: string
    TipoDocumento: string
    Tipodocumentoabreviacion: string
    Numeroidentificacion: string;
    Correo: string;
    Celular: string;
    Direcciondomicilio: string;
    Barrio: string;
    Ciudad: string;
    Cargoqueibaaocupar: string;
    Especificidaddelcargo: string;
    Nivelcargo: string;
    Origendelaseleccion: string;
    RazonCancelacion: string;
    Nombre: string
    Created?: string
}

export type NovedadErrors = Partial<Record<keyof Novedad, string>>;