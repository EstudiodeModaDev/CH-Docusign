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

    return {
      Id: String(item?.id ?? ""),
      Title: f.Title,
      Tienda: f.Tienda,
      "1": Number(f["1"] ?? 0),
      "2": Number(f["2"] ?? 0),
      "3": Number(f["3"] ?? 0),
      "4": Number(f["4"] ?? 0),
      "5": Number(f["5"] ?? 0),
      "6": Number(f["6"] ?? 0),
      "7": Number(f["7"] ?? 0),
      "8": Number(f["8"] ?? 0),
      "9": Number(f["9"] ?? 0),
      "10": Number(f["10"] ?? 0),
      "11": Number(f["11"] ?? 0),
      "12": Number(f["12"] ?? 0),
    };
  }
}
