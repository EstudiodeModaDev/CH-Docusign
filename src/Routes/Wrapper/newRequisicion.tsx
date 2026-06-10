import WizardRequisicion3Pasos from "../../Components/Requisiciones/NuevaRequisicion/NuevaRequisicion";
import { useNavigate } from "react-router-dom";
import { useRequisicionesContext } from "../../Funcionalidades/Requisiciones/RequisicionesContext";


export default function NewRequisicionWrapper() {
    const navigate = useNavigate();
    const { cleanState, reloadAll, setField,  state, handleSubmit, notifyAsignacion, sendNotificationPlantaIdeal } = useRequisicionesContext();


    return (
        <>
            <WizardRequisicion3Pasos
                onClose={() => { reloadAll(); cleanState(); navigate("/requisicion/view"); } }
                state={state}
                handleSubmit={handleSubmit}
                notifyAsignacion={notifyAsignacion}
                setField={setField} 
                sendNotificationPlantaIdeal={sendNotificationPlantaIdeal}           />
        </>
    );
}
