import * as React from "react";
import { useGestorServices, useCoreGraphServices} from "../../graph/graphContext";
import { useCargo } from "../../Funcionalidades/Desplegables";
import { ProcesosStepManager } from "../../Components/GD/Settings/CesacionManager/CesacionManager";
import { useNovedadesSteps } from "../../Funcionalidades/GD/Steps/ContratosSteps/useNovedadesSteps";

export const NovedadesStepsManager: React.FC = () => {
  const { PasosNovedades,  } = useGestorServices();
  const {Maestro} = useCoreGraphServices()
  const novedadesStepsController = useNovedadesSteps();
  const { options: cargosOption, loading: loadingCargo, reload: reloadCargo } = useCargo(Maestro);

  React.useEffect(() => {
    reloadCargo();
  }, []);

  return (
    <ProcesosStepManager
      onReload={novedadesStepsController.load}
      pasos={novedadesStepsController.rows}
      tipo={"Novedades Administrativas"}
      onAdd={PasosNovedades.create.bind(PasosNovedades)}
      onEdit={PasosNovedades.update.bind(PasosNovedades)}
      onDesactivate={novedadesStepsController.desactivate}
      cargos={cargosOption}
      loadingCargo={loadingCargo}
      onActivate={novedadesStepsController.activate}
    />
  );
};
