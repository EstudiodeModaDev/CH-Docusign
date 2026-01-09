export type maestro = {
  Id?: string,
  Title : string,
  T_x00ed_tulo1: string,
  Abreviacion: string,
  Codigo: string,

}

export type desplegablesOption = {
  value: string;      //Id Ticket
  label: string;      //Nombre del ticket
};

export type maestroErrors = Partial<Record<keyof maestro, string>>;

export type dobleCampo = {
    Id: string;
    Title: string;
    Abreviacion: string
}

export type salario = {
  Id?: string;
  Title : string;
  Salariorecomendado: string;
}

export type salarioErrors = Partial<Record<keyof salario, string>>;

export type configuraciones = {
  Id?: string,
  Title : string,
  Valor: string

}