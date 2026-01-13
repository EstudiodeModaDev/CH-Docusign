import type { GraphRest } from "../graph/graphRest";
import type { Archivo } from "../models/archivos";

class BibliotecaBaseService {
  protected graph: GraphRest;
  protected hostname: string;
  protected sitePath: string;
  protected libraryName: string;

  protected siteId?: string;
  protected driveId?: string;

  constructor(
    graph: GraphRest,
    hostname: string,
    sitePath: string,
    libraryName: string
  ) {
    this.graph = graph;
    this.hostname = hostname;
    this.sitePath = sitePath.startsWith("/") ? sitePath : `/${sitePath}`;
    this.libraryName = libraryName;
  }

  private loadCache() {
    try {
      const k = `sp-drive:${this.hostname}${this.sitePath}:${this.libraryName}`;
      const raw = localStorage.getItem(k);
      if (raw) {
        const { siteId, driveId } = JSON.parse(raw);
        this.siteId = siteId || this.siteId;
        this.driveId = driveId || this.driveId;
      }
    } catch {}
  }

  private saveCache() {
    try {
      const k = `sp-drive:${this.hostname}${this.sitePath}:${this.libraryName}`;
      localStorage.setItem(
        k,
        JSON.stringify({ siteId: this.siteId, driveId: this.driveId })
      );
    } catch {}
  }

  protected async ensureIds() {
    if (!this.siteId || !this.driveId) this.loadCache();

    // 1) siteId
    if (!this.siteId) {
      const site = await this.graph.get<any>(
        `/sites/${this.hostname}:${this.sitePath}`
      );
      this.siteId = site?.id;
      if (!this.siteId) throw new Error("No se pudo resolver siteId");
      this.saveCache();
    }

    // 2) driveId (biblioteca)
    if (!this.driveId) {
      const drivesRes = await this.graph.get<any>(
        `/sites/${this.siteId}/drives`
      );
      const drive = (drivesRes?.value ?? []).find(
        (d: any) => d.name === this.libraryName
      );
      if (!drive?.id) {
        throw new Error(`Biblioteca no encontrada: ${this.libraryName}`);
      }
      this.driveId = drive.id;
      this.saveCache();
    }
  }

  // Listar archivos de una carpeta (por si lo necesitas)
  async getFilesInFolder(folderPath: string): Promise<Archivo[]> {
    await this.ensureIds();

    const cleanFolder = folderPath.replace(/^\/|\/$/g, "");
    let url: string;

    if (cleanFolder.length > 0) {
      const segments = cleanFolder.split("/").map((s) => encodeURIComponent(s));
      const encodedPath = segments.join("/");

      url = `/drives/${this.driveId}/root:/${encodedPath}:/children`;
    } else {
      url = `/drives/${this.driveId}/root/children`;
    }

    const res = await this.graph.get<any>(url);

    return (res.value ?? []).map((item: any) => ({
      id: item.id,
      name: item.name,
      webUrl: item.webUrl,
      isFolder: !!item.folder,
      size: item.size,
      lastModified: item.lastModifiedDateTime,
      childCount: item.folder?.childCount ?? undefined,
      created: item.createdDateTime, 
    }));
  }
  async findFolderByDocNumber(docNumber: string): Promise<Archivo | null> {
    await this.ensureIds();

    const baseFolder = "Colaboradores Activos"; // O el nombre EXACTO de esa carpeta
    const cleanFolder = baseFolder.replace(/^\/|\/$/g, "");
    const segments = cleanFolder.split("/").map((s) => encodeURIComponent(s));
    const encodedPath = segments.join("/");

    // Traemos los hijos directos de "Colaboradores Activos"
    const res = await this.graph.get<any>(
      `/drives/${this.driveId}/root:/${encodedPath}:/children`
    );

    const items: any[] = res.value ?? [];

    const folder = items.find((item) => {
      const isFolder = !!item.folder;
      const name: string = item.name ?? "";
      return isFolder && name.startsWith(`${docNumber} -`);
    });

    if (!folder) return null;

    return {
      id: folder.id,
      name: folder.name,
      webUrl: folder.webUrl,
      isFolder: !!folder.folder,
      size: folder.size,
      lastModified: folder.lastModified
      
    };
  }

  async getFilesByFolderId(folderId: string): Promise<Archivo[]> {
    await this.ensureIds();

    const res = await this.graph.get<any>(
      `/drives/${this.driveId}/items/${folderId}/children`
    );

    return (res.value ?? []).map((item: any) => ({
      id: item.id,
      name: item.name,
      webUrl: item.webUrl,
      isFolder: !!item.folder,
      size: item.size,
      lastModified: item.lastModifiedDateTime,
      childCount: item.folder?.childCount ?? undefined,
      created: item.createdDateTime, 
    }));
  }


