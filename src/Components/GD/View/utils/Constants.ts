import type { HistorialRevisionCarpetas } from "../../../../models/DocumentViewer";
import { DDMMYYYY } from "../../../../utils/Date";
import type { TableColumn } from "../../Common/TableModal/TableModal";

export const EMPRESAS = [
  { key: "broken", label: "BROKEN" },
  { key: "estudio", label: "ESTUDIO DE MODA" },
  { key: "dh", label: "DH RETAIL" },
  { key: "denim", label: "DENIM HEAD" },
  { key: "meta", label: "METAGRAPHICS" },
  { key: "visual", label: "VISUAL" },
] as const;

export const columns: TableColumn<HistorialRevisionCarpetas>[] = 
[
  {key: "accion", header: "Acción Realizada", accessor: "Accion",},
  {key: "estadoAnterior", header: "Estado Anterior", accessor: "EstadoAnterior",},
  {key: "estadoResultante", header: "Estado Resultante", accessor: "EstadoResultante",},
  {key: "comentario", header: "Comentario", accessor: "Comentario",},
  {key: "realizadoPor", header: "Realizado Por", accessor: "RealizadoPor",},
  {key: "fechaAccion", header: "Fecha de Acción", accessor: "FechaAccion", render: (row) => DDMMYYYY(row.FechaAccion!)},
];