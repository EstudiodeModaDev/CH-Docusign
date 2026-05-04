import type { DeptosYMunicipiosService } from "../../../../Services/DeptosYMunicipios.service";
import type { ResponsablesZonasService } from "../../../../Services/Requisiciones/ResponsablesZonas.service";

export async function chooseByZona(
  ciudadSvc: DeptosYMunicipiosService, 
  ResponsableSvc: ResponsablesZonasService, 
  ciudad: string 
): Promise<{name: string; email: string}>{

  const infoCiudad = (await ciudadSvc.getAll({filter: `fields/Municipio eq '${ciudad}'`}))[0];

  if(!infoCiudad) throw new Error(`No se encontró la ciudad ${ciudad} en las zonas configuradas`);

  const responsableZona = (await ResponsableSvc.getAll({filter: `fields/zonaId eq '${infoCiudad.Zona || ''}'`})).items[0];

  const infoResponsable: {name: string; email: string} = {
    name: responsableZona?.Title || 'Sin responsable asignado',
    email: responsableZona?.correoResponsable || ''
  }

  return infoResponsable;
}


export async function chooseFinalResponsible(
  ciudadSvc: DeptosYMunicipiosService, 
  ResponsableSvc: ResponsablesZonasService, 
  ciudad: string,
  tipoRequisicion: "Administrativa" | "Retail"
): Promise<{name: string; email: string} | null>{

  if(tipoRequisicion === 'Retail') {
    const responsable = await chooseByZona(ciudadSvc, ResponsableSvc, ciudad);
    console.log(responsable)
    return responsable
  }

  return null
}