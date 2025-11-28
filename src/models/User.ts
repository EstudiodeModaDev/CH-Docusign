export type User = {
  displayName?: string;
  mail?: string;
  jobTitle?: string;
} | null;

export type UsuariosSP = {
    Id: string,
    Title: string,
    Correo: string,
    Rol: string,
    IdPerfil: string
}

export type UserOption = {
    value: string;      
    label: string;      
    id?: string;       
    email?: string;     
    jobTitle?: string;  
}

export type UserMe = {
  id: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  mail?: string | null;
  userPrincipalName?: string;
  jobTitle?: string | null;
  department?: string | null;
  officeLocation?: string | null;
  businessPhones?: string[]; 
  mobilePhone?: string | null;
};

export type FormNewUserErrors = Partial<Record<keyof UsuariosSP, string>>;