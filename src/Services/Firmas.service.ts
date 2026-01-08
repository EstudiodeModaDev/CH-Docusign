import { GraphRest } from "../graph/graphRest";
import type { GetAllOpts } from "../models/Commons";
import type { ImagenWrite } from "../models/Imagenes";
import type { ItemFirma } from "../models/PazSalvo";
import { blobToBase64 } from "../utils/Images";
import { esc } from "../utils/text";

export class FirmasService {
  private graph!: GraphRest;
  private hostname!: string;
  private sitePath!: string;
  private listName!: string;

  private siteId?: string;
  private listId?: string;

  private driveId?: string;
  private driveName?: string;

  constructor(
    graph: GraphRest,
    hostname = "estudiodemoda.sharepoint.com",
    sitePath = "/sites/TransformacionDigital/IN/CH",
    listName = "Documentos compartidos"
  ) {
    this.graph = graph;
    this.hostname = hostname;
    this.sitePath = sitePath.startsWith("/") ? sitePath : `/${sitePath}`;
    this.listName = listName;

    // Biblioteca donde existe Documentos/Firmas
    this.driveName = "Documentos";
  }

  // ---------- mapping ----------
  private toModel(item: any): ItemFirma {
    const f = item?.fields ?? {};
    return {
      Id: String(item?.id ?? ""),
      Title: f.Title ?? "",
      Firma: f.Firma ?? undefined,
    };
  }

  // ---------- cache ----------
  private cacheKeyBase() {
    return `sp:${this.hostname}${this.sitePath}:${this.listName}`;
  }

  private loadCache() {
    try {
      const raw = localStorage.getItem(this.cacheKeyBase());
      if (raw) {
        const { siteId, listId, driveId } = JSON.parse(raw);
        this.siteId = siteId || this.siteId;
        this.listId = listId || this.listId;
        this.driveId = driveId || this.driveId;
      }
    } catch {}
  }

  private saveCache() {
    try {
      localStorage.setItem(
        this.cacheKeyBase(),
        JSON.stringify({ siteId: this.siteId, listId: this.listId, driveId: this.driveId })
      );
    } catch {}
  }

  // ---------- SOLO siteId (para DRIVE) ----------
  private async ensureSiteId() {
    if (!this.siteId || !this.driveId) this.loadCache();

    if (!this.siteId) {
      const site = await this.graph.get<any>(`/sites/${this.hostname}:${this.sitePath}`);
      this.siteId = site?.id;
      if (!this.siteId) throw new Error("No se pudo resolver siteId");
      this.saveCache();
    }
  }

  // ---------- siteId + listId (para CRUD de LISTA) ----------
  private async ensureListIds() {
    // si usas CRUD de lista, esto debe existir sí o sí
    if (!this.siteId || !this.listId) this.loadCache();

    if (!this.siteId) {
      const site = await this.graph.get<any>(`/sites/${this.hostname}:${this.sitePath}`);
      this.siteId = site?.id;
      if (!this.siteId) throw new Error("No se pudo resolver siteId");
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

  // ---------- DRIVE: resolver Documentos ----------
  async ensureDriveId(libraryName = "Documentos") {
    await this.ensureSiteId(); // ✅ NO depende de listas
    if (this.driveId) return;

    const drives = await this.graph.get<{ value: any[] }>(`/sites/${this.siteId}/drives`);
    const all = drives?.value ?? [];
    const wanted = libraryName.toLowerCase();

    const docDrive =
      all.find((d) => (d.name ?? "").toLowerCase() === wanted) ??
      all.find((d) => (d.name ?? "").toLowerCase() === "documents") ??
      all.find((d) => (d.name ?? "").toLowerCase() === "shared documents") ??
      all.find((d) => (String(d.driveType ?? "")).toLowerCase() === "documentlibrary");

    if (!docDrive?.id) {
      throw new Error(
        `No se encontró la biblioteca '${libraryName}'. Drives disponibles: ${all
          .map((d) => d.name)
          .filter(Boolean)
          .join(", ")}`
      );
    }

    this.driveId = docDrive.id;
    this.saveCache();
  }

  // ---------- CRUD (LISTA) ----------
  async create(data: { Title: string; Firma?: ImagenWrite }) {
    await this.ensureListIds();

    const payload: any = {
      Title: data.Title,
      ...(data.Firma && { Firma: data.Firma }),
    };

    const res = await this.graph.post<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items`,
      { fields: payload }
    );

    return this.toModel(res);
  }

  async update(id: string, changed: Partial<{ Title: string; Firma: ImagenWrite }>) {
    await this.ensureListIds();

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
    await this.ensureListIds();
    await this.graph.delete(`/sites/${this.siteId}/lists/${this.listId}/items/${id}`);
  }

  async get(id: string) {
    await this.ensureListIds();
    const res = await this.graph.get<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}?$expand=fields`
    );
    return this.toModel(res);
  }

  async getAll(opts?: GetAllOpts) {
    await this.ensureListIds();

    const normalizeFieldTokens = (s: string) =>
      s.replace(/\bID\b/g, "id").replace(/(^|[^/])\bTitle\b/g, "$1fields/Title");

    const escapeLiteral = (v: string) => v.replace(/'/g, "''");

    const normalizeFilter = (raw: string) => {
      let out = normalizeFieldTokens(raw.trim());
      out = out.replace(/'(.*?)'/g, (_m, p1) => `'${escapeLiteral(p1)}'`);
      return out;
    };

    const qs = new URLSearchParams();
    qs.set("$expand", "fields");
    qs.set("$select", "id,webUrl");

    if (opts?.orderby) qs.set("$orderby", normalizeFieldTokens(opts.orderby));
    if (opts?.top != null) qs.set("$top", String(opts.top));
    if (opts?.filter) qs.set("$filter", normalizeFilter(opts.filter));

    const query = qs.toString().replace(/\+/g, "%20");

    const url = `/sites/${encodeURIComponent(this.siteId!)}/lists/${encodeURIComponent(
      this.listId!
    )}/items?${query}`;

    const res = await this.graph.get<any>(url);
    return (res.value ?? []).map((x: any) => this.toModel(x));
  }

  // ---------- Upload a Documentos/Firmas ----------
  async uploadImage(file: File, folderPath = "Firmas", customFileName?: string): Promise<ImagenWrite> {
    await this.ensureDriveId(this.driveName ?? "Documentos");

    const name = (customFileName || file.name || "firma.png").trim();
    const safeFileName = encodeURIComponent(name);

    const folderPart = folderPath
      ? folderPath
          .split("/")
          .filter(Boolean)
          .map((seg) => encodeURIComponent(seg))
          .join("/") + "/"
      : "";

    const urlPath =
      `/drives/${this.driveId}/root:/${folderPart}${safeFileName}:/content` +
      `?@microsoft.graph.conflictBehavior=replace`;

    const res = await this.graph.putBinary<any>(urlPath, file);

    const webUrl: string = res.webUrl;
    const url = new URL(webUrl);

    return {
      fileName: res.name,
      serverUrl: `${url.protocol}//${url.host}`,
      serverRelativeUrl: url.pathname,
    };
  }

  // ---------- Buscar firma por email ----------
  async getFirmaByEmail(email: string, folderPath = "Firmas"): Promise<ImagenWrite | null> {
    await this.ensureDriveId(this.driveName ?? "Documentos");

    const base = email.toLowerCase().trim();

    const folderPart = folderPath
      ? folderPath
          .split("/")
          .filter(Boolean)
          .map((seg) => encodeURIComponent(seg))
          .join("/")
      : "";

    const url = `/drives/${this.driveId}/root:/${folderPart}:/children?$select=name,webUrl,lastModifiedDateTime,file`;
    const res = await this.graph.get<{ value: any[] }>(url);

    const items = res?.value ?? [];
    const allowedExt = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff"]);

    const candidates = items.filter((it) => {
      if (!it?.file) return false;
      const name: string = (it?.name ?? "").toLowerCase();
      const dot = name.lastIndexOf(".");
      if (dot <= 0) return false;

      const nameBase = name.slice(0, dot);
      const ext = name.slice(dot + 1);
      return nameBase === base && allowedExt.has(ext);
    });

    if (candidates.length === 0) return null;

    const priority = (name: string) => {
      const ext = name.toLowerCase().split(".").pop() ?? "";
      if (ext === "png") return 0;
      if (ext === "jpg" || ext === "jpeg") return 1;
      return 2;
    };

    candidates.sort((a, b) => {
      const pa = priority(a.name);
      const pb = priority(b.name);
      if (pa !== pb) return pa - pb;
      return String(b.lastModifiedDateTime).localeCompare(String(a.lastModifiedDateTime));
    });

    const picked = candidates[0];
    const webUrl: string = picked.webUrl;
    const urlObj = new URL(webUrl);

    return {
      fileName: picked.name,
      serverUrl: `${urlObj.protocol}//${urlObj.host}`,
      serverRelativeUrl: urlObj.pathname,
      lastModified: picked.lastModifiedDateTime,
    };
  }

  // ---------- Descargar firma como base64 (usa el archivo real encontrado) ----------
  async getFirmaAsBase64(
    email: string,
    folderPath = "Firmas"
  ): Promise<{ fileName: string; contentBytes: string } | null> {
    await this.ensureDriveId(this.driveName ?? "Documentos");

    const info = await this.getFirmaByEmail(email, folderPath);
    if (!info) return null;

    const safeFileName = encodeURIComponent(info.fileName);

    const folderPart = folderPath
      ? folderPath
          .split("/")
          .filter(Boolean)
          .map((seg) => encodeURIComponent(seg))
          .join("/") + "/"
      : "";

    const urlPath = `/drives/${this.driveId}/root:/${folderPart}${safeFileName}:/content`;

    const blob = await this.graph.getBlob(urlPath);
    const contentBytes = await blobToBase64(blob);

    return { fileName: info.fileName, contentBytes };
  }
}
