import type { HabeasData } from "../../../../models/HabeasData";
import { norm } from "../../../../utils/text";

export function includesHabeasSearch(row: HabeasData, q: string) {
  const qq = norm(q);
  if (!qq) return true;

  return (
    norm(row.Title).includes(qq) ||
    norm(row.NumeroDocumento).includes(qq) 
  );
}