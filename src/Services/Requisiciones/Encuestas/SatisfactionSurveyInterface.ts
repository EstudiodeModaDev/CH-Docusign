import type { encuestaSatisfaccion } from "../../../models/Requisiciones/satisfaction-survey";

type loadProps = {
  startDate?: Date
  finishDate?: Date
}

export interface EncuestaSatisfaccionInterface{
  loadResponses({startDate, finishDate}: loadProps): Promise<encuestaSatisfaccion[]>
}