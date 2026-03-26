import type { Novedad, NovedadErrors } from "../../../../models/Novedades";

export function validateContrato(state: Novedad): NovedadErrors {
  const e: NovedadErrors = {};
  if(!state.Empresa_x0020_que_x0020_solicita) e.Empresa_x0020_que_x0020_solicita = "Seleccione una empresa solicitante"
  if(!state.tipodoc) e.tipodoc = "Seleccione un tipo de documento"
  if(!state.Numero_x0020_identificaci_x00f3_) e.Numero_x0020_identificaci_x00f3_ = "Ingrese el numero de identificación"
  if(!state.NombreSeleccionado) e.NombreSeleccionado = "Ingrese el nombre del seleccionado"
  if(!state.CORREO_x0020_ELECTRONICO_x0020_) e.CORREO_x0020_ELECTRONICO_x0020_ = "Ingrese el correo del seleccionado"
  if(!state.FECHA_x0020_REQUERIDA_x0020_PARA0) e.FECHA_x0020_REQUERIDA_x0020_PARA0 = "Ingrese la fecha de inicio"
  if(!state.CARGO) e.CARGO = "Seleccione el cargo que ocupara"
  if(!state.Departamento) e.Departamento = "Seleccione un departamento"
  if(!state.CIUDAD) e.CIUDAD = "Seleccione una ciudad"
  if(!state.MODALIDAD_x0020_TELETRABAJO) e.MODALIDAD_x0020_TELETRABAJO = "Seleccione una modalidad de trabajo"
  if(!state.SALARIO) e.SALARIO = "Ingrese el salario"
  if(!state.CELULAR_x0020_) e.CELULAR_x0020_ = "Ingrese el celular del seleccionado"
  if(!state.DIRECCION_x0020_DE_x0020_DOMICIL) e.DIRECCION_x0020_DE_x0020_DOMICIL = "Ingrese la direccion de domicilio"
  if(!state.BARRIO_x0020_) e.BARRIO_x0020_ = "Ingrese el barrio"
  if(!!state.Ajustesalario && !state.SALARIO_x0020_AJUSTADO) e.SALARIO_x0020_AJUSTADO = "Debe ingresar el porcentaje de ajuste"
  if(!!state.Auxilioderodamientosiono && !state.Auxilio_x0020_de_x0020_rodamient) e.Auxilio_x0020_de_x0020_rodamient = "Ingrese el valor del auxilio de rodamiento"
  if(!state.DEPENDENCIA_x0020_) e.DEPENDENCIA_x0020_ = "Seleccione la dependencia"
  if(!state.CODIGO_x0020_CENTRO_x0020_DE_x00) e.CODIGO_x0020_CENTRO_x0020_DE_x00 = "Seleccione un CC"
  if(!state.CENTRO_x0020_OPERATIVO_x0020_) e.CENTRO_x0020_OPERATIVO_x0020_ = "Seleccione un CO"
  if(!state.UNIDAD_x0020_DE_x0020_NEGOCIO_x0) e.UNIDAD_x0020_DE_x0020_NEGOCIO_x0 = "Seleccione una UN"
  if(!state.ORIGEN_x0020_DE_x0020_LA_x0020_S) e.ORIGEN_x0020_DE_x0020_LA_x0020_S = "Seleccione un origen de la selección"
  if(!state.TIPO_x0020_DE_x0020_CONTRATO) e.TIPO_x0020_DE_x0020_CONTRATO = "Seleccione un tipo de contrato"
  if(!state.TIPO_x0020_DE_x0020_VACANTE_x002) e.TIPO_x0020_DE_x0020_VACANTE_x002 = "Seleccione un tipo de vacante"
  if(!!state.Pertenecealmodelo && !state.AUTONOM_x00cd_A_x0020_) e.AUTONOM_x00cd_A_x0020_ = "Escoja un valor para la autonomia"
  if(!!state.Pertenecealmodelo && !state.PRESUPUESTO_x0020_VENTAS_x002f_M) e.PRESUPUESTO_x0020_VENTAS_x002f_M = "Escoja un valor para el presupesto ventas/magnitud económica"
  if(!!state.Pertenecealmodelo && !state.IMPACTO_x0020_CLIENTE_x0020_EXTE) e.IMPACTO_x0020_CLIENTE_x0020_EXTE = "Escoja un valor para el impacto cliente externo"
  if(!!state.Pertenecealmodelo && !state.CONTRIBUCION_x0020_A_x0020_LA_x0) e.CONTRIBUCION_x0020_A_x0020_LA_x0 = "Escoja un valor para la contribución a la estrategia"
  if(!!state.Aprendiz && !state.Coordinadordepracticas) e.Coordinadordepracticas = "Ingrese el nombre del coordinador de practicas"
  if(!!state.Aprendiz && !state.Especialidad) e.Especialidad = "Ingrese una especialidad"
  if(!!state.Aprendiz && !state.Etapa) e.Etapa = "Seleccione la etapa"
  if(!!state.Aprendiz && !state.FECHA_x0020_REQUERIDA_x0020_PARA) e.FECHA_x0020_REQUERIDA_x0020_PARA = "Seleccione la fecha de finalizacion del contrato"
  if(!!state.Aprendiz && !state.FechaNac) e.FechaNac = "Seleccione la fecha de nacimiento del aprendiz"
  if(!!state.Aprendiz && !state.NitUniversidad) e.NitUniversidad = "Ingrese el NIT de la universidad"
  if(!!state.Universidad && !state.Universidad) e.Universidad = "Ingrese el nombre de la universidad"
  
  console.log(e)

  return e;
}