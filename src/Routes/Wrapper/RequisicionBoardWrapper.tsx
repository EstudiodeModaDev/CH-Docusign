import * as React from "react";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
import type { requisiciones } from "../../models/Requisiciones/requisiciones";
import { useCargo, useDeptosMunicipios } from "../../Funcionalidades/Desplegables";
import { useRequisicionesContext } from "../../Funcionalidades/Requisiciones/RequisicionesContext";
import RequisicionesBoard from "../../Components/Requisiciones/tablaRequisiciones/tablaRequisiciones";
import RequisicionDetalleModal from "../../Components/Requisiciones/tablaRequisiciones/RequisicionDetalleModal";
import { useCoreGraphServices, } from "../../graph/graphContext";

export default function RequisicionesBoardWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const { Maestro, DeptosYMunicipios } = useCoreGraphServices();
  const { setState, state } = useRequisicionesContext();
  const detailRouteMatch = useMatch("/requisicion/view/visualizacionDetalle");

  const { options: cargoOptions, reload: reloadCargo } = useCargo(Maestro);
  const { reload: reloadDeptos } = useDeptosMunicipios(DeptosYMunicipios);

  React.useEffect(() => {
    reloadCargo();
    reloadDeptos();
  }, [reloadCargo, reloadDeptos]);

  async function onSelect(row: requisiciones): Promise<void> {
    setState(row);
    navigate("visualizacionDetalle", { state: { requisicion: row } });
  }

  const selectedRow = (location.state as { requisicion?: requisiciones } | null)?.requisicion ?? (state?.Title || state?.Id ? state : null);

  const handleCloseModal = React.useCallback(() => {
    if (!detailRouteMatch) return;
    navigate("..", { relative: "path" });
  }, [detailRouteMatch, navigate]);

  React.useEffect(() => {
    if (detailRouteMatch && !selectedRow) {
      navigate("..", { relative: "path", replace: true });
    }
  }, [detailRouteMatch, navigate, selectedRow]);

  return (
    <>
      <div style={{padding: "10px"}}>
        <RequisicionesBoard cargoOptions={cargoOptions} onOpenRow={onSelect} />
      </div>

      <RequisicionDetalleModal
        open={Boolean(detailRouteMatch && selectedRow)}
        row={selectedRow}
        onClose={handleCloseModal}
      />
    </>
  );
}
