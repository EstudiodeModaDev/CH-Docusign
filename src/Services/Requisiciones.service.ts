import { GraphRest } from '../graph/graphRest';
import type { GetAllOpts, PageResult } from '../models/Commons';
import type { Novedad } from '../models/Novedades';
import type { requisiciones } from '../models/requisiciones';
import { esc } from '../utils/text';


export class RequisicionesService {
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
    listName = 'Requisiciones - Requisiciones'
  ) {
    this.graph = graph;
    this.hostname = hostname;
    this.sitePath = sitePath.startsWith('/') ? sitePath : `/${sitePath}`;
    this.listName = listName;
  }

  // cache (mem + localStorage opcional)
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

  // ---------- mapping ----------
  
  private toModel(item: any): requisiciones {
    const f = item?.fields ?? {};
    return {
      Id: String(item?.id ?? ''),
      ANS: f.ANS,
      grupoCVE: f.grupoCVE,
      Area: f.Area,
      Ciudad: f.Ciudad,
      codigoCentroCosto: f.codigoCentroCosto,
      codigoCentroOperativo: f.codigoCentroOperativo,
      codigoUnidadNegocio: f.codigoUnidadNegocio,
      comisiones: f.comisiones,
      correoProfesional: f.correoProfesional,
      correoSolicitante: f.correoSolicitante,
      cumpleANS: f.cumpleANS,
      descripcionCentroCosto: f.descripcionCentroCosto,
      descripcionCentroOperativo: f.descripcionCentroOperativo,
      descripcionUnidadNegocio: f.descripcionUnidadNegocioNS,
      diasHabiles: f.diasHabiles,
      fechaIngreso: f.fechaIngreso,
      fechaInicioProceso: f.fechaInicioProceso,
      fechaLimite: f.fechaLimite,
      genero: f.genero,
      motivo: f.motivo,
      nombreProfesional: f.nombreProfesional,
      observacionesSalario: f.observacionesSalario,
      razon: f.razon,
      salarioBasico: f.salarioBasico,
      solicitante: f.solicitante,
      tipoConvocatoria: f.tipoConvocatoria,
      tipoRequisicion: f.tipoRequisicion,
      Title: f.Title,
      Created: f.Created,
      direccion: f.direccion,
      empresaContratista: f.empresaContratista,
      Estado: f.Estado,
      fechaTerna: f.fechaTerna,
      Identificador: f.Identificador,
      motivoNoCumplimiento: f.motivoNoCumplimiento,
      nombreEmpleadoVinculado: f.nombreEmpleadoVinculado,
      nuevoPromocion: f.nuevoPromocion,
      cedulaEmpleadoVinculado: f.cedulaEmpleadoVinculado
    };
  }

  // ---------- CRUD ----------
  async create(record: Omit<requisiciones, 'ID'>) {
    await this.ensureIds();
    const res = await this.graph.post<any>(
    `/sites/${this.siteId}/lists/${this.listId}/items`,
    { fields: record }
    );
    return this.toModel(res);
}

  async update(id: string, changed: Partial<Omit<requisiciones, 'ID'>>) {
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

  async getAll(opts?: GetAllOpts): Promise<PageResult<requisiciones>> {
    await this.ensureIds();
    const qs = new URLSearchParams({ $expand: 'fields' });
    if (opts?.filter)  qs.set('$filter', opts.filter);
    if (opts?.orderby) qs.set('$orderby', opts.orderby);
    if (opts?.top != null) qs.set('$top', String(opts.top));
    const url = `/sites/${this.siteId}/lists/${this.listId}/items?${qs.toString()}`;
    const res = await this.fetchPage(url);
    return res
  }

  // Seguir el @odata.nextLink tal cual lo entrega Graph
  async getByNextLink(nextLink: string): Promise<PageResult<requisiciones>> {
    return this.fetchPage(nextLink, /*isAbsolute*/ true);
  }

  private async fetchPage(url: string, isAbsolute = false): Promise<PageResult<requisiciones>> {
    const res = isAbsolute
      ? await this.graph.getAbsolute<any>(url)  // 👈 URL absoluta (nextLink)
      : await this.graph.get<any>(url);         // 👈 path relativo

    const raw = Array.isArray(res?.value) ? res.value : [];
    const items = raw.map((x: any) => this.toModel(x));
    const nextLink = res?.['@odata.nextLink'] ? String(res['@odata.nextLink']) : null;
    return { items, nextLink };
  }

  async getAllPlane(opts?: GetAllOpts) {
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
      const mapped = (res.value ?? []).map((x: any) => this.toModel(x));
      return mapped

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

  async search(term: string, opts?: { top?: number; orderby?: string }): Promise<PageResult<Novedad>> {
    await this.ensureIds();

    // $search NO es por columna, es búsqueda full-text en lo indexado.
    // Importante: se envía con comillas. Ej: "perez"
    const safe = (term ?? "").trim();
    const quoted = `"${safe.replace(/"/g, '\\"')}"`;

    const qs = new URLSearchParams();
    qs.set('$expand', 'fields');
    qs.set('$search', quoted);
    if (opts?.orderby) qs.set('$orderby', opts.orderby);
    if (opts?.top != null) qs.set('$top', String(opts.top));

    const url = `/sites/${this.siteId}/lists/${this.listId}/items?${qs.toString().replace(/\+/g, '%20')}`;

    // 👇 Header clave para que Graph acepte $search en muchos casos
    const res = await this.graph.get<any>(url, {
      headers: { ConsistencyLevel: 'eventual' },
    });

    const raw = Array.isArray(res?.value) ? res.value : [];
    const items = raw.map((x: any) => this.toModel(x));
    const nextLink = res?.['@odata.nextLink'] ? String(res['@odata.nextLink']) : null;

    return { items, nextLink };
  }

}



