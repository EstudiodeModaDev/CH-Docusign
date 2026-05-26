import type { GraphRest } from "../../graph/graphRest";
import type { requisiciones } from "../../models/Requisiciones/requisiciones";
import { BaseSharePointListService } from "../base.service";

export class RequisicionesService extends BaseSharePointListService<requisiciones> {
  constructor(graph: GraphRest) {
    super(
      graph,
      "estudiodemoda.sharepoint.com",
      "/sites/TransformacionDigital/IN/CH",
      "Requisiciones - Requisiciones"
    );
  }

  protected toModel(item: any): requisiciones {
    const f = item?.fields ?? {};

    console.log(f)

    return {
      Id: String(item?.id ?? ""),
      Title: f.Title,
      ANS: f.ANS,
      auxilioRodamiento: f.auxilioRodamiento,
      Ciudad: f.Ciudad,
      codigoCentroCosto: f.codigoCentroCosto,
      codigoUnidadNegocio: f.condigoUnidadNegocio,
      comisiones: f.comisiones,
      correoProfesional: f.correoProfesional,
      correoSolicitante: f.correoSolicitante,
      cumpleANS: f.cumpleANS,
      descripcionCentroCosto: f.descripcionCentroCosto,
      descripcionUnidadNegocio: f.descripcionUnidadNegocio,
      diasHabiles: f.diasHabiles,
      direccion: f.direccion,
      empresaContratista: f.empresaContratista,
      Estado: f.Estado,
      fechaIngreso: f.fechaIngreso,
      fechaInicioProceso: f.fechaInicioProceso,
      fechaLimite: f.fechaLimite,
      fechaTerna: f.fechaTerna,
      genero: f.genero,
      grupoCVE: f.grupoCVE,
      Identificador: f.Identificador,
      modalidadTeletrabajo: f.modalidadTeletrabajo,
      motivo: f.motivo,
      motivoNoCumplimiento: f.motivoNoCumplimiento,
      NivelCargo: f.NivelCargo,
      tipoRequisicion: f.tipoRequisicion,
      tipoConvocatoria: f.tipoConvocatoria,
      salarioBasico: f.salarioBasico,
      solicitante: f.solicitante,
      nombreProfesional: f.nombreProfesional,
      perteneceCVE: f.perteneceCVE,
      nuevoPromocion: f.nuevoPromocion,
      porceranje: f.porceranje,
      tienda: f.tienda,
      codigoCentroOperativo: f.codigoCentroOperativo
    };
  }
}
