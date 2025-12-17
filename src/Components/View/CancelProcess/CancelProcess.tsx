import * as React from "react";
import "../ChangeName/ChangeName.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onEliminar: (razon: string) => void
};

export const CancelProcessModal: React.FC<Props> = ({open, onClose, onEliminar}) => {
  const [value, setValue] = React.useState("");
  
  React.useEffect(() => {
    if (open) setValue("");
  }, [open]);

  if (!open) return null;

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    await onEliminar(value)
  };

  return (
    <div className="rm-backdrop">
      <div className="rm-modal" role="dialog" aria-modal="true">
        <form onSubmit={handleSubmit}>
          <label className="rm-label" htmlFor="nuevoNombre">
            Razón por la que se cancela el proceso:
          </label>
          <input id="nuevoNombre" className="rm-input" type="text"  value={value} onChange={(e) => setValue(e.target.value)} autoFocus/>

          <div className="rm-actions">
            <button type="button"  className="rm-btn rm-btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="rm-btn rm-btn--primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
