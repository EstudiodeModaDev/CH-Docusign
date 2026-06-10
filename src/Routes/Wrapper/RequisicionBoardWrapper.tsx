import * as React from "react";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
import type { requisiciones } from "../../models/Requisiciones/requisiciones";
import {
  gruposCVE,
  useCargo,
  useCentroCostos,
  useCentroOperativo,
  useDeptosMunicipios,
  useDireccion,
  useModalidadTrabajo,
  useMotivoRequisicion,
  useTipoVacante,
  useUnidadNegocio,
} from "../../Funcionalidades/Desplegables";
import { useRequisicionesContext } from "../../Funcionalidades/Requisiciones/RequisicionesContext";
import RequisicionesBoard from "../../Components/Requisiciones/tablaRequisiciones/tablaRequisiciones";
import RequisicionDetalleModal from "../../Components/Requisiciones/tablaRequisiciones/RequisicionDetalleModal";
import RequisicionEditModal from "../../Components/Requisiciones/tablaRequisiciones/RequisicionEditModal";
import { useCoreGraphServices, useRequisicionesServices } from "../../graph/graphContext";
import { notify } from "../../utils/notify";
import { useRequisicion } from "../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicion";

export default function RequisicionesBoardWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const { Maestro, DeptosYMunicipios } = useCoreGraphServices();
  const { requisiciones } = useRequisicionesServices();
  const { setState, state } = useRequisicionesContext();
  const detailRouteMatch = useMatch("/requisicion/view/visualizacionDetalle");
  const editRouteMatch = useMatch("/requisicion/view/editRequisicion");
  const {onPostergarANS} = useRequisicion()

  const { options: cargoOptions, reload: reloadCargo } = useCargo(Maestro);
  const { options: ciudadesOptions, reload: reloadDeptos } = useDeptosMunicipios(DeptosYMunicipios);
  const { options: tipoVacanteOptions, reload: reloadTipoVacante } = useTipoVacante(Maestro);
  const { options: motivoOptions, reload: reloadMotivos } = useMotivoRequisicion(Maestro);
  const { options: direccionOptions, reload: reloadDirecciones } = useDireccion(Maestro);
  const { options: unidadNegocioOptions, reload: reloadUnidadNegocio } = useUnidadNegocio(Maestro);
  const { options: centroCostosOptions, reload: reloadCentroCostos } = useCentroCostos(Maestro);
  const { options: centroOperativoOptions, reload: reloadCentroOperativo } = useCentroOperativo(Maestro);
  const { options: modalidadOptions, reload: reloadModalidad } = useModalidadTrabajo(Maestro);
  const { options: grupoCveOptions, reload: reloadGrupoCve } = gruposCVE(Maestro);

  React.useEffect(() => {
    reloadCargo();
    reloadDeptos();
    reloadTipoVacante();
    reloadMotivos();
    reloadDirecciones();
    reloadUnidadNegocio();
    reloadCentroCostos();
    reloadCentroOperativo();
    reloadModalidad();
    reloadGrupoCve();
  }, [
    reloadCargo,
    reloadCentroCostos,
    reloadCentroOperativo,
    reloadDeptos,
    reloadDirecciones,
    reloadGrupoCve,
    reloadModalidad,
    reloadMotivos,
    reloadTipoVacante,
    reloadUnidadNegocio,
  ]);

  const ciudadOptions = React.useMemo(() => {
    const unique = new Set<string>();

    ciudadesOptions.forEach((option) => {
      const city = String(option.value ?? "").trim();
      if (city) unique.add(city);
    });

    return Array.from(unique)
      .sort((left, right) => left.localeCompare(right, "es"))
      .map((city) => ({ value: city, label: city }));
  }, [ciudadesOptions]);

  async function onSelect(row: requisiciones): Promise<void> {
    setState(row);
    navigate("visualizacionDetalle", { state: { requisicion: row } });
  }

  async function onEdit(row: requisiciones): Promise<void> {
    setState(row);
    navigate("editRequisicion", { state: { requisicion: row } });
  }

  const selectedRow =
    (location.state as { requisicion?: requisiciones } | null)?.requisicion ??
    (state?.Title || state?.Id ? state : null);

  async function onSaveEdit(toEdit: Partial<requisiciones>): Promise<void> {
    const id = toEdit.Id ?? selectedRow?.Id;

    if (!id) {
      notify.error("La requisicion escogida no tiene un ID valido");
      return;
    }

    try {
      const { Id: _ignoredId, ...changes } = toEdit;
      const updated = await requisiciones.update(id, changes);
      setState(updated);
      notify.success("Se ha editado la requisicion con exito");
    } catch (e: any) {
      notify.error("Algo ha salido mal, " + e);
      throw new Error("No se ha podido editar la requisicion");
    }
  }

  const handleCloseModal = React.useCallback(() => {
    if (!detailRouteMatch && !editRouteMatch) return;
    navigate("..", { relative: "path" });
  }, [detailRouteMatch, editRouteMatch, navigate]);

  React.useEffect(() => {
    if ((detailRouteMatch || editRouteMatch) && !selectedRow) {
      navigate("..", { relative: "path", replace: true });
    }
  }, [detailRouteMatch, editRouteMatch, navigate, selectedRow]);

  return (
    <>
      <div style={{ padding: "10px" }}>
        <RequisicionesBoard cargoOptions={cargoOptions} onOpenRow={onSelect} onEditRow={onEdit} />
      </div>

      <RequisicionDetalleModal
        open={Boolean(detailRouteMatch && selectedRow)}
        row={selectedRow}
        onClose={handleCloseModal} onPostergarANSBD={onPostergarANS}      />

      <RequisicionEditModal
        open={Boolean(editRouteMatch && selectedRow)}
        row={selectedRow}
        onClose={handleCloseModal}
        selectOptions={{
          cargoOptions,
          ciudadOptions,
          tipoRequisicionOptions: tipoVacanteOptions,
          motivoOptions,
          direccionOptions,
          unidadNegocioOptions,
          centroCostosOptions,
          centroOperativoOptions,
          modalidadOptions,
          grupoCveOptions,
        }}
        onSave={onSaveEdit}
      />
    </>
  );
}
