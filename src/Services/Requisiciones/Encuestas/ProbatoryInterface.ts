import type { periodo_prueba } from "../../../models/Requisiciones/probatory";

type loadProps = {
  startDate?: Date
  finishDate?: Date
}

export interface ProbatoryInterface{
  loadResponses({startDate, finishDate}: loadProps): Promise<periodo_prueba[]>
}