import React from "react";
import "./MedicalExam.css";

type MedicalExamDateModalProps = {
  isOpen: boolean;
  title?: string;
  initialDate?: string | null;
  loadingText?: string;
  onClose: () => void;
  Id: string
  onSaveDate: (Id: string, date: string, ) => void;
};

 export default function MedicalExamDateModal({Id, isOpen, title = "Registrar fecha de examen médico", initialDate = "", loadingText = "Guardando...", onClose, onSaveDate,}: MedicalExamDateModalProps) {
  const [date, setDate] = React.useState(initialDate ?? "");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setDate(initialDate ?? "");
      setError(null);
      setLoading(false);
    }
  }, [isOpen, initialDate]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      setError("Debes seleccionar una fecha.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await onSaveDate(Id, date);

      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la fecha. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="med-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="med-modal-title" onClick={handleBackdropClick}>
      <section className="med-modal">
        <header className="med-modal__header">
          <h2 id="med-modal-title" className="med-modal__title">
            {title}
          </h2>

          <button type="button" className="med-modal__close" onClick={onClose} disabled={loading} aria-label="Cerrar modal">
            ×
          </button>
        </header>

        <form className="med-modal__body" onSubmit={handleSubmit}>
          <div className="med-field">
            <label htmlFor="medical-exam-date" className="med-field__label">
              Fecha del examen
            </label>

            <input id="medical-exam-date" type="date" className="med-field__input" value={date} onChange={(e) => setDate(e.target.value)} disabled={loading}/>
          </div>

          {error && <p className="med-modal__error">{error}</p>}

          <footer className="med-modal__footer">
            <button type="button" className="med-btn med-btn--secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>

            <button type="submit" className="med-btn med-btn--primary" disabled={loading}>
              {loading ? loadingText : "Guardar fecha"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}