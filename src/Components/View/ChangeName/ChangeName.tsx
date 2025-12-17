import * as React from "react";
import "./ChangeName.css";
import { useGraphServices } from "../../../graph/graphContext";
import type { Archivo } from "../../../models/archivos";

type Props = {
  open: boolean;
  selectedFile: Archivo
  onClose: () => void;
  biblioteca: string
  recargar: () => void
};

export const RenameModal: React.FC<Props> = ({open, selectedFile, onClose, biblioteca, recargar}) => {
  const [value, setValue] = React.useState("");
  const {ColaboradoresDH, ColaboradoresEDM} = useGraphServices()
  

    const rename = React.useCallback(async (newName: string) => {
        if(!selectedFile) return
        try {
            if(biblioteca === "estudio"){
                ColaboradoresEDM.renameArchivo(selectedFile, newName)
            } else {
                ColaboradoresDH.renameArchivo(selectedFile, newName)
            }
          await recargar()
        } catch (e: any) {
        console.error(e?.message ?? "Error actualizando elemento de la carpeta.");
        } 
    }, [selectedFile, biblioteca]);

  // cuando cambie el archivo, inicializamos el valor vacío
  React.useEffect(() => {
    if (open) setValue("");
  }, [open, selectedFile]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    rename(value)
  };

  return (
    <div className="rm-backdrop">
      <div className="rm-modal" role="dialog" aria-modal="true">
        <form onSubmit={handleSubmit}>
          <p className="rm-current">
            <strong>Nombre actual:</strong> {selectedFile.name}
          </p>

          <label className="rm-label" htmlFor="nuevoNombre">
            Nuevo nombre:
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
