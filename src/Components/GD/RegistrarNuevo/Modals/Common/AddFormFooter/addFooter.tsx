import * as React from "react";
import "../../AddContrato.css"
import { components, type OptionProps } from "react-select";
import type { desplegablesOption } from "../../../../../../models/Desplegables";

/* ================== Option custom para react-select ================== */
export const Option = (props: OptionProps<desplegablesOption, false>) => {
  const { label } = props;

  return (
    <components.Option {...props}>
      <div className="rs-opt">
        <div className="rs-opt__text">
          <span className="rs-opt__title">{label}</span>
        </div>
      </div>
    </components.Option>
  );
};

type Props = {
  processState?: string
  sending: boolean;
  canEditRegister: boolean;
  canInactivateRegister: boolean;
  isView: boolean;
  handleCreate: (e: React.FormEvent) => Promise<void>;
  showFlow: (show: boolean) => void;
  inactivateRegister: () => void;
  onClose: () => void;
  tipo: string
};

/* ================== Formulario ================== */
export default function FooterForm({tipo, onClose, processState, sending, canEditRegister, canInactivateRegister, isView, handleCreate, showFlow, inactivateRegister }: Props) {

  return (
    <>
      <button disabled={processState === "Cancelado" || sending || !canEditRegister} type="button" className="btn btn-primary btn-xs" onClick={(e) => handleCreate(e)}>
        {
        !canEditRegister ? "No tiene permisos para editar en este modulo" :
        isView ? "Enviar solicitud de edición" :
        processState === "Cancelado" ? "Este proceso fue cancelado, no puede ser usado" :
        sending ? "Procesando..." :
        "Guardar"
        }
      </button> 

      { isView || tipo === "edit" ?
        <button type="submit" className="btn btn-xs" onClick={() => showFlow(true)}>Detalles</button> : null
      }

      { canInactivateRegister && (isView || tipo === "edit" ) ?
        <button type="submit" className="btn btn-xs btn-danger" disabled={!canInactivateRegister} onClick={() => {
                                                                  inactivateRegister()}}>
                                                                
          {
            !canInactivateRegister ? "No tiene permiso para cancelar este registro" :
            processState !== "Cancelado" ? "Cancelar proceso" : 
            "Reactivar proceso"
          }
        </button> : null
      }
      <button type="button" className="btn btn-xs" onClick={onClose}>Cancelar</button>
    </>
  );
}
