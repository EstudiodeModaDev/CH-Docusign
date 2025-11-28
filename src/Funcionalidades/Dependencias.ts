import * as React from "react";
import { useAuth } from "../auth/authProvider";

import type { desplegablesOption } from "../models/Desplegables";
import { fetchGroupMembers } from "./GroupMembers";

const GRUPO_1 = "baaf7c8f-ad73-4891-a234-179222a82c9f";
const GRUPO_2 = "cd18b815-7f35-40c8-8f68-56b11d5749ca";

export function useDependencias() {
  const { getToken } = useAuth();

  const [options, setOptions] = React.useState<desplegablesOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        // 1. Miembros de los grupos (como en PowerApps)
        const [g1, g2] = await Promise.all([fetchGroupMembers(GRUPO_1, getToken), fetchGroupMembers(GRUPO_2, getToken),]);

        const g1Mapped = g1.map((u) => u.displayName).filter(Boolean).map((n) => ({ Nombre: n }));

        const g2Mapped = g2.map((u) => u.displayName).filter(Boolean).map((n) => ({ Nombre: n }));

        const combined = [...g1Mapped, ...g2Mapped];

        const unique = Array.from(new Map(combined.map((d) => [d.Nombre, d])).values());

        // 5. Convertir a opciones para react-select
        const opts: desplegablesOption[] = unique.map((d) => ({
          value: d.Nombre ?? "",
          label: d.Nombre ?? "",
        }));

        if (!cancelled) setOptions(opts);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [getToken]);

  return { options, loading, error };
}
