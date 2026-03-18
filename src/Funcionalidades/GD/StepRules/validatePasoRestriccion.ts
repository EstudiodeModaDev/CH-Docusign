import type { PasoRestriccion, } from "../../../models/Pasos";


export function validatePasoRestriccionCargoInput(data: {IdPaso: string; Proceso: string; CargoNegocio: string; TipoRegla: string}): {ok: boolean, message: string | null} {
  if (!data.CargoNegocio?.trim()) return {ok: false, message: "El cargo es obligatorio"};
  if (!data.TipoRegla) return {ok: false, message: "El tipo de regla es obligatorio"};

  return {
    ok: true,
    message: null
  }
}

export function validatePasoRestriccionCargoConsistency(existing: PasoRestriccion[], cargoNegocio: string, tipoRegla: string, editingId?: string): {ok: boolean, message: string | null} {
  const cargo = cargoNegocio.trim().toLowerCase();
  const current = existing.filter(x => x.Id !== editingId);

  const duplicated = current.some(
    x => x.CargoNombre.trim().toLowerCase() === cargo && x.TipoRegla === tipoRegla);

  if (duplicated) {
    return {
      ok: false,
      message: "Ya existe una regla igual para este paso."
    }
  }

  const mixed = current.some(x => x.TipoRegla !== tipoRegla);
  if (mixed) {
    return {
      ok: false,
      message: "No se deben mezclar reglas INCLUIR y EXCLUIR en el mismo paso."
    }
  }

  return {
    ok: true,
    message: null
  }
}