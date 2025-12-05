import * as React from "react";
import "./SingPicker.css";

type Props = {
  /** URL de la imagen actual (Firma.medium.url, por ejemplo) */
  src?: string;
  /** Callback cuando el usuario selecciona una nueva imagen */
  onChangeFile?: (file: File) => void | Promise<void>;
  disabled?: boolean;
};

export const FirmaPicker: React.FC<Props> = ({ src, onChangeFile, disabled }) => {
  const [preview, setPreview] = React.useState<string | undefined>(src);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    // si desde fuera cambian la firma, actualizamos la vista
    setPreview(src);
  }, [src]);

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // previsualización local
    const url = URL.createObjectURL(file);
    setPreview(url);

    if (onChangeFile) {
      await onChangeFile(file);
    }
  };

  return (
    <div className="firma-card">
      <div className="firma-preview">
        {preview ? (
          <img src={preview} alt="Firma" className="firma-img" />
        ) : (
          <span className="firma-placeholder">No hay firma registrada</span>
        )}
      </div>

      <button
        type="button"
        className="firma-btn"
        onClick={handleClick}
        disabled={disabled}
      >
        Cambiar
      </button>

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
