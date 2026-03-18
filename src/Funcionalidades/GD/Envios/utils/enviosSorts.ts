import type { SortDir, SortField } from "../../../../models/Commons";

export type EnvioSort = {
  field: SortField;
  dir: SortDir;
};

export const envioSortFieldToOData: Record<SortField, string> = {
  id: "fields/Created",
  Cedula: "fields/Cedula",
  Nombre: "fields/Receptor",
  Correo: "fields/CorreoReceptor",
  enviadoPor: "fields/EnviadoPor",
  docSend: "fields/Title",
  fecha: "fields/Created",
};

export function buildEnviosOrderBy(sorts: EnvioSort[]): string {
  const orderParts = sorts
    .map((s) => {
      const col = envioSortFieldToOData[s.field];
      return col ? `${col} ${s.dir}` : "";
    })
    .filter(Boolean);

  if (!sorts.some((s) => s.field === "id")) {
    orderParts.push("ID desc");
  }

  return orderParts.join(",");
}
