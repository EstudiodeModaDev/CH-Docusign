import type { SortDir, SortField } from "../../../../models/Commons";
import type { Novedad } from "../../../../models/Novedades";
import { toTime } from "../../../../utils/Date";
import { norm } from "../../../../utils/text";

export function compareContratos(a: Novedad, b: Novedad, field: SortField, dir: SortDir) {
  const mul = dir === "asc" ? 1 : -1;

  const get = (r: Novedad) => {
    switch (field) {
      case "Cedula":
        return norm(r.Numero_x0020_identificaci_x00f3_);
      case "Nombre":
        return norm(r.NombreSeleccionado);
      case "Salario":
        return Number(r.SALARIO ?? 0);
      case "inicio":
        return toTime(r.FECHA_x0020_REQUERIDA_x0020_PARA0);
      case "id":
      default:
        return norm(r.FechaReporte ?? r.Title ?? "");
    }
  };

  const av = get(a);
  const bv = get(b);

  if (typeof av === "number" && typeof bv === "number") {
    return (av - bv) * mul;
  }

  return String(av).localeCompare(String(bv), "es", { numeric: true }) * mul;
}