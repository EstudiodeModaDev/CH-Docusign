import React from "react";

import type { detalle,  } from "../../../../models/solicitudCambio";
import { useGestorServices } from "../../../../graph/graphContext";

export function useRequestDetailsSearches() {
  const {detalle} = useGestorServices()

  const [details, setDetails] = React.useState<detalle[]>([])
  const [loading, setLoading] = React.useState<boolean>(false)

  const getDetails = async (IdDetalle: string): Promise<detalle[]> => {
    setLoading(true)
    try {
      const requestResponse = await detalle.getAll({filter:`fields/Title eq '${IdDetalle}'`})
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