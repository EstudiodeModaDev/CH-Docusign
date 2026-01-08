// hooks/useFirmaUsuario.ts
import * as React from "react";
import type { FirmasService } from "../../Services/Firmas.service";
import type { ImagenWrite } from "../../models/Imagenes";

export function useFirmaUsuario(service: FirmasService, username: string | undefined) {
  const [item, setItem] = React.useState<ImagenWrite  | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!username) {
      setItem(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await service.getFirmaByEmail(username);
      setItem(res ?? null);     // si no hay firma -> null
      return res
    } catch (e) {
      console.error(e);
      setError("Error cargando firma del usuario");
      setItem(null);
      return null
    } finally {
      setLoading(false);
    }
  }, [service, username]);

  const getFirmaInline = React.useCallback(async () => {
    const firmaInline = await service.getFirmaAsBase64(username!);
    return firmaInline
  }, [service, username]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return {
    firmaItem: item,
    loading,
    error,
    refresh: load, getFirmaInline
  };
}
