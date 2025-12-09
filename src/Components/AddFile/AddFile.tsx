import * as React from "react";
import { useColaboradoresExplorer } from "../../Funcionalidades/DocumentViewer";
import "./AddFile.css"

type SimpleFileUploadProps = {
  /** Carpeta destino dentro de la biblioteca (ej: "Carpeta/Del/Colaborador") */
  folderPath: string;
  /** Función que sube el archivo a la biblioteca */
  onClose: () => void;
  /** Opcional: callback cuando termina correctamente */
  onUploaded?: (result: any) => void;
};

export const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({folderPath, onClose, onUploaded,}) => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const {handleUploadClick} = useColaboradoresExplorer();
    const { setSearch} = useColaboradoresExplorer();

  const handleConfirm = async () => {
    if (!file) {
      setError("Debes seleccionar un archivo.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await handleUploadClick(folderPath, file);
      onUploaded?.(result);
      setFile(null);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Error subiendo el archivo");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    setSearch("")
  }, []);

  return (
    <div className="sf-modal-backdrop" role="dialog" aria-modal="true">
      <section className="sf-modal">
        <header className="sf-modal__header">
          <h2 className="sf-modal__title">Subir archivo</h2>
          <button
            type="button"
            className="sf-modal__close"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </header>

        <div className="sf-modal__body">
          <p className="sf-modal__hint">
            Carpeta destino:
            <span className="sf-modal__path">{folderPath}</span>
          </p>

          <div className="sf-upload-box">
            <input
              id="sf-file-input"
              type="file"
              className="sf-upload-box__input"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                setError(null);
              }}
            />
            <label htmlFor="sf-file-input" className="sf-upload-box__label">
              <span className="sf-upload-box__icon" aria-hidden="true">
                ⬆
              </span>
              <span className="sf-upload-box__text">
                {file ? file.name : "Seleccionar archivo"}
              </span>
            </label>
            <p className="sf-upload-box__hint">
              Formatos permitidos: PDF, JPG, JPEG, PNG
            </p>
          </div>

          {error && <p className="sf-modal__error">{error}</p>}
        </div>

        <footer className="sf-modal__footer">
          <button
            type="button"
            className="sf-btn sf-btn--ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="sf-btn sf-btn--primary"
            onClick={handleConfirm}
            disabled={loading || !file}
          >
            {loading ? "Subiendo..." : "Confirmar subida"}
          </button>
        </footer>
      </section>
    </div>
  );
};