  async uploadFile(
    folderPath: string,
    file: File
  ): Promise<Archivo> {
    await this.ensureIds();

    const cleanFolder = folderPath.replace(/^\/|\/$/g, "");
    const fileName = file.name;
    const serverPath =
      cleanFolder.length > 0
        ? `${cleanFolder}/${fileName}`
        : fileName; // raíz de la biblioteca

    const driveItem = await this.graph.putBinary<any>(
      `/drives/${this.driveId}/root:/${encodeURI(serverPath)}:/content`,
      file,
      file.type || "application/octet-stream"
    );

    return {
      id: driveItem.id,
      name: driveItem.name,
      webUrl: driveItem.webUrl,
      isFolder: !!driveItem.folder,
      size: driveItem.size,
      lastModified: driveItem.lastModifiedDateTime,
    };
  }

  // Renombrar archivo
  async renameArchivo(archivo: Archivo,
    nuevoNombreSinExtension: string
  ): Promise<Archivo> {
    await this.ensureIds();

    // Mantener extensión original si NO es carpeta
    let ext = "";
    if (!archivo.isFolder) {
      const dot = archivo.name.lastIndexOf(".");
      if (dot > 0) {
        ext = archivo.name.slice(dot); // incluye el punto, ej: ".pdf"
      }
    }

    const newName = `${nuevoNombreSinExtension}${ext}`;
    // PATCH al driveItem
    const item = await this.graph.patch<any>(
      `/drives/${this.driveId}/items/${archivo.id}`,
      { name: newName }
    );

    return {
      id: item.id,
      name: item.name,
      webUrl: item.webUrl,
      isFolder: !!item.folder,
      size: item.size,
      lastModified: item.lastModifiedDateTime,
    };
  }

  //Mover carpeta completa
  async moveFolderByPath(sourceFolderPath: string, destParentFolderPath: string, opts?: { newName?: string }): Promise<Archivo> {
    await this.ensureIds();

    const enc = (p: string) =>
      p.replace(/^\/|\/$/g, "")
        .split("/")
        .map(encodeURIComponent)
        .join("/");

    const srcPath = enc(sourceFolderPath);
    const dstPath = enc(destParentFolderPath);

    // 1) Resolver item origen (carpeta a mover)
    const src = await this.graph.get<any>(
      `/drives/${this.driveId}/root:/${srcPath}`
    );
    if (!src?.id || !src?.folder) {
      throw new Error("La ruta origen no es una carpeta válida o no existe.");
    }

    // 2) Resolver item destino (carpeta PADRE)
    const dst = await this.graph.get<any>(
      `/drives/${this.driveId}/root:/${dstPath}`
    );
    if (!dst?.id || !dst?.folder) {
      throw new Error("La ruta destino no es una carpeta válida o no existe.");
    }

    // 3) Mover (Forma A)
    const body: any = { parentReference: { id: dst.id } };
    const newName = opts?.newName?.trim();
    if (newName) body.name = newName;

    const moved = await this.graph.patch<any>(
      `/drives/${this.driveId}/items/${src.id}`,
      body
    );

    return {
      id: moved.id,
      name: moved.name,
      webUrl: moved.webUrl,
      isFolder: !!moved.folder,
      size: moved.size,
      lastModified: moved.lastModifiedDateTime,
    };
  }


}

// Específicos para cada biblioteca (por si luego quieres métodos extra)
export class ColaboradoresEDMService extends BibliotecaBaseService {
  constructor(graph: GraphRest, hostname: string, sitePath: string, name: string) {
    super(graph, hostname, sitePath, name);
  }
}

export class ColaboradoresBrokenService extends BibliotecaBaseService {
  constructor(graph: GraphRest, hostname: string, sitePath: string, name: string) {
    super(graph, hostname, sitePath, name);
  }
}

export class ColaboradoresDHService extends BibliotecaBaseService {
  constructor(graph: GraphRest, hostname: string, sitePath: string, name: string) {
    super(graph, hostname, sitePath, name);
  }
}

export class ColaboradoresDenimService extends BibliotecaBaseService {
  constructor(graph: GraphRest, hostname: string, sitePath: string, name: string) {
    super(graph, hostname, sitePath, name);
  }
}


export class ColaboradoresVisualService extends BibliotecaBaseService {
  constructor(graph: GraphRest, hostname: string, sitePath: string, name: string) {
    super(graph, hostname, sitePath, name);
  }
}


export class ColaboradoresMetaService extends BibliotecaBaseService {
  constructor(graph: GraphRest, hostname: string, sitePath: string, name: string) {
    super(graph, hostname, sitePath, name);
  }
}

