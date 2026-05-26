import type { AccountInfo } from "@azure/msal-browser";
import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";
import { toISODateFlex } from "../../../../utils/Date";

export function cleanStateRequisicion(account: AccountInfo | null): requisiciones{
  return {
    nuevoPromocion: "",
    Ciudad: "",
    codigoCentroCosto: "",
    codigoCentroOperativo: "",
    codigoUnidadNegocio: "",
    comisiones: "",
    correoProfesional: "",
    correoSolicitante: account?.username ?? "",
    descripcionCentroCosto:  "",
    descripcionUnidadNegocio: "",
    diasHabiles: 0,
    fechaInicioProceso: toISODateFlex(new Date()),
    fechaLimite: null,
    genero: "",
    motivo: "",
    nombreProfesional: "",
    salarioBasico: "",
    solicitante: account?.name ?? "",
    tipoConvocatoria: "",
    tipoRequisicion: "",
    Title: "",
    ANS: "",
    fechaIngreso: null,
    cumpleANS: "Pendiente",
    auxilioRodamiento: "",
    direccion: "",
    grupoCVE: "",
    modalidadTeletrabajo: "",
    perteneceCVE: "",
    empresaContratista: "",
    Estado: "Activo",
    fechaTerna: null,
    Identificador: "",
    tienda: "",
    motivoNoCumplimiento: "",
    porceranje: 0,
    NivelCargo: ""
  }
} 
 
