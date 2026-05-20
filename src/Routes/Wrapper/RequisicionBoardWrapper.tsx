import * as React from "react";
import { useGraphServices } from "../../graph/graphContext";
import type { requisiciones } from "../../models/Requisiciones/requisiciones";
import { useCargo, useDeptosMunicipios, } from "../../Funcionalidades/Desplegables";
import { useRequisicionesContext } from "../../Funcionalidades/Requisiciones/RequisicionesContext";
import RequisicionesBoard from "../../Components/Requisiciones/tablaRequisiciones/tablaRequisiciones";

export default function RequisicionesBoardWrapper() {
  const { Maestro, DeptosYMunicipios } = useGraphServices();
  const { setState } = useRequisicionesContext();
  
  const { options: cargoOptions, reload: reloadCargo, } = useCargo(Maestro);
  const { reload: reloadDeptos } = useDeptosMunicipios(DeptosYMunicipios);

  React.useEffect(() => {
    reloadCargo();
    reloadDeptos();
  }, []);
    
  async function onSelect(r: requisiciones): Promise<void> {
      setState(r)
  }

  return (
    <div className="rq-page">
      <section className="rq-kpis">
        <RequisicionesBoard 
          cargoOptions={cargoOptions} 
          onOpenRow={onSelect}
        />      
      </section>
    </div>
    );
}
