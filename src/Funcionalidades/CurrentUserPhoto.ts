import * as React from "react";
import { useAuth } from "../auth/authProvider";

export function useCurrentUserPhoto() {
  const { getToken } = useAuth();
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        setLoading(true);
        // Si quieres usar el token del contexto en lugar del de userPhoto:
        const token = await getToken();
        const resp = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) {
          if (!cancel) setPhoto(null);
          return;
        }
    
        const blob = await resp.blob();
        

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });


        if (!cancel) setPhoto(dataUrl);
      } catch {
        if (!cancel) setPhoto(null);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [getToken]);

  return { photo, loading };
}
export function useAnyUserPhoto(mail: string, size: "48x48" | "64x64" | "96x96" | "120x120" | "240x240" | "360x360" = "240x240") {
  const { getToken } = useAuth();
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancel = false;

    (async () => {
      const m = (mail ?? "").trim();
      if (!m) {
        setPhoto(null);
        return;
      }

      try {
        setLoading(true);

        const token = await getToken();
        const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(m)}/photos/${size}/$value`;

        const resp = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) {
          // 404 = no tiene foto
          if (!cancel) setPhoto(null);
          return;
        }

        const blob = await resp.blob();

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        if (!cancel) setPhoto(dataUrl);
      } catch {
        if (!cancel) setPhoto(null);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [mail, size, getToken]);

  return { photo, loading };
}

