import type { requisiciones, RequisicionesErrors } from "../../../../models/Requisiciones/requisiciones";

export function validate(state: requisiciones): RequisicionesErrors{
  const e: RequisicionesErrors = {};

  if(!state.tipoRequisicion) e.tipoRequisicion = "Seleccione un tipo de requisición"
  if(!state.Title) e.Title = "Seleccione una Cargo"
  if(!state.Ciudad) e.Ciudad = "Seleccione una Ciudad"
  if(!state.tipoConvocatoria) e.tipoConvocatoria = "Seleccione un tipo de convocatoria"
  
  if(!state.codigoCentroCosto) e.codigoCentroCosto = "Seleccione un Centro de Costos"
  if(!state.codigoUnidadNegocio) e.codigoUnidadNegocio = "Seleccione una Unidad de Negocio"
  if(!state.genero) e.genero = "Seleccione un genero"
  if(!state.motivo) e.motivo = "Seleccione un motivo"
  if(!state.tipoConvocatoria) e.tipoConvocatoria = "Seleccione un Tipo de convocatoria"
  if(!state.salarioBasico) e.salarioBasico = "Ingrese el salario basico"
  if (state.tipoRequisicion === "Retail") {
    if(!state.descripcionCentroCosto) e.descripcionCentroCosto = "Seleccione una marca"
    if(!state.tienda) e.tienda = "Seleccione una tienda"
  }
  if (state.tipoRequisicion === "Administrativa") {
    if(!state.direccion) e.direccion = "Seleccione una gerencia"
    if(!state.modalidadTeletrabajo) e.modalidadTeletrabajo = "Seleccione el tipo de teletrabajo"
    if(state.perteneceCVE === "Si" && !state.grupoCVE) {
      e.grupoCVE = "Seleccione el grupo CVE"
    }
    if(!state.descripcionCentroCosto) e.descripcionCentroCosto = "Seleccione un Área"
  }

  return e
}  
  
