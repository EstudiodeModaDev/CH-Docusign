import * as React from "react";
import { useGraphServices } from "../../graph/graphContext";
import { useCargo } from "../../Funcionalidades/Desplegables";
import { ProcesosStepManager } from "../../Components/GD/Settings/CesacionManager/CesacionManager";
import { useRetailSteps } from "../../Funcionalidades/GD/Steps/RetailSteps/retailStepts";

export const RetailStepsManager: React.FC = () => {
  const { pasosRetail, Maestro } = useGraphServices();
  const retailStepsController = useRetailSteps();
  const { options: cargosOption, loading: loadingCargo, reload: reloadCargo } = useCargo(Maestro);

  React.useEffect(() => {
    reloadCargo();
  }, []);

  return (
    <ProcesosStepManager
      onReload={retailStepsController.load}
      pasos={retailStepsController.rows}
      tipo={"Retail"}
      onAdd={pasosRetail.create.bind(pasosRetail)}
      onEdit={pasosRetail.update.bind(pasosRetail)}
      onDesactivate={retailStepsController.desactivate}
      cargos={cargosOption}
      loadingCargo={loadingCargo}
      onActivate={retailStepsController.activate}
    />
  );
};
