export type Promocion = {
    Id?: string;
    Title: string;
    InformacionEnviadaPor: string;
    Cargo: string;
    CargoPersonaReporta: string;
    EmpresaSolicitante: string;
    TipoDoc: string;
    AbreviacionTipoDoc: string;
    NumeroDoc: string;
    Email: string;
    Ciudad: string;
    EspecificidadCargo: string;
    NivelCargo: string;
    CargoCritico: string;
    Dependencia: string;
    CodigoCentroCostos: string;
    DescripcionCentroCostos: string;
    CentroOperativo: string;
    DescripcionCentroOperativo: string;
    UnidadNegocio: string;
    PersonasCargo: string;
    TipoContrato: string;
    TipoVacante: string;
    ModalidadTeletrabajo: string;
    StatusIngreso: string;
    FechaAjusteAcademico: string | null;
    FechaValoracionPotencial: string | null;
    Salario: string;
    SalarioTexto: string;
    SalarioAjustado: string;
    Adicionales: string;
    Garantizado_x00bf_SiNo_x003f_: string; //Garantizado o no
    PresupuestoVentasMagnitudEconomi: string;
    AuxilioValor: string;
    AuxilioTexto: string;
    Autonomia: string;
    ImpactoClienteExterno: string;
    ContribucionaLaEstrategia: string;
    ValorGarantizado: string;
    Promedio: string;
    GrupoCVE: string;
    HerramientasColaborador: string;
    CargueNuevoEquipoTrabajo: string;
    IDUnidadNegocio: string;
    FechaIngreso: string | null;
    GarantizadoLetras: string;
    AuxilioRodamiento: string;
    AuxilioRodamientoLetras: string;
    Departamento: string;
    NombreSeleccionado: string;
    TipoNomina: string;
    EstadoProceso: string;
    ResultadoValoracion: string;
    Correo: string;
    AjusteSioNo: boolean,
    AuxilioRodamientoSioNo: boolean,
    PerteneceModelo: boolean,
    Estado: string
}

export type PromocionErrors = Partial<Record<keyof Promocion, string>>;
