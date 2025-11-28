export type Archivo = {
  id: string;
  name: string;
  webUrl: string;
  isFolder: boolean;
  size?: number;
  lastModified?: string;
};