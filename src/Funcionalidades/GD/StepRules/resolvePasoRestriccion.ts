import type { PasoRestriccion } from "../../../models/Pasos";

export function resolvePasoRestriccionCargo(cargoNegocio: string, reglas: PasoRestriccion[]): {ok: boolean, message: string | null} {
  console.log(reglas)
  const activas = reglas.filter(r => r.Activo);

  if (!activas.length){ 
  return {
    message: null,
    ok: true
  };
  
}

  const cargo = cargoNegocio.trim().toLowerCase();
  const inclusiones = activas.filter(r => r.TipoRegla === "INCLUIR");
  const exclusiones = activas.filter(r => r.TipoRegla === "EXCLUIR");



  if (inclusiones.length > 0 && exclusiones.length > 0) {
    return {
      ok: false,
      message: "El paso tiene reglas mixtas INCLUIR y EXCLUIR."
    }
  }

  if (inclusiones.length > 0) {
    const ok = inclusiones.some(r => r.CargoNombre.trim().toLowerCase() === cargo)
    console.log(ok)
    return {
      ok,
      message: null
    }
  }

  if (exclusiones.length > 0) {
    const ok = !exclusiones.some(r => r.CargoNombre.trim().toLowerCase() === cargo)
    console.log(ok)
    return {
      ok, 
      message: null
    }
  }
  console.log("No hay reglas para la regla")
  return {
    ok: true,
    message: null
  };
}