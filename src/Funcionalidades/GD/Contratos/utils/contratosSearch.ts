import type { Novedad } from "../../../../models/Novedades";
import { norm } from "../../../../utils/text";

export function includesSearch(row: Novedad, q: string) {
  const qq = norm(q);
  if (!qq) return true;

  return (
    norm(row.NombreSeleccionado).includes(qq) ||
    norm(row.Numero_x0020_identificaci_x00f3_).includes(qq) ||
    norm(row.CARGO).includes(qq)
  );
}