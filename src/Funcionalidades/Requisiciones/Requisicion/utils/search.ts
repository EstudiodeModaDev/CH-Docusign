import type { requisiciones } from "../../../../models/requisiciones";
import { norm } from "../../../../utils/text";

export function includesSearch(row: requisiciones, q: string) {
  const qq = norm(q);
  if (!qq) return true;

  return (
    norm(row.Id).includes(qq)
  );
}