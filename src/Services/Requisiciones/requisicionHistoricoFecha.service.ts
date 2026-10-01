import type { GraphRest } from "../../graph/graphRest";
import type { historicoFecha } from "../../models/Requisiciones/historicoFechas";
import { BaseSharePointListService } from "../base.service";

export class HistoricoFechasService extends BaseSharePointListService<historicoFecha> {
  constructor(graph: GraphRest) {
    super(
      graph,
      "estudiodemoda.sharepoint.com",
      "/sites/TransformacionDigital/IN/CH",
      "Requisiciones - Historico Fechas"
    );
  }

  protected toModel(item: any): historicoFecha {
    const f = item?.fields ?? {};

    return {
      id: String(item?.id ?? ""),
      Title: f.Title ?? "",
      ANS: f.ANS ?? "",
      fechaComentario: f.fechaComentario ?? "",
      fechaLimite: f.fechaLimite ?? "",
      observacion: f.observacion ?? "",
      Nuevo_Ans: f.Nuevo_Ans ?? "",
      Accion: f.Accion ?? ""
    };
  }
}
