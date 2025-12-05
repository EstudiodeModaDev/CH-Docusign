// models/MiModelo.ts
export interface ImagenWrite {
  fileName: string;
  serverUrl: string;
  serverRelativeUrl: string;
  lastModified?: string; // ISO date
  created?: string;
}

export interface ImagenReadRendition {
  url: string;
  width?: number;
  height?: number;
}

export interface ImagenRead {
  large?: ImagenReadRendition;
  medium?: ImagenReadRendition;
  small?: ImagenReadRendition;
  thumbnail?: ImagenReadRendition;
}

export interface FirmaInline {
  fileName: string;
  contentBytes: string; // base64
}
