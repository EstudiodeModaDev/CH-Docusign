export type CsvTemplateBuild = {
  headers: string[];
  exampleRow: string[];
  meta: {
    roleHeaders: string[];
    fieldHeaders: string[];
  };
};

export type Row = Record<string, string>;

export type ParsedRoleColumns = {
  roleName: string;
  nameCol: string;
  emailCol: string;
};