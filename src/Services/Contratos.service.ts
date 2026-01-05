import { GraphRest } from '../graph/graphRest';
import type { GetAllOpts, PageResult } from '../models/Commons';
import type { Novedad } from '../models/Novedades';
import { esc } from '../utils/text';


export class ContratosService {
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
    listName = 'Novedades - Novedades Administrativas'
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
  
  private toModel(item: any): Novedad {
    const f = item?.fields ?? {};
    return {
        Id: String(item?.id ?? ''),
        ADICIONALES_x0020_: f.ADICIONALES_x0020_,
        AUTONOM_x00cd_A_x0020_: f.AUTONOM_x00cd_A_x0020_,
        auxconectividadtexto: f.auxconectividadtexto,
        auxconectividadvalor: f.auxconectividadvalor,
        Auxilio_x0020_de_x0020_rodamient: f.Auxilio_x0020_de_x0020_rodamient,
        Auxilio_x0020_de_x0020_rodamient0: f.Auxilio_x0020_de_x0020_rodamient0,
        Title: f.Title,
        BARRIO_x0020_: f.BARRIO_x0020_,
        CARGO: f.CARGO,
        CARGO_x0020_CRITICO: f.CARGO_x0020_CRITICO,
        Cargo_x0020_de_x0020_la_x0020_pe: f.Cargo_x0020_de_x0020_la_x0020_pe,
        CELULAR_x0020_: f.CELULAR_x0020_,
        CENTRO_x0020_OPERATIVO_x0020_: f.CENTRO_x0020_OPERATIVO_x0020_,
        CIUDAD: f.CIUDAD,
        CODIGO_x0020_CENTRO_x0020_DE_x00: f.CODIGO_x0020_CENTRO_x0020_DE_x00,
        CONTRIBUCION_x0020_A_x0020_LA_x0: f.CONTRIBUCION_x0020_A_x0020_LA_x0,
        CORREO_x0020_ELECTRONICO_x0020_: f.CORREO_x0020_ELECTRONICO_x0020_,
        Departamento: f.Departamento,
        DEPENDENCIA_x0020_: f.DEPENDENCIA_x0020_,
        DESCRIPCION_x0020_CENTRO_x0020_O: f.DESCRIPCION_x0020_CENTRO_x0020_O,
        DESCRIPCION_x0020_DE_x0020_CENTR: f.DESCRIPCION_x0020_DE_x0020_CENTR,
        DIRECCION_x0020_DE_x0020_DOMICIL: f.DIRECCION_x0020_DE_x0020_DOMICIL,
        Empresa_x0020_que_x0020_solicita: f.Empresa_x0020_que_x0020_solicita,
        ESPECIFICIDAD_x0020_DEL_x0020_CA: f.ESPECIFICIDAD_x0020_DEL_x0020_CA,
        FECHA_x0020_DE_x0020_AJUSTE_x002: f.FECHA_x0020_DE_x0020_AJUSTE_x002,
        FECHA_x0020_DE_x0020_ENTREGA_x00: f.FECHA_x0020_DE_x0020_ENTREGA_x00,
        FECHA_x0020_HASTA_x0020_PARA_x00: f.FECHA_x0020_HASTA_x0020_PARA_x00,
        FECHA_x0020_REQUERIDA_x0020_PARA: f.FECHA_x0020_REQUERIDA_x0020_PARA,
        FECHA_x0020_REQUERIDA_x0020_PARA0: f.FECHA_x0020_REQUERIDA_x0020_PARA0,
        GARANTIZADO_x0020__x0020__x00bf_: f.GARANTIZADO_x0020__x0020__x00bf_,
        Garantizado_x0020_en_x0020_letra: f.Garantizado_x0020_en_x0020_letra,
        GRUPO_x0020_CVE_x0020_: f.GRUPO_x0020_CVE_x0020_,
        HERRAMIENTAS_x0020_QUE_x0020_POS: f.HERRAMIENTAS_x0020_QUE_x0020_POS,
        ID_x0020_UNIDAD_x0020_DE_x0020_N: f.ID_x0020_UNIDAD_x0020_DE_x0020_N,
        IMPACTO_x0020_CLIENTE_x0020_EXTE: f.IMPACTO_x0020_CLIENTE_x0020_EXTE,
        Informaci_x00f3_n_x0020_enviada_: f.Informaci_x00f3_n_x0020_enviada_,
        MODALIDAD_x0020_TELETRABAJO: f.MODALIDAD_x0020_TELETRABAJO,
        NIVEL_x0020_DE_x0020_CARGO: f.NIVEL_x0020_DE_x0020_CARGO,
        NombreSeleccionado: f.NombreSeleccionado,
        Numero_x0020_identificaci_x00f3_: f.Numero_x0020_identificaci_x00f3_,
        ORIGEN_x0020_DE_x0020_LA_x0020_S: f.ORIGEN_x0020_DE_x0020_LA_x0020_S,
        PERSONAS_x0020_A_x0020_CARGO: f.PERSONAS_x0020_A_x0020_CARGO,
        Pertenecealmodelo: f.Pertenecealmodelo,
        PRESUPUESTO_x0020_VENTAS_x002f_M: f.PRESUPUESTO_x0020_VENTAS_x002f_M,
        PROMEDIO_x0020_: f.PROMEDIO_x0020_,
        SALARIO: f.SALARIO,
        SALARIO_x0020_AJUSTADO: f.SALARIO_x0020_AJUSTADO,
        salariotexto: f.salariotexto,
        SE_x0020_DEBE_x0020_HACER_x0020_: f.SE_x0020_DEBE_x0020_HACER_x0020_,
        STATUS_x0020_DE_x0020_INGRESO_x0: f.STATUS_x0020_DE_x0020_INGRESO_x0,
        TEMPORAL: f.TEMPORAL,
        TIPO_x0020_DE_x0020_CONTRATO: f.TIPO_x0020_DE_x0020_CONTRATO,
        Tipo_x0020_de_x0020_documento_x0: f.Tipo_x0020_de_x0020_documento_x0,
        TIPO_x0020_DE_x0020_VACANTE_x002: f.TIPO_x0020_DE_x0020_VACANTE_x002,
        tipodoc: f.tipodoc,
        UNIDAD_x0020_DE_x0020_NEGOCIO_x0: f.UNIDAD_x0020_DE_x0020_NEGOCIO_x0,
        VALOR_x0020_GARANTIZADO: f.VALOR_x0020_GARANTIZADO,
        Auxilioderodamientosiono: f.Auxilioderodamientosiono,
        Ajustesalario: f.Ajustesalario,
        FechaReporte: f.FechaReporte,
        Coordinadordepracticas: f.Coordinadordepracticas,
        Especialidad: f.Especialidad,
        Etapa: f.Etapa,
        FechaFinalLectiva: f.FechaInicioLectiva,
        FechaFinalProductiva: f.FechaFinalProductiva,
        FechaInicioLectiva: f.FechaInicioLectiva,
        FechaInicioProductiva: f.FechaInicioProductiva,
        FechaNac: f.FechaNac,
        NitUniversidad: f.NitUniversidad,
        Practicante: f.Practicante,
        Universidad: f.Universidad,
        Aprendiz: f.Aprendiz
    };
  }

  // ---------- CRUD ----------
  async create(record: Omit<Novedad, 'ID'>) {
    await this.ensureIds();
    const res = await this.graph.post<any>(
    `/sites/${this.siteId}/lists/${this.listId}/items`,
    { fields: record }
    );
    return this.toModel(res);
}

  async update(id: string, changed: Partial<Omit<Novedad, 'ID'>>) {
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

  async getAll(opts?: GetAllOpts): Promise<PageResult<Novedad>> {
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
  async getByNextLink(nextLink: string): Promise<PageResult<Novedad>> {
    return this.fetchPage(nextLink, /*isAbsolute*/ true);
  }

  private async fetchPage(url: string, isAbsolute = false): Promise<PageResult<Novedad>> {
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

}



