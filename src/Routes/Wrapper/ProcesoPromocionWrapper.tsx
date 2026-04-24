import * as React from "react";
import { useGraphServices } from "../../graph/graphContext";
import { useCargo } from "../../Funcionalidades/Desplegables";
import { ProcesosStepManager } from "../../Components/GD/Settings/CesacionManager/CesacionManager";
import { usePromocionSteps } from "../../Funcionalidades/GD/Steps/PromocionSteps/usePromocionSteps";
import type { PasosProceso } from "../../models/Pasos";

export const PromocionStepsManager: React.FC = () => {
  const { PasosPromocion, Maestro } = useGraphServices();
  const promocionesStepsController = usePromocionSteps();
  const { options: cargosOption, loading: loadingCargo, reload: reloadCargo } = useCargo(Maestro);

  React.useEffect(() => {
    reloadCargo();
  }, []);

  return (
    <ProcesosStepManager
      onReload={promocionesStepsController.load}
      pasos={promocionesStepsController.rows}
      tipo={"Promociones"}
      onAdd={PasosPromocion.create.bind(PasosPromocion)}
      onEdit={(id: string, changed: Partial<Omit<PasosProceso, "ID">>) => PasosPromocion.update(id, changed)}
      onDesactivate={promocionesStepsController.desactivate}
      cargos={cargosOption}
      loadingCargo={loadingCargo}
      onActivate={promocionesStepsController.activate}
    />
  );
};
