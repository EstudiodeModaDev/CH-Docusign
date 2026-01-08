import type { UserOption } from "./Commons";

export type Ticket = {
  ID?: string;
  Nombreresolutor?: string;
  IdResolutor?: string;
  Solicitante?: string;
  Title?: string; //Asunto
  FechaApertura?: string; // "dd/mm/yyyy hh:mm"
  TiempoSolucion?: string;   // "dd/mm/yyyy hh:mm"
  Estadodesolicitud?: string;
  Observador?: string;
  Descripcion?: string;
  Categoria?: string;
  SubCategoria?: string;
  SubSubCategoria?: string;
  Fuente?: string;
  Correoresolutor?: string;
  CorreoSolicitante?: string;
  IdCasoPadre?: string;
  ANS?: string;
  CorreoObservador?: string;
};

export type FormRecategorizarState = {
  categoria: string;
  subcategoria: string;
  articulo: string;
};

export type FormReasignarState = {
    resolutor: UserOption | null;
    Nota: string
}

export type FormObservadorState = {
    observador: UserOption | null;
}

export type ticketOption = {
  value: string;      //Id Ticket
  label: string;      //Nombre del ticket
};

export type AttachmentLite = {
  id: string;                     // id opaco del adjunto (suele ser el nombre de archivo, pero trátalo como opaco)
  name: string;                   // nombre del archivo
  size: number;                   // bytes
  contentType?: string;
  lastModifiedDateTime?: string;
  downloadPath: string;     
};

// Para filtros locales
export type SortDir = 'asc' | 'desc';
export type SortField = 'id' | 'FechaApertura' | 'TiempoSolucion' | 'Title' | 'resolutor';

export type FormState = {
  solicitante: string;
  correoSolicitante: string;
  usarFechaApertura: boolean;
  fechaApertura: string | null; // YYYY-MM-DD
  fuente: string;
  motivo: string;
  descripcion: string;
  categoria: string;
  subcategoria: string;
  articulo: string;
  archivo: File | null;
  ANS?: "";
};

export type RelacionadorState = {
  TicketRelacionar?: ticketOption | null;
  archivo?: File | null
};

export type UserFormState = {
  solicitante: string;
  Correosolicitante: string;
  motivo: string;
  descripcion: string;
  archivo: File[] | null;
};

export type FormDocumentarState = {
  documentacion: string;
  resolutor: string;
  correoresolutor: string;
};

export type FormErrors = Partial<Record<keyof FormState, string>>;

export type FormUserErrors = Partial<Record<keyof UserFormState, string>>;

export type FormReasignarErrors = Partial<Record<keyof FormReasignarState, string>>

export type FormObservadorErrors = Partial<Record<keyof FormObservadorState, string>>

export type FormDocErrors = Partial<Record<keyof FormDocumentarState, string>>

export type Log = {
    Id?: string;
    Title: string; //Id caso
    Descripcion: string;
    Tipo_de_accion: string;
    Actor: string;
    CorreoActor: string;
    Created?: string;
};