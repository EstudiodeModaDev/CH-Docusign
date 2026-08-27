import type { requisiciones } from "../models/Requisiciones/requisiciones";

export type DetailField = {
  key: keyof requisiciones | "Id";
  label: string;
  kind?: "date" | "number" | "money";
};

export type DetailSection = {
  title: string;
  fields: DetailField[];
};

export function getDetailSections(row: requisiciones): DetailSection[] {
  const tipo = String(row.tipoRequisicion ?? "").trim().toLowerCase();

  if (tipo.includes("retail")) {
    return [
      {
        title: "Resumen",
        fields: [
          { key: "tipoRequisicion", label: "Tipo de requisicion" },
          { key: "Title", label: "Cargo" },
          { key: "NivelCargo", label: "Nivel de cargo" },
          { key: "motivo", label: "Motivo" },
          { key: "tipoConvocatoria", label: "Tipo de convocatoria" },
          { key: "genero", label: "Genero" },
          { key: "Dominical", label: "Dominical" },
        ],
      },
      {
        title: "Responsables y tiempos",
        fields: [
          { key: "solicitante", label: "Solicitante" },
          { key: "nombreProfesional", label: "Profesional asignado" },
          { key: "fechaInicioProceso", label: "Fecha inicio proceso", kind: "date" },
          { key: "fechaLimite", label: "Fecha limite", kind: "date" },
          { key: "fechaIngreso", label: "Fecha ingreso", kind: "date" },
          { key: "diasHabiles", label: "Dias habiles", kind: "number" },
          { key: "ANS", label: "ANS" },
          { key: "cumpleANS", label: "Cumple ANS" },
          { key: "motivoNoCumplimiento", label: "Motivo no cumplimiento" },
        ],
      },
      {
        title: "Ubicacion y estructura",
        fields: [
          { key: "Ciudad", label: "Ciudad" },
          { key: "direccion", label: "Direccion" },
          { key: "codigoUnidadNegocio", label: "Codigo unidad negocio" },
          { key: "descripcionUnidadNegocio", label: "Unidad de negocio" },
          { key: "codigoCentroCosto", label: "Codigo centro costo" },
          { key: "descripcionCentroCosto", label: "Centro costo" },
          { key: "codigoCentroOperativo", label: "Codigo centro operativo" },
          { key: "tienda", label: "Centro Operativo" },
        ],
      },
      {
        title: "Condiciones de vinculacion",
        fields: [
          { key: "salarioBasico", label: "Salario basico", kind: "money" },
          { key: "comisiones", label: "Comisiones" },
          { key: "auxilioRodamiento", label: "Auxilio rodamiento" },
          { key: "empresaContratista", label: "Empresa contratista" },
        ],
      },
    ];
  }

  return [
    {
      title: "Resumen",
      fields: [
        { key: "Estado", label: "Estado" },
        { key: "tipoRequisicion", label: "Tipo de requisicion" },
        { key: "nuevoPromocion", label: "Nuevo o promocion" },
        { key: "Title", label: "Cargo" },
        { key: "NivelCargo", label: "Nivel de cargo" },
        { key: "motivo", label: "Motivo" },
        { key: "tipoConvocatoria", label: "Tipo de convocatoria" },
        { key: "genero", label: "Genero" },
      ],
    },
    {
      title: "Responsables y tiempos",
      fields: [
        { key: "solicitante", label: "Solicitante" },
        { key: "nombreProfesional", label: "Profesional asignado" },
        { key: "fechaInicioProceso", label: "Fecha inicio proceso", kind: "date" },
        { key: "fechaLimite", label: "Fecha limite", kind: "date" },
        { key: "fechaIngreso", label: "Fecha ingreso", kind: "date" },
        { key: "diasHabiles", label: "Dias habiles", kind: "number" },
        { key: "cumpleANS", label: "Cumple ANS" },
        { key: "motivoNoCumplimiento", label: "Motivo no cumplimiento" },
      ],
    },
    {
      title: "Ubicacion y estructura",
      fields: [
        { key: "Ciudad", label: "Ciudad" },
        { key: "direccion", label: "Direccion" },
        { key: "codigoUnidadNegocio", label: "Codigo unidad negocio" },
        { key: "descripcionUnidadNegocio", label: "Unidad de negocio" },
        { key: "codigoCentroCosto", label: "Codigo centro costo" },
        { key: "descripcionCentroCosto", label: "Centro costo" },
        { key: "codigoCentroOperativo", label: "Codigo centro operativo" },
        { key: "tienda", label: "Centro Operativo" },
      ],
    },
    {
      title: "Condiciones de vinculacion",
      fields: [
        { key: "salarioBasico", label: "Salario basico" },
        { key: "comisiones", label: "Comisiones" },
        { key: "auxilioRodamiento", label: "Auxilio rodamiento" },
        { key: "modalidadTeletrabajo", label: "Modalidad teletrabajo" },
        { key: "perteneceCVE", label: "Pertenece CVE" },
        { key: "grupoCVE", label: "Grupo CVE" },
      ],
    },
  ];
}
