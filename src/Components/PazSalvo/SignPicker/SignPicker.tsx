import * as React from "react";
import "./SingPicker.css";

type Props = {
  /** URL de la imagen actual (Firma.medium.url, por ejemplo) */
  src?: string;
  /** Callback cuando el usuario confirma (Aceptar) */
  onChangeFile?: (file: File) => void | Promise<void>;
  disabled?: boolean;
};

export const FirmaPicker: React.FC<Props> = ({ src, onChangeFile, disabled }) => {
  const [preview, setPreview] = React.useState<string | undefined>(src);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Para evitar leaks cuando usamos URL.createObjectURL
  const lastObjectUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    // si desde fuera cambian la firma, actualizamos la vista
    // pero OJO: solo si NO hay un archivo seleccionado pendiente
    if (!selectedFile) {
      setPreview(src);
      alert(`[DEBUG] src cambió -> preview actualizado: ${src ?? "undefined"}`);
    } else {
      alert("[DEBUG] src cambió pero hay archivo pendiente, no piso preview");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  React.useEffect(() => {
    return () => {
      // cleanup al desmontar
      if (lastObjectUrlRef.current) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
        lastObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleClick = () => {
    if (disabled || isSaving) {
      alert("[DEBUG] Click bloqueado (disabled o isSaving)");
      return;
    }
    alert("[DEBUG] Abriendo selector de archivos");
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      alert("[DEBUG] No se seleccionó archivo");
      return;
    }

    alert(
      `[DEBUG] Archivo seleccionado: name=${file.name} type=${file.type || "?"} size=${file.size}`
    );

    // limpiar url anterior si existía
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }

    const url = URL.createObjectURL(file);
    lastObjectUrlRef.current = url;

    setSelectedFile(file);
    setPreview(url);

    alert("[DEBUG] Preview listo. Esperando confirmación (Aceptar).");

    // Importante: permitir seleccionar el mismo archivo de nuevo
    e.target.value = "";
  };

  const handleCancel = () => {
    alert("[DEBUG] Cancelar cambios: descartando archivo pendiente");

    setSelectedFile(null);

    // volver a src
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }
    setPreview(src);

    alert(`[DEBUG] Preview revertido a src: ${src ?? "undefined"}`);
  };

  const handleAccept = async () => {
    if (disabled || isSaving) {
      alert("[DEBUG] Aceptar bloqueado (disabled o isSaving)");
      return;
    }
    if (!selectedFile) {
      alert("[DEBUG] No hay archivo seleccionado para aceptar");
      return;
    }
    if (!onChangeFile) {
      alert("[DEBUG] No hay onChangeFile definido");
      return;
    }

    try {
      setIsSaving(true);
      alert(
        `[DEBUG] Subiendo... name=${selectedFile.name} size=${selectedFile.size} type=${selectedFile.type || "?"}`
      );

      await onChangeFile(selectedFile);

      alert("[DEBUG] Subida OK (onChangeFile resolvió)");

      // como ya se “guardó”, limpiamos el pending
      setSelectedFile(null);
    } catch (err: any) {
      alert(`[DEBUG] Error en subida: ${err?.message ?? String(err)}`);
      console.error(err);
    } finally {
      setIsSaving(false);
      alert("[DEBUG] Fin handleAccept()");
    }
  };

  const hasPending = !!selectedFile;

  return (
    <div className="firma-card">
      <div className="firma-preview">
        {preview ? (
          <img src={preview} alt="Firma" className="firma-img" />
        ) : (
          <span className="firma-placeholder">No hay firma registrada</span>
        )}
      </div>

      <div className="firma-actions" style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="firma-btn"
          onClick={handleClick}
          disabled={disabled || isSaving}
        >
          Cambiar
        </button>

        <button
          type="button"
          className="firma-btn firma-btn--ok"
          onClick={handleAccept}
          disabled={disabled || isSaving || !hasPending}
          title={!hasPending ? "Selecciona un archivo primero" : "Guardar firma"}
        >
          {isSaving ? "Guardando..." : "Aceptar"}
        </button>

        <button
          type="button"
          className="firma-btn firma-btn--cancel"
          onClick={handleCancel}
          disabled={disabled || isSaving || !hasPending}
          title={!hasPending ? "No hay cambios" : "Descartar cambios"}
        >
          Cancelar
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
};
