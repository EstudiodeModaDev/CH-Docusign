export type campoUnico = {
    Id?: string;
    Title: string
}

export type dobleCampo = {
    Id: string;
    Title: string;
    Abreviacion: string
}

export type desplegablesOption = {
  value: string;      //Id Ticket
  label: string;      //Nombre del ticket
};

export type CampoUnicoErrors = Partial<Record<keyof campoUnico, string>>;