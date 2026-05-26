import type { Holiday } from "festivos-colombianos";
import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";
import { fetchHolidays } from "../../../../Services/Festivos";
import { calcularFechaSolucionRequisicion, startDateByCutoff } from "../../../../utils/ansRequisicion";
import { toGraphDateTime } from "../../../../utils/Date";
import type { Responsible } from "./requisicionResponsible";

export async function createRequisicionPayload(state: requisiciones, ans: number, responsable: Responsible, categoriaCargo: string): Promise<requisiciones>{
  const holidays: Holiday[] = await fetchHolidays();
  const fechaInicio = startDateByCutoff(new Date(), holidays);
  const fechaFinal = calcularFechaSolucionRequisicion(fechaInicio, ans, holidays);
  
  return{
    ANS: String(ans),
    Ciudad: state.Ciudad,
    codigoCentroCosto: state.codigoCentroCosto,
    codigoCentroOperativo: state.codigoCentroOperativo,
    codigoUnidadNegocio: String(state.codigoUnidadNegocio),
    comisiones: String(state.comisiones),
    correoProfesional: responsable?.email || "",
    correoSolicitante: state.correoSolicitante,
    cumpleANS: state.cumpleANS,
    descripcionCentroCosto: state.descripcionCentroCosto,
    descripcionUnidadNegocio: state.descripcionUnidadNegocio,
    diasHabiles: Number(ans),
    fechaIngreso: toGraphDateTime(state.fechaIngreso) ?? null,
    fechaInicioProceso: toGraphDateTime(fechaInicio) ?? null,
    fechaLimite: toGraphDateTime(fechaFinal) ?? null,
    genero: state.genero,
    motivo: state.motivo,
    nombreProfesional: responsable?.name || "",
    salarioBasico: state.salarioBasico,
    solicitante: state.solicitante,
    tienda: state.tienda,
    tipoConvocatoria: state.tipoConvocatoria,
    tipoRequisicion: state.tipoRequisicion,
    Title: state.Title,
    auxilioRodamiento: state.auxilioRodamiento,
    direccion: state.direccion,
    grupoCVE: state.grupoCVE,
    modalidadTeletrabajo: state.modalidadTeletrabajo,
    perteneceCVE: state.perteneceCVE,
    empresaContratista: state.empresaContratista,
    Estado: state.Estado,
    fechaTerna: state.fechaTerna,
    Identificador: state.Identificador,
    motivoNoCumplimiento: state.motivoNoCumplimiento,
    nuevoPromocion: state.nuevoPromocion,
    NivelCargo: categoriaCargo || state.NivelCargo,
    porceranje: Number(state.porceranje)
  }
}