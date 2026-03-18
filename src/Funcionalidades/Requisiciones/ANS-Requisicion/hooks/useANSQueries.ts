import React from "react";
import { ANS_MESSAGES } from "../utils/ansMessages";
import type { ansRequisicion } from "../../../../models/requisiciones";
import type { AnsRequisicionService } from "../../../../Services/Ans.service";

type UseANSQueriesParams = {
  service: AnsRequisicionService;
  enabled: boolean;
};

export function useANSQueries({ service, enabled }: UseANSQueriesParams) {
  const [rows, setRows] = React.useState<ansRequisicion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadANS = React.useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const items = await service.getAll();
      setRows(items);
    } catch (e: any) {
      setRows([]);
      setError(e?.message ?? ANS_MESSAGES.loadError);
    } finally {
      setLoading(false);
    }
  }, [enabled, service]);

  const lookForANS = React.useCallback(
    //Buscar por un ANS para un cargo en especifico
    async (cargoSeleccionado: string): Promise<ansRequisicion | null> => {
      const items = await service.getAll({filter: `fields/Cargo eq '${cargoSeleccionado}'`,});
      return items[0] ?? null;
    },
    [service]
  );

  React.useEffect(() => {
    loadANS();
  }, [loadANS]);

  return {
    rows,
    setRows,
    loading,
    setLoading,
    error,
    setError,
    loadANS,
    lookForANS,
  };
}