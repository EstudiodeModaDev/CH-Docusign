import { GraphRest } from '../graph/graphRest';
import type { GetAllOpts } from '../models/Commons';
import type { salario } from '../models/Desplegables';
import { esc } from '../utils/text';

export class SalariosService {
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
    listName = 'Cargos - Salarios Recomendados'     
  ) {
    this.graph = graph;
    this.hostname = hostname;
    this.sitePath = sitePath.startsWith('/') ? sitePath : `/${sitePath}`;
    this.listName = listName;
  }

  // ---------- mapping ----------
  private toModel(item: any): salario {
    const f = item?.fields ?? {};
    return {
        Id: String(item?.id ?? ''),
        Title: f?.Title ?? '',
        Salariorecomendado: f.Salariorecomendado
    };
  }

  // ---------- CRUD ----------
  async create(record: Omit<salario, 'ID'>) {
    await this.ensureIds();
    const res = await this.graph.post<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items`,
      { fields: record }
    );
    return this.toModel(res);
  }

  async update(id: string, changed: Partial<Omit<salario, 'ID'>>) {
    await this.ensureIds();
    await this.graph.patch<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}/fields`,
      changed
    );
    const res = await this.graph.get<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}?$expand=fields`
    );
    return this.toModel(res);
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
  
  async delete(id: string) {
    await this.ensureIds();
    await this.graph.delete(`/sites/${this.siteId}/lists/${this.listId}/items/${id}`);
  }

  async get(id: string) {
    await this.ensureIds();
    const res = await this.graph.get<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}?$expand=fields`
    );
    return this.toModel(res);
  }

  async getAll(opts?: GetAllOpts): Promise<salario[]> {
    await this.ensureIds();

    // ID -> id, Title -> fields/Title (cuando NO está prefijado con '/')
    const normalizeFieldTokens = (s: string) =>
      s
        .replace(/\bID\b/g, 'id')
        .replace(/(^|[^/])\bTitle\b/g, '$1fields/Title');

    const escapeODataLiteral = (v: string) => v.replace(/'/g, "''");

    // Normaliza expresiones del $filter (minimiza 404 por sintaxis)
    const normalizeFilter = (raw: string) => {
      let out = normalizeFieldTokens(raw.trim());
      // escapa todo literal '...'
      out = out.replace(/'(.*?)'/g, (_m, p1) => `'${escapeODataLiteral(p1)}'`);
      return out;
    };

    const normalizeOrderby = (raw: string) => normalizeFieldTokens(raw.trim());

    const qs = new URLSearchParams();
    qs.set('$expand', 'fields');        // necesario si filtras por fields/*
    qs.set('$select', 'id,webUrl');     // opcional; añade fields(...) si quieres
    if (opts?.orderby) qs.set('$orderby', normalizeOrderby(opts.orderby));
    if (opts?.top != null) qs.set('$top', String(opts.top));
    if (opts?.filter) qs.set('$filter', normalizeFilter(String(opts.filter)));

    // Evita '+' por espacios (algunos proxies se quejan)
    const query = qs.toString().replace(/\+/g, '%20');

    const url = `/sites/${encodeURIComponent(this.siteId!)}/lists/${encodeURIComponent(this.listId!)}/items?${query}`;

    try {
      const res = await this.graph.get<any>(url);
      return (res.value ?? []).map((x: any) => this.toModel(x));
    } catch (e: any) {
      // Si la ruta es válida pero el $filter rompe, reintenta sin $filter para diagnóstico
      const code = e?.error?.code ?? e?.code;
      if (code === 'itemNotFound' && opts?.filter) {
        const qs2 = new URLSearchParams(qs);
        qs2.delete('$filter');
        const url2 = `/sites/${encodeURIComponent(this.siteId!)}/lists/${encodeURIComponent(this.listId!)}/items?${qs2.toString()}`;
        const res2 = await this.graph.get<any>(url2);
        return (res2.value ?? []).map((x: any) => this.toModel(x));
      }
      throw e;
    }
  }

  async uploadAttachment(itemId: number, file: File) {
    await this.ensureIds();

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // convertir a base64
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return this.graph.post(
      `/sites/${this.siteId}/lists/${this.listId}/items/${itemId}/attachments`,
      {
        name: file.name,
        contentBytes: base64,
      }
    );
  }

  async getAttachments(itemId: number) {
    await this.ensureIds();
    return this.graph.get<{
      value: { id: string; name: string; contentUrl: string }[];
    }>(`/sites/${this.siteId}/lists/${this.listId}/items/${itemId}/attachments`);
  }
}



