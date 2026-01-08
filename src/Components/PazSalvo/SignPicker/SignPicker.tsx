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
    } else {
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
      return;
    }
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // limpiar url anterior si existía
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }

    const url = URL.createObjectURL(file);
    lastObjectUrlRef.current = url;

    setSelectedFile(file);
    setPreview(url);

    // Importante: permitir seleccionar el mismo archivo de nuevo
    e.target.value = "";
  };

  const handleCancel = () => {

    setSelectedFile(null);

    // volver a src
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }
    setPreview(src);
  };

  const handleAccept = async () => {
    if (disabled || isSaving) {
      return;
    }
    if (!selectedFile) {
      return;
    }
    if (!onChangeFile) {
      return;
    }

    try {
      setIsSaving(true);

      await onChangeFile(selectedFile);

      alert("Se guardo su firma con éxito, por favor recargue la página")
      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
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
        <button type="button" className="firma-btn" onClick={handleClick} disabled={disabled || isSaving}>
          Cambiar
        </button>

        <button type="button" className="firma-btn firma-btn--ok" onClick={handleAccept} disabled={disabled || isSaving || !hasPending} title={!hasPending ? "Selecciona un archivo primero" : "Guardar firma"}>
          {isSaving ? "Guardando..." : "Aceptar"}
        </button>

        <button type="button" className="firma-btn firma-btn--cancel"  onClick={handleCancel} disabled={disabled || isSaving || !hasPending} title={!hasPending ? "No hay cambios" : "Descartar cambios"}>
          Cancelar
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange}/>
    </div>
  );
};
