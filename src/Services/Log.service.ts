import { GraphRest } from '../graph/graphRest';
import type { log } from '../models/log';
import { esc } from '../utils/text';

export class LogService {
  private graph!: GraphRest;
  private hostname!: string;
  private sitePath!: string;
  private listName!: string;

  private siteId?: string;
  private listId?: string;

  constructor(
    graph: GraphRest,
    hostname = 'estudiodemoda.sharepoint.com',
    sitePath = '/sites/TransformacionDigital/IN/CH',
    listName = 'ActionsLog'     
  ) {
    this.graph = graph;
    this.hostname = hostname;
    this.sitePath = sitePath.startsWith('/') ? sitePath : `/${sitePath}`;
    this.listName = listName;
  }

  // ---------- mapping ----------
  private toModel(item: any): log {
    const f = item?.fields ?? {};
    return {
      accion: f.accion,
      actor: f.actor,
      correo_actor: f.correo_actor,
      Created: f.Created,
      descripcion: f.descripcion,
      detalle: f.detalle,
      id_item_afectado: f.id_item_afectado,
      modulo: f.modulo,
      resultado: f.resultado
    };
  }

  // ---------- CRUD ----------
  // Nunca lanza: un fallo al guardar el log no debe alterar la operación principal.
  async create(record: Partial<log>): Promise<log | null> {
    try {
      await this.ensureIds();
      const res = await this.graph.post<any>(
        `/sites/${this.siteId}/lists/${this.listId}/items`,
        { fields: record }
      );
      return this.toModel(res);
    } catch (error) {
      console.error("No fue posible guardar el log de auditoría:", error);
      return null;
    }
  }

  private loadCache() {
      try {
      const k = `sp:${this.hostname}${this.sitePath}:${this.listName}`;
      const raw = localStorage.getItem(k);
      if (raw) {
          const { siteId, listId } = JSON.parse(raw);
          this.siteId = siteId || this.siteId;
          this.listId = listId || this.listId;
      }
      } catch {}
  }
  
  private saveCache() {
      try {
      const k = `sp:${this.hostname}${this.sitePath}:${this.listName}`;
      localStorage.setItem(k, JSON.stringify({ siteId: this.siteId, listId: this.listId }));
      } catch {}
  }
  
  private async ensureIds() {
      if (!this.siteId || !this.listId) this.loadCache();

      if (!this.siteId) {
      const site = await this.graph.get<any>(`/sites/${this.hostname}:${this.sitePath}`);
      this.siteId = site?.id;
      if (!this.siteId) throw new Error('No se pudo resolver siteId');
      this.saveCache();
      }

      if (!this.listId) {
      const lists = await this.graph.get<any>(
          `/sites/${this.siteId}/lists?$filter=displayName eq '${esc(this.listName)}'`
      );
      const list = lists?.value?.[0];
      if (!list?.id) throw new Error(`Lista no encontrada: ${this.listName}`);
      this.listId = list.id;
      this.saveCache();
      }
  }
  

}

