import type { SortDir, SortField } from "../../../../models/Commons";
import type { HabeasData } from "../../../../models/HabeasData";
import { toTime } from "../../../../utils/Date";
import { norm } from "../../../../utils/text";

export function compareHabeas(a: HabeasData, b: HabeasData, field: SortField, dir: SortDir) {
  const mul = dir === "asc" ? 1 : -1;

  const get = (r: HabeasData) => {
    switch (field) {
      case "Cedula":
        return norm(r.NumeroDocumento);
      case "Nombre":
        return norm(r.Title);
      case "Ciudad":
        return norm(r.Ciudad);
      case "reporta":
        return toTime(r.Informacionreportadapor);
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

