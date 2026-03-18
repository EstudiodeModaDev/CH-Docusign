import type { Cesacion } from "../../../../models/Cesaciones";
import { norm } from "../../../../utils/text";

export function includesCesacionSearch(row: Cesacion, q: string) {
  const qq = norm(q);
  if (!qq) return true;

  return (
    norm(row.Nombre).includes(qq) ||
    norm(row.Title).includes(qq) ||
    norm(row.Cargo).includes(qq)
  );
}