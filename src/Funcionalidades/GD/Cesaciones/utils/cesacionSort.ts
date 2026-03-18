import type { Cesacion } from "../../../../models/Cesaciones";
import type { SortDir, SortField } from "../../../../models/Commons";
import { toTime } from "../../../../utils/Date";
import { norm } from "../../../../utils/text";

export function compareCesaciones(a: Cesacion, b: Cesacion, field: SortField, dir: SortDir) {
  const mul = dir === "asc" ? 1 : -1;

  const get = (r: Cesacion) => {
    switch (field) {
      case "Cedula":
        return norm(r.Title);
      case "Nombre":
        return norm(r.Nombre);
      case "reporta":
        return norm(r.Reportadopor);
      case "Tienda":
        return norm(r.Tienda);
      case "ingreso":
        return toTime(r.FechaIngreso);
      default:
        return "";
    }
  };

  const av = get(a);
  const bv = get(b);

  if (typeof av === "number" && typeof bv === "number") {
    return (av - bv) * mul;
  }

  return String(av).localeCompare(String(bv), "es", { numeric: true }) * mul;
}