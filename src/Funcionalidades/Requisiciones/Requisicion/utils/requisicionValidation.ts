import type { requisiciones, RequisicionesErrors } from "../../../../models/Requisiciones/requisiciones";
import { notify } from "../../../../utils/notify";

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

export function validatePostergarANS(r: requisiciones, d: string, m: string): boolean{
  if(!m){
    notify.error("Debe escribir el motivo de postergación")
    return false
  }

  if(!d){
    notify.error("Debe escoger la nueva fecha final")
    return false
  }

  if(!r.Id){
    notify.error("No se ha podido encontrar la requisición escogida")
    return false
  }

  if(r.Estado === "Completada"){
    notify.error("No se puede postergar el ANS de una requisición finalizada")
    return false
  }

  return true
}
  
