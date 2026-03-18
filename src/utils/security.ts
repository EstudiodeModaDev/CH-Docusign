import type { GraphRest } from "../graph/graphRest";
import { FEATURES, type FeatureKey, type ModuleKey } from "../models/security";
import type { MatrizPermisosService } from "../Services/MatrizPermisos.service";

const ALL_FEATURES = new Set<string>(
  Object.values(FEATURES).flat() as readonly string[]
);

export function normalizeFeatureKey(raw: string): FeatureKey | null {
  const k = (raw ?? "").trim()
  if (!k) return null;
  if (!ALL_FEATURES.has(k)) return null;
  return k as FeatureKey;
}

export type PermissionsEngine = {
  set: ReadonlySet<FeatureKey>;
  can: (k: FeatureKey) => boolean;
  canAny: (...keys: FeatureKey[]) => boolean;
  canAll: (...keys: FeatureKey[]) => boolean;
  canModule: (module: ModuleKey) => boolean; // si tiene AL MENOS 1 permiso del módulo
};

export function createEngine(set: ReadonlySet<FeatureKey>): PermissionsEngine {
  const can = (k: FeatureKey) => set.has(k);

  const canAny = (...keys: FeatureKey[]) => {
    console.group("DEBUG canAny");
    console.log("Permisos solicitados:", keys);
    console.log("Permisos del usuario:", Array.from(set));

    for (const k of keys) {
      const hasPermission = set.has(k);
      console.log(`Evaluando ${k}:`, hasPermission);

      if (hasPermission) {
        console.log("canAny = true por:", k);
        console.groupEnd();
        return true;
      }
    }

    console.log("canAny = false");
    console.groupEnd();
    return false;
  };

  const canAll = (...keys: FeatureKey[]) => keys.every(k => set.has(k));

  const canModule = (module: ModuleKey) => {
    const modKeys = FEATURES[module];
    return modKeys.some(k => set.has(k));
  };

  return { set, can, canAny, canAll, canModule };
}

export async function getUserGroupIds(graph: GraphRest): Promise<string[]> {
  const res = await graph.get<{ value: Array<{ id: string }> }>(
    "/me/transitiveMemberOf?$select=id"
  );
  return (res.value ?? []).map(x => x.id).filter(Boolean);
}



export async function getAppPermissionsRows(permisosSvc: MatrizPermisosService) {
  const res = await permisosSvc.getAll({ top: 5000, });
  const rows = res.filter((r) => r.Enabled)
  console.log(rows)
  return rows.map(r => ({
    GroupId: r.GroupId,
    FeatureKey: r.FeatureKey,
    Enabled: r.Enabled,
  }));
}

export type GroupOption = {
  key: string;
  label: string;
  groupId: string;
};

export const SECURITY_GROUPS: GroupOption[] = [
  { key: "seleccion", label: "Selección", groupId: "ab969375-7955-40d7-aca6-a1299bfc6e40" },
  { key: "formacion", label: "Formación", groupId: "9f3fc311-6a7a-4102-a7c9-86f1dbb419c0" },
  { key: "sst", label: "SST", groupId: "1185e1f1-9170-47d8-80e5-ceff05b17500" },
  { key: "compensacion", label: "Compensación", groupId: "8ba50c1e-ffd3-4906-b50a-3db33b69b868" },
  { key: "gerencia", label: "Gerencia", groupId: "3dc57761-477f-4096-99c8-e533b6fd7423" },
  { key: "gestion_documental", label: "Gestión Documental", groupId: "93456ed0-e807-44fa-8001-1bcdb40f3ef4" },
  { key: "requisiciones", label: "Requisiciones", groupId: "3c3b7a03-1347-4ae6-8785-654fc19977e6" },
  { key: "paz_y_salvo", label: "Paz y salvo", groupId: "7ee9297f-1b6c-4930-b7c1-819181eceb5c" },
  { key: "app_ch_paz_y_salvo_usuarios", label: "Paz y salvos - Usuarios", groupId: "884a4c7f-7f86-400d-872a-403f728a8d28" },
  { key: "app_ch_requisiciones_usuarios", label: "Requisiciones - Usuarios", groupId: "c4f1ddc1-f251-41c1-ad9f-0cbb4b845f09" },
];