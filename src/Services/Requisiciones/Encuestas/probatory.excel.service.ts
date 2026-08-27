import type { GraphRest } from "../../../graph/graphRest";
import type { periodo_prueba } from "../../../models/Requisiciones/probatory";
import { excelSerialToDate, toBooleanAnswer } from "./commonsFunctions";
import type { ProbatoryInterface } from "./ProbatoryInterface";

const SHARE_LINK ="https://estudiodemoda-my.sharepoint.com/:x:/g/personal/hojadevida_estudiodemoda_com_co/IQCqtck93arnQLcEmDDI_2uVAUf83oK549XwVp90Avxk8no?e=HIxxi7";
const TABLE_NAME = "OfficeForms.Table";
const CACHE_KEY = "excel:periodoPrueba:driveItem";

export class ExcelProbatory implements ProbatoryInterface {
  private graph: GraphRest;
  private driveId?: string;
  private itemId?: string;

  constructor(graph: GraphRest) {
    this.graph = graph;
  }

  //Resolver el ID interno del archivo de excel
  private async resolveDriveItem(): Promise<{ driveId: string; itemId: string }> {
    if (this.driveId && this.itemId) {
      return { driveId: this.driveId, itemId: this.itemId };
    }

    try {
      // Cachear el id interno del archivo.
      const cached = localStorage.getItem(CACHE_KEY);
      const parsed = cached ? JSON.parse(cached) : null;
      if (parsed?.driveId && parsed?.itemId) {
        this.driveId = parsed.driveId;
        this.itemId = parsed.itemId;
        return { driveId: this.driveId!, itemId: this.itemId! };
      }
    } catch {
      // ignore cache corrupta
    }

    //Obteber ek archhivo desde el ID
    const ref = await this.graph.getDriveItemBySharingLink(SHARE_LINK);
    this.driveId = ref.driveId;
    this.itemId = ref.itemId;

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ driveId: this.driveId, itemId: this.itemId }));
    } catch {
      // ignore
    }

    return { driveId: this.driveId, itemId: this.itemId };
  }

  async loadResponses({ startDate, finishDate }: { startDate?: Date; finishDate?: Date }): Promise<periodo_prueba[]> {
    const { driveId, itemId } = await this.resolveDriveItem();
    const rows = await this.graph.getWorkbookTableRows(driveId, itemId, TABLE_NAME);

    console.log(rows)

    const responses = rows.map((row): periodo_prueba => ({
      id: String(row[0] ?? ""),
      candidate_adaptation: String(row[9] ?? ""),
      candidate_performance: String(row[10] ?? ""),
      had_candidate_achive_probatory_goals: String(String(row[20] ?? "")),
      user_name: String(row[4] ?? ""),
      had_candidate_asked: toBooleanAnswer(row[13] ?? ""),
      had_candidate_improve_area: toBooleanAnswer(row[14] ?? ""),
      user_document: "",
      user_email: String(row[3] ?? ""),
      was_explication_about_role: toBooleanAnswer(row[16] ?? ""),
      was_feedback: toBooleanAnswer(row[12] ?? ""),
      hora_inicio: excelSerialToDate(row[1] ?? "")
    }));

    if (!startDate && !finishDate) return responses;

    return responses.filter((r) => {
      if (startDate && r.hora_inicio < startDate) return false;
      if (finishDate && r.hora_inicio > finishDate) return false;
      return true;
    });
  }
}
