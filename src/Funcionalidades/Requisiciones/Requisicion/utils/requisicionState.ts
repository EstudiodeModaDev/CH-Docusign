import type { AccountInfo } from "@azure/msal-browser";
import type { requisiciones } from "../../../../models/requisiciones";
import { toISODateFlex } from "../../../../utils/Date";

export function cleanStateRequisicion(account: AccountInfo | null): requisiciones{
  return {
     nuevoPromocion: "",
    Area: "",
    Ciudad: "",
    cantidadPersonas: 1,
    codigoCentroCosto: "",
    codigoCentroOperativo: "",
    codigoUnidadNegocio: "",
    comisiones: "",
    correoProfesional: "",
    correoSolicitante: account?.username ?? "",
    descripcionCentroCosto:  "",
    descripcionCentroOperativo: "",
    descripcionUnidadNegocio: "",
    diasHabiles: 0,
    fechaInicioProceso: toISODateFlex(new Date()),
    fechaLimite: null,
    genero: "",
    marca: "",
    motivo: "",
    nombreProfesional: "",
    observacionesSalario: "",
    razon: "",
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
    nombreEmpleadoVinculado: "",
    cedulaEmpleadoVinculado: ""
  }
} 
 