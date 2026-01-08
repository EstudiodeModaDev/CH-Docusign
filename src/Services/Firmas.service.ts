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
    listName = "Documentos compartidos",
    
  ) {
    this.graph = graph;
    this.hostname = hostname;
    this.sitePath = sitePath.startsWith("/") ? sitePath : `/${sitePath}`;
    this.listName = listName;
    this.driveName = "Documentos"; // o el nombre que uses
  }

  // ---------- mapping ----------
  private toModel(item: any): ItemFirma {
    const f = item?.fields ?? {};

    return {
      Id: String(item?.id ?? ""),
      Title: f.Title ?? "",
      Firma: f.Firma ?? undefined,  // <-- nombre interno de la columna
    };
  }

  // ---------- CRUD ----------
  async create(data: { Title: string; Firma?: ImagenWrite }) {
    await this.ensureIds();

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

  async update(
    id: string,
    changed: Partial<{ Title: string; Firma: ImagenWrite }>
  ) {
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
    await this.graph.delete(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}`
    );
  }

  async get(id: string) {
    await this.ensureIds();

    const res = await this.graph.get<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}?$expand=fields`
    );

    return this.toModel(res);
  }

  // ---------- Obtener muchos ----------
  async getAll(opts?: GetAllOpts) {
    await this.ensureIds();

    const normalizeFieldTokens = (s: string) =>
      s
        .replace(/\bID\b/g, "id")
        .replace(/(^|[^/])\bTitle\b/g, "$1fields/Title");

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

    const url = `/sites/${encodeURIComponent(
      this.siteId!
    )}/lists/${encodeURIComponent(this.listId!)}/items?${query}`;

    try {
      const res = await this.graph.get<any>(url);
      return (res.value ?? []).map((x: any) => this.toModel(x));
    } catch (e: any) {
      const code = e?.error?.code ?? e?.code;

      if (code === "itemNotFound" && opts?.filter) {
        qs.delete("$filter");
        const url2 = `/sites/${encodeURIComponent(
          this.siteId!
        )}/lists/${encodeURIComponent(this.listId!)}/items?${qs.toString()}`;

        const res2 = await this.graph.get<any>(url2);
        return (res2.value ?? []).map((x: any) => this.toModel(x));
      }

      throw e;
    }
  }

  // ---------- Resolver siteId / listId ----------
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
      localStorage.setItem(
        k,
        JSON.stringify({ siteId: this.siteId, listId: this.listId })
      );
    } catch {}
  }

  private async ensureIds() {
    if (!this.siteId || !this.listId) this.loadCache();

    if (!this.siteId) {
      const site = await this.graph.get<any>(
        `/sites/${this.hostname}:${this.sitePath}`
      );
      this.siteId = site?.id;

      if (!this.siteId) throw new Error("No se pudo resolver siteId");

      this.saveCache();
    }

    if (!this.listId) {
      const lists = await this.graph.get<any>(
        `/sites/${this.siteId}/lists?$filter=displayName eq '${esc(
          this.listName
        )}'`
      );

      const list = lists?.value?.[0];

      if (!list?.id) throw new Error(`Lista no encontrada: ${this.listName}`);

      this.listId = list.id;
      this.saveCache();
    }
  }

  private async ensureDriveId() {
      await this.ensureIds(); // asegura siteId primero
      if (this.driveId) return;

      // puedes usar el drive por defecto:
      // const drive = await this.graph.get<any>(`/sites/${this.siteId}/drive`);

      const drives = await this.graph.get<any>(
      `/sites/${this.siteId}/drives?$filter=name eq '${esc(this.driveName!)}'`
      );
      const drive = (drives.value ?? []).find((d: any) => d.name === this.driveName);

      if (!drive?.id) throw new Error(`Drive no encontrado: ${this.driveName}`);
      this.driveId = drive.id;
  }

  async uploadImage(
    file: File,
    folderPath = "Firmas",
    customFileName?: string
  ): Promise<ImagenWrite> {
    await this.ensureDriveId();

    const name = customFileName || file.name || "firma.png";

    // Solo escapamos el nombre de archivo
    const safeFileName = encodeURIComponent(name);

    // Opcional: escapamos cada segmento de la carpeta, pero mantenemos los '/'
    const folderPart = folderPath
      ? folderPath
          .split("/")
          .filter(Boolean)
          .map((seg) => encodeURIComponent(seg))
          .join("/") + "/"
      : "";

    const urlPath = `/drives/${this.driveId}/root:/${folderPart}${safeFileName}:/content`;

    const res = await this.graph.putBinary<any>(urlPath, file);
    // si tienes .put en GraphRest, mejor:
    // const res = await this.graph.put<any>(urlPath, file);

    const webUrl: string = res.webUrl;
    const url = new URL(webUrl);
    const serverUrl = `${url.protocol}//${url.host}`;
    const serverRelativeUrl = url.pathname;

    return {
      fileName: res.name,
      serverUrl,
      serverRelativeUrl,
    };
  }

  async getFirmaByEmail(email: string, folderPath = "Firmas"): Promise<ImagenWrite | null> {
    await this.ensureDriveId();

    const base = email.toLowerCase().trim();

    const folderPart = folderPath
      ? folderPath
          .split("/")
          .filter(Boolean)
          .map((seg) => encodeURIComponent(seg))
          .join("/")
      : "";

    // Lista archivos dentro de la carpeta (solo necesitamos algunos campos)
    const url = `/drives/${this.driveId}/root:/${folderPart}:/children?$select=name,webUrl,lastModifiedDateTime,file`;

    const res = await this.graph.get<{ value: any[] }>(url);
    const items = res?.value ?? [];

    // extensiones de imagen aceptadas (ajusta si quieres)
    const allowedExt = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff"]);

    // Encuentra candidatos: mismo nombre base, y que sea archivo (no carpeta), y extensión válida
    const candidates = items.filter((it) => {
      if (!it?.file) return false; // descarta carpetas
      const name: string = (it?.name ?? "").toLowerCase();
      const dot = name.lastIndexOf(".");
      if (dot <= 0) return false;

      const nameBase = name.slice(0, dot);
      const ext = name.slice(dot + 1);
      if (nameBase !== base) return false;

      return allowedExt.has(ext);
    });

    if (candidates.length === 0) return null;

    // Prioriza png > jpg/jpeg > resto (opcional)
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

      // si empatan, más reciente primero
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

  async getFirmaAsBase64(
    email: string,
    folderPath = "Firmas"
  ): Promise<{ fileName: string; contentBytes: string } | null> {
    await this.ensureDriveId();

    const baseName = email.toLowerCase().trim();
    const name = `${baseName}.png`; // o la extensión que estés usando

    const safeFileName = encodeURIComponent(name);
    const folderPart = folderPath
      ? folderPath
          .split("/")
          .filter(Boolean)
          .map((seg) => encodeURIComponent(seg))
          .join("/") + "/"
      : "";

    const urlPath = `/drives/${this.driveId}/root:/${folderPart}${safeFileName}:/content`;

    try {
      // 🚨 Aquí asumo que GraphRest tiene un método getBinary (igual que putBinary).
      // Si no lo tienes, puedes usar fetch nativo con el token.
      const blob = await this.graph.getBlob(urlPath); // Blob / ArrayBuffer

      const contentBytes = await blobToBase64(blob);

      return {
        fileName: name,
        contentBytes,
      };
    } catch (e: any) {
      const code = e?.error?.code ?? e?.code;
      if (code === "itemNotFound") {
        return null; // no tiene firma
      }
      throw e;
    }
  }


}
