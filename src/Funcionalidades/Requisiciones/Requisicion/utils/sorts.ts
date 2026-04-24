import type { SortField } from "../../../../models/Commons";

export function mapSortField(field: SortField) {
  switch (field) {
    case "id":
      return "id";
    case "created":
      return "fields/Created";
    case "cargo":
      return "fields/Title";
    case "ciudad":
      return "fields/Ciudad";
    case "estado":
      return "fields/Estado";
    case "analista":
      return "fields/nombreProfesional";
    default:
      return "fields/Created";
  }
}
