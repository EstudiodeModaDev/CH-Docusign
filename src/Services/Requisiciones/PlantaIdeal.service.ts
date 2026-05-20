import type { GraphRest } from "../../graph/graphRest";
import type { plantaIdeal } from "../../models/Requisiciones/plantaIdeal";
import { BaseSharePointListService } from "../base.service";

export class PlantaIdealService extends BaseSharePointListService<plantaIdeal> {
  constructor(graph: GraphRest) {
    super(
      graph,
      "estudiodemoda.sharepoint.com",
      "/sites/TransformacionDigital/IN/CH",
      "Requisiciones - Planta Ideal"
    );
  }

  protected toModel(item: any): plantaIdeal {
    const f = item?.fields ?? {};

    console.log(f)

    return {
      Id: String(item?.id ?? ""),
      Title: f.Title,
      Tienda: f.Tienda,
      "_x0031_": Number(f._x0031_ ?? 0),
      "_x0032_": Number(f._x0032_ ?? 0),
      "_x0033_": Number(f._x0033_ ?? 0),
      "_x0034_": Number(f._x0034_ ?? 0),
      "_x0035_": Number(f._x0035_ ?? 0),
      "_x0036_": Number(f._x0036_ ?? 0),
      "_x0037_": Number(f._x0037_ ?? 0),
      "_x0038_": Number(f._x0038_ ?? 0),
      "_x0039_": Number(f._x0039_ ?? 0),
      "_x0031_0": Number(f._x0031_0 ?? 0),
      "_x0031_1": Number(f._x0031_1 ?? 0),
      "_x0031_2": Number(f._x0031_2 ?? 0),
    };
  }
}
