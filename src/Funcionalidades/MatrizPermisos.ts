import * as React from "react";
import { useGraphServices } from "../graph/graphContext";
import { FEATURES, type AppPermissionRow, type FeatureKey, type ModuleKey } from "../models/security";
import { normalizeFeatureKey, type GroupOption } from "../utils/security";

type AppPermissionItemVM = AppPermissionRow & {
  saving: boolean;
};

type ModulePermissions = {
  module: ModuleKey;
  items: AppPermissionItemVM[];
};

export function useGroupPermissionsAdmin(selectedGroup: GroupOption | null) {
  const { MatrizPermisos } = useGraphServices();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savingMap, setSavingMap] = React.useState<Record<string, boolean>>({});
  const [rows, setRows] = React.useState<AppPermissionRow[]>([]);

  const setSaving = React.useCallback((featureKey: string, value: boolean) => {
    setSavingMap((prev) => ({ ...prev, [featureKey]: value }));
  }, []);

  const load = React.useCallback(async () => {
    if (!selectedGroup?.groupId) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await MatrizPermisos.getAll({filter: `fields/GroupId eq '${selectedGroup.groupId}'`, top: 5000,});

      setRows(res)
    } catch (e: any) {
      setError(e?.message ?? "Error cargando permisos del grupo");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [MatrizPermisos, selectedGroup?.groupId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const rowsByFeature = React.useMemo(() => {
    const map = new Map<FeatureKey, AppPermissionRow>();

    for (const r of rows) {
      const k = normalizeFeatureKey(r.FeatureKey);
      if (!k) continue;
      map.set(k, r);
    }

    return map;
  }, [rows]);

  const modules = React.useMemo<ModulePermissions[]>(() => {
    return (Object.keys(FEATURES) as ModuleKey[]).map((module) => {
      const features = FEATURES[module];

      return {
        module,
        items: features.map((featureKey) => {
          const row = rowsByFeature.get(featureKey);

          return {
            Id: row?.Id ?? `${selectedGroup?.groupId}-${featureKey}`,
            FeatureKey: featureKey,
            Enabled: !!row?.Enabled,
            saving: !!savingMap[featureKey],
            Title: row?.Title!,
            GroupId: row?.GroupId!,
            GroupKey: row?.GroupKey,
          };
        }),
      };
    });
  }, [rowsByFeature, savingMap, selectedGroup?.groupId]);

  const togglePermission = React.useCallback(async (featureKey: FeatureKey, nextEnabled: boolean) => {
      if (!selectedGroup?.groupId) return;

      const row = rowsByFeature.get(featureKey);
      if (!row?.Id) {
        setError(`No existe fila de permiso para ${featureKey} en este grupo.`);
        return;
      }

      setSaving(featureKey, true);
      setError(null);

      const previousRows = rows;

      setRows((prev) =>
        prev.map((r) =>
          r.Id === row.Id ? { ...r, Enabled: nextEnabled } : r
        )
      );

      try {
        await MatrizPermisos.update(row.Id, {
          Enabled: nextEnabled,
        });
      } catch (e: any) {
        setRows(previousRows);
        setError(e?.message ?? `No se pudo actualizar ${featureKey}`);
      } finally {
        setSaving(featureKey, false);
      }
    },
    [rows, rowsByFeature, selectedGroup?.groupId, setSaving]
  );

  return {
    loading,
    error,
    modules,
    reload: load,
    togglePermission,
  };
}