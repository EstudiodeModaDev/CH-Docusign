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
