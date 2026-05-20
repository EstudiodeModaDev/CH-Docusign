import type { RequisicionesService } from "../../../../Services/Requisiciones.service";
import type { DeptosYMunicipiosService } from "../../../../Services/DeptosYMunicipios.service";
import type { ResponsablesNivelService } from "../../../../Services/Requisiciones/ResponsablesNivel.service";
import type { ResponsablesZonasService } from "../../../../Services/Requisiciones/ResponsablesZonas.service";

type Responsible = { name: string; email: string };

function toResponsible(row?: { Title?: string; correoResponsable?: string }): Responsible {
  return {
    name: row?.Title || "Sin responsable asignado",
    email: row?.correoResponsable || "",
  };
}

function normalizeEmail(email?: string): string {
  return String(email ?? "").trim().toLowerCase();
}

async function countActiveRequisicionesByEmail(
  requisicionesSvc: RequisicionesService,
  email: string
): Promise<number> {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return Number.POSITIVE_INFINITY;

  const result = await requisicionesSvc.getAll({
    filter: `fields/correoProfesional eq '${cleanEmail}' and fields/Estado eq 'Activo'`,
    top: 200,
  });

  return result.items.length;
}

async function getActiveAssignedResponsibles(
  requisicionesSvc: RequisicionesService
): Promise<Array<Responsible & { activeCount: number }>> {
  const result = await requisicionesSvc.getAll({
    filter: `fields/Estado eq 'Activo'`,
    top: 200,
  });

  const counters = new Map<string, { responsible: Responsible; activeCount: number }>();

  for (const item of result.items) {
    const email = normalizeEmail(item.correoProfesional);
    if (!email) continue;

    const current = counters.get(email);
    if (current) {
      current.activeCount += 1;
      continue;
    }

    counters.set(email, {
      responsible: {
        email,
        name: item.nombreProfesional || item.correoProfesional || "Sin responsable asignado",
      },
      activeCount: 1,
    });
  }

  return Array.from(counters.values()).map(({ responsible, activeCount }) => ({
    ...responsible,
    activeCount,
  }));
}

async function chooseLeastLoadedResponsible(
  requisicionesSvc: RequisicionesService,
  preferred?: Responsible
): Promise<Responsible | null> {
  const preferredEmail = normalizeEmail(preferred?.email);
  if (!preferredEmail) return preferred ?? null;

  const preferredActiveCount = await countActiveRequisicionesByEmail(requisicionesSvc, preferredEmail);
  if (preferredActiveCount < 10) return preferred ?? null;

  const activeResponsibles = await getActiveAssignedResponsibles(requisicionesSvc);
  const candidates = activeResponsibles
    .filter((candidate) => candidate.activeCount > 0)
    .sort((left, right) => {
      if (left.activeCount !== right.activeCount) return left.activeCount - right.activeCount;
      return left.name.localeCompare(right.name, "es");
    });

  return candidates[0]
    ? { name: candidates[0].name, email: candidates[0].email }
    : preferred ?? null;
}

export async function chooseByZona(
  ciudadSvc: DeptosYMunicipiosService,
  responsableSvc: ResponsablesZonasService,
  ciudad: string
): Promise<Responsible> {
  const infoCiudad = (await ciudadSvc.getAll({ filter: `fields/Municipio eq '${ciudad}'` }))[0];

  if (!infoCiudad) throw new Error(`No se encontro la ciudad ${ciudad} en las zonas configuradas`);

  const responsablesZona = (await responsableSvc.getAll({ filter: `fields/zonaId eq '${infoCiudad.Zona || ""}'`, top: 200 })).items;
  return toResponsible(responsablesZona[0]);
}

export async function chooseByNivelCargo(
  responsableSvc: ResponsablesNivelService,
  nivelCargo: string
): Promise<Responsible> {
  const responsablesNivel = (await responsableSvc.getAll({ filter: `fields/NivelCargo eq '${nivelCargo}'`, top: 200 })).items;
  return toResponsible(responsablesNivel[0]);
}

export async function chooseFinalResponsible(
  ciudadSvc: DeptosYMunicipiosService,
  responsableSvc: ResponsablesZonasService,
  responsableNivelSvc: ResponsablesNivelService,
  requisicionesSvc: RequisicionesService,
  ciudad: string,
  tipoRequisicion: "Administrativa" | "Retail",
  nivelCargo?: string
): Promise<Responsible | null> {
  if (tipoRequisicion === "Retail") {
    const preferredResponsible = await chooseByZona(ciudadSvc, responsableSvc, ciudad);
    return preferredResponsible
  }

  const preferredResponsible = await chooseByNivelCargo(responsableNivelSvc, nivelCargo || "");
  return await chooseLeastLoadedResponsible(requisicionesSvc, preferredResponsible);
}
