import React from "react";
import { useGestorServices,  } from "../../../../graph/graphContext";
import type { solicitud } from "../../../../models/solicitudCambio";

export function useRequestSearches() {
  const {solicitud} = useGestorServices()

  const [request, setRequest] = React.useState<solicitud[]>([])
  const [loading, setLoading] = React.useState<boolean>(false)

  const getRequests = async (): Promise<solicitud[]> => {
    setLoading(true)
    try {
      const requestResponse = await solicitud.getAll()
      setRequest(requestResponse)
      return request
    } catch {
      return []
    } finally {
      setLoading(false)
    }
  };



  return {
    getRequests,
    request, loading
  };
}