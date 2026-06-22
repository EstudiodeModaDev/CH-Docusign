import type { HabeasData } from "../../../../models/HabeasData";
import type { Promocion } from "../../../../models/Promociones";
import { areFieldValuesEqual } from "../../UpdateRequestDetails/utils/fieldComparison";

const fields: (keyof HabeasData)[] = [
  "Title", "AbreviacionTipoDoc", "Ciudad", "Correo", "Empresa", "NumeroDocumento", "Tipodoc",
];

export function buildHabeasPatch(original: HabeasData, next: HabeasData) {
  const patch: Record<string, any> = {};

  for (const k of fields) {
    if (!areFieldValuesEqual(String(k), original[k], next[k])) patch[k] = next[k];
  }

  return patch;
}

  const fieldsPromociones: (keyof Promocion)[] = [
    "Title", "Cargo", "CargoPersonaReporta", "EmpresaSolicitante", "TipoDoc", "AbreviacionTipoDoc", "NumeroDoc", "Email", "Ciudad", "EspecificidadCargo", "NivelCargo", 
    "CargoCritico", "Dependencia", "CodigoCentroCostos", "DescripcionCentroCostos", "CentroOperativo", "DescripcionCentroOperativo", "UnidadNegocio", "PersonasCargo", 
    "TipoContrato", "TipoVacante", "ModalidadTeletrabajo", "StatusIngreso", "Salario", "SalarioTexto", "SalarioAjustado", "Adicionales", "Garantizado_x00bf_SiNo_x003f_",
    "PresupuestoVentasMagnitudEconomi", "AuxilioValor", "AuxilioTexto", "Autonomia", "ImpactoClienteExterno", "ContribucionaLaEstrategia", "ValorGarantizado", "Promedio", 
    "GrupoCVE", "HerramientasColaborador", "CargueNuevoEquipoTrabajo", "IDUnidadNegocio", "GarantizadoLetras", "AuxilioRodamiento", "AuxilioRodamientoLetras", "Departamento", 
    "NombreSeleccionado", "TipoNomina", "EstadoProceso", "ResultadoValoracion", "Correo", "AjusteSioNo", "AuxilioRodamientoSioNo", "PerteneceModelo",];

  const dateFields: (keyof Promocion)[] = [
    "FechaAjusteAcademico","FechaValoracionPotencial","FechaIngreso",
  ];

  export const buildPromocionesPatch = (original: Promocion, next: Promocion) => {
    const patch: Record<string, any> = {};

    for (const k of fieldsPromociones) {
      if (!areFieldValuesEqual(String(k), original[k], next[k])) patch[k] = next[k];
    }

    for (const k of dateFields) {
      if (!areFieldValuesEqual(String(k), original[k], next[k], "date")) patch[k] = next[k];
    }

    return patch;
  };

