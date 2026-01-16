import * as React from "react";
import type { rsOption } from "../../../../models/Commons";
import "./ModalSelect.css"

type Props = {
  open: boolean;
  options: rsOption[];
  onClose: () => void;
  onConfirm: (selectedId: string) => void;
};

export const ElegirColaboradorModal: React.FC<Props> = ({open, options, onClose, onConfirm,}) => {
  const [selectedId, setSelectedId] = React.useState<string>("");

  // Cuando cambian las opciones o se abre el modal, selecciona la primera
  React.useEffect(() => {
    if (!open) return;
    console.log(options)
    if (options.length > 0) {
      setSelectedId(options[0].value);
    } else {
      setSelectedId("");
    }
  }, [open, options]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!selectedId) return;
    onConfirm(selectedId);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2 className="modal-title">Seleccionar colaborador</h2>

        {options.length === 0 ? (
          <p>No hay colaboradores para mostrar.</p>
        ) : (
          <div className="modal-field">
            <label htmlFor="colaborador-select">Colaborador</label>
            <select id="colaborador-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary-final btn-xs">
            Cancelar
          </button>
          <button type="button" className="btn btn-primary-final btn-xs" onClick={handleConfirm} disabled={!selectedId || options.length === 0}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
