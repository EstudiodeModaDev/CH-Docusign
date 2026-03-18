import type { Cesacion, CesacionErrors } from "../../../../models/Cesaciones";


export function validateCesacion(state: Cesacion): CesacionErrors {
  const e: CesacionErrors = {};

  if (!state.Cargo) e.Cargo = "Seleccione un cargo";
  if (!state.Empresaalaquepertenece) e.Empresaalaquepertenece = "Seleccione una empresa";
  if (!state.TipoDoc) e.TipoDoc = "Seleccione un tipo de documento";
  if (!state.FechaIngreso) e.FechaIngreso = "Seleccione una fecha de ingreso";
  if (!state.FechaLimiteDocumentos) e.FechaLimiteDocumentos = "Seleccione una fecha limite documentos";
  if (!state.Niveldecargo) e.Niveldecargo = "Seleccione un nivel de cargo";
  if (!state.Dependencia) e.Dependencia = "Seleccione una dependencia";
  if (!state.Departamento) e.Departamento = "Seleccione un departamento";
  if (!state.Ciudad) e.Ciudad = "Seleccione una ciudad";
  if (!state.CodigoCC) e.CodigoCC = "Seleccione un CC";
  if (!state.CodigoCO) e.CodigoCO = "Seleccione un CO";
  if (!state.CodigoUN) e.CodigoUN = "Seleccione una UN";
  if (!state.CargoCritico) e.CargoCritico = "¿Es cargo critico?";
  if (!!state.Pertenecealmodelo && !state.Autonomia) e.Autonomia = "Escoja un valor para la autonomia";
  if (!!state.Pertenecealmodelo && !state.PresupuestaVentas) e.PresupuestaVentas = "Escoja un valor para el presupesto ventas/magnitud económica";
  if (!!state.Pertenecealmodelo && !state.ImpactoCliente) e.ImpactoCliente = "Escoja un valor para el impacto cliente externo";
  if (!!state.Pertenecealmodelo && !state.contribucionEstrategia) e.contribucionEstrategia = "Escoja un valor para la contribución a la estrategia";
  if (!state.Title) e.Title = "Ingrese el numero de documento";
  if (!state.Correoelectronico) e.Correoelectronico = "Ingrese el correo electronico";
  if (!state.Salario) e.Salario = "Ingrese el salario";
  if (!state.Temporal) e.Temporal = "Ingrese la temporal";

  return e;
}