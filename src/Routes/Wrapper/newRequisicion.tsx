import WizardRequisicion3Pasos from "../../Components/Requisiciones/NuevaRequisicion/NuevaRequisicion";
import { useNavigate } from "react-router-dom";
import { useRequisicionesContext } from "../../Funcionalidades/Requisiciones/RequisicionesContext";


export default function NewRequisicionWrapper() {
    const navigate = useNavigate();
    const { cleanState, reloadAll, setField,  state, handleSubmit, notifyAsignacion, notificarMotivo,} = useRequisicionesContext();


    return (
        <WizardRequisicion3Pasos
            onClose={() => {reloadAll(); cleanState(); navigate("/requisicion"); }}
            state={state}
            handleSubmit={handleSubmit}
            notifyAsignacion={notifyAsignacion}
            notificarMotivo={notificarMotivo}
            setField={setField}
        />
    );
}
