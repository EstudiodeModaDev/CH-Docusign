import React from "react";
import { useGraphServices } from "../../../../graph/graphContext";
import type { detalle,  } from "../../../../models/solicitudCambio";

export function useRequestDetailsSearches() {
  const graph = useGraphServices()

  const [details, setDetails] = React.useState<detalle[]>([])
  const [loading, setLoading] = React.useState<boolean>(false)

  const getDetails = async (IdDetalle: string): Promise<detalle[]> => {
    setLoading(true)
    try {
      const requestResponse = await graph.detalle.getAll({filter:`fields/Title eq '${IdDetalle}'`})
      setDetails(requestResponse)
      return details
    } catch {
      return []
    } finally {
      setLoading(false)
    }
  };



  return {
    getDetails,
    details, loading
  };
}