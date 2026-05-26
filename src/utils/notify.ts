import { toast } from "sonner";

function normalizeMessage(message: unknown): string {
  if (message instanceof Error) return message.message;
  if (typeof message === "string") return message;
  if (message == null) return "";
  return String(message);
}

function classifyMessage(message: string): "success" | "error" | "warning" | "info" {
  const normalized = message.trim().toLowerCase();

  if (!normalized) return "info";

  if (
    normalized.includes("error") ||
    normalized.includes("fallo") ||
    normalized.includes("falló") ||
    normalized.includes("no se") ||
    normalized.includes("no hay") ||
    normalized.includes("no fue posible") ||
    normalized.includes("no tienes permisos")
  ) {
    return "error";
  }

  if (
    normalized.includes("debe ") ||
    normalized.includes("debes ") ||
    normalized.includes("falt") ||
    normalized.includes("hay campos") ||
    normalized.includes("selecciona") ||
    normalized.includes("rellene")
  ) {
    return "warning";
  }

  if (
    normalized.includes("exito") ||
    normalized.includes("éxito") ||
    normalized.includes("correctamente") ||
    normalized.includes("finalizado") ||
    normalized.includes("completado") ||
    normalized.includes("actualizado") ||
    normalized.includes("creado") ||
    normalized.includes("guardado") ||
    normalized.includes("eliminado") ||
    normalized.includes("enviado") ||
    normalized.includes("aprobada") ||
    normalized.includes("aprobado") ||
    normalized.includes("renovada")
  ) {
    return "success";
  }

  return "info";
}

export const notify = {
  success(message: unknown) {
    return toast.success(normalizeMessage(message));
  },
  error(message: unknown) {
    return toast.error(normalizeMessage(message));
  },
  warning(message: unknown) {
    return toast.warning(normalizeMessage(message));
  },
  info(message: unknown) {
    return toast.info(normalizeMessage(message));
  },
  auto(message: unknown) {
    const normalized = normalizeMessage(message);
    const type = classifyMessage(normalized);

    switch (type) {
      case "success":
        return toast.success(normalized);
      case "error":
        return toast.error(normalized);
      case "warning":
        return toast.warning(normalized);
      default:
        return toast.info(normalized);
    }
  },
};

export function installLegacyAlertBridge() {
  if (typeof window === "undefined") return;

  window.alert = (message?: unknown) => {
    notify.auto(message);
  };
}
