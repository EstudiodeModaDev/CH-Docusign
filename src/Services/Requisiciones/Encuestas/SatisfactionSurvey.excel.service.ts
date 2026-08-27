import type { GraphRest } from "../../../graph/graphRest";
import type { encuestaSatisfaccion } from "../../../models/Requisiciones/satisfaction-survey";
import { excelSerialToDate, toBooleanAnswer } from "./commonsFunctions";
import type { EncuestaSatisfaccionInterface } from "./SatisfactionSurveyInterface";

const SHARE_LINK ="https://estudiodemoda-my.sharepoint.com/:x:/g/personal/hojadevida_estudiodemoda_com_co/IQAHNg1fxQaOQZHty0pxYqfuAcbEn_bKBuTf-CVQS9vS5RA?e=gMIKRk";
const TABLE_NAME = "OfficeForms.Table";
const CACHE_KEY = "excel:encuestaSatisfaccion:driveItem";

export class ExcelSatisfactionSurvey implements EncuestaSatisfaccionInterface {
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

  async loadResponses({ startDate, finishDate }: { startDate?: Date; finishDate?: Date }): Promise<encuestaSatisfaccion[]> {
    const { driveId, itemId } = await this.resolveDriveItem();
    const rows = await this.graph.getWorkbookTableRows(driveId, itemId, TABLE_NAME);

    console.log(rows)

    const responses = rows.map((row): encuestaSatisfaccion => ({
      id: String(row[0] ?? ""),
      Hora_inicio: excelSerialToDate(Number(row[1])),
      hora_finalizacion: excelSerialToDate(Number(row[2])),
      user_mail: String(row[3] ?? ""),
      user_name: String(row[4] ?? ""),
      did_team_review: toBooleanAnswer(row[5]),
      did_team_submit_on_time: toBooleanAnswer(row[6]),
      had_candidate_personal_presentation: toBooleanAnswer(row[7]),
      was_candidate_correct_adn: toBooleanAnswer(row[8]),
      had_candidate_correct_knowledge: toBooleanAnswer(row[9]),
    }));

    if (!startDate && !finishDate) return responses;

    return responses.filter((r) => {
      if (startDate && r.Hora_inicio < startDate) return false;
      if (finishDate && r.Hora_inicio > finishDate) return false;
      return true;
    });
  }
}
