import * as React from "react";
import { useCoreGraphServices, useGestorServices } from "../../graph/graphContext";
import { useCesacionSteps } from "../../Funcionalidades/GD/Steps/CesacionSteps/useCesacionSteps";
import { useCargo } from "../../Funcionalidades/Desplegables";
import { ProcesosStepManager } from "../../Components/GD/Settings/CesacionManager/CesacionManager";


export const CesacionStepsManager: React.FC = () => {
  const {PasosCesacion,} = useGestorServices()
   const {Maestro} = useCoreGraphServices()
  const cesacionesStepsController = useCesacionSteps()
  const { options: cargosOption, loading: loadingCargo, reload: reloadCargo } = useCargo(Maestro);

  React.useEffect(() => {
    reloadCargo()
  }, []);

  return (
    <ProcesosStepManager 
        onReload={cesacionesStepsController.load} 
        pasos={cesacionesStepsController.rows} 
        tipo={"Cesacion"} 
        onAdd={PasosCesacion.create.bind(PasosCesacion)} 
        onEdit={PasosCesacion.update.bind(PasosCesacion)} 
        onDesactivate={cesacionesStepsController.desactivate}
        cargos={cargosOption} 
        loadingCargo={loadingCargo}
        onActivate={cesacionesStepsController.activate}
        />
  );
};
