import * as React from "react";
import "./Registrar.css";
import TablaContratos from "./Contratos/Contratos";
import TablaHabeas from "./HabeasData/HabeasData";
import TablaPromociones from "./Promociones/Promociones";
import FormContratacion from "./Modals/Contrato/addContrato";
import FormHabeas from "./Modals/HabeasData/addHabeasData";
import FormPromociones from "./Modals/Promociones/addPromociones";
import CesacionesTabla from "./Cesaciones/Cesaciones";
import FormCesacion from "./Modals/Cesaciones/addCesacion";
import { useGraphServices } from "../../../graph/graphContext";
import { usePromocion } from "../../../Funcionalidades/GD/Promocion";
import RetailTabla from "./Retail/Retail";
import FormRetail from "./Modals/Retail/addRetail";
import { useCargo, useCentroCostos, useCentroOperativo, useDependenciasMixtas, useDeptosMunicipios, useEmpresasSelect, useEspecificidadCargo, useEtapa, useModalidadTrabajo, useNivelCargo, useOrigenSeleccion, useTemporales, useTipoContrato, useTipoDocumentoSelect, useTipoVacante, useUnidadNegocio } from "../../../Funcionalidades/Desplegables";
import { useRetail } from "../../../Funcionalidades/GD/Retail";
import { usePermissions } from "../../../Funcionalidades/Permisos";
import type { FeatureKey } from "../../../models/security";
import { useCesaciones } from "../../../Funcionalidades/GD/Cesaciones/hooks/useCesaciones";
import { useContratos } from "../../../Funcionalidades/GD/Contratos/hooks/useContratos";
import { useHabeasData } from "../../../Funcionalidades/GD/Habeas/hooks/useHabeas";

export default function RegistrarNuevoPage() {
  const { Promociones, Retail, Maestro, DeptosYMunicipios} = useGraphServices();
  const contratosController = useContratos();
  const habeasController = useHabeasData()
  const cesacionesController = useCesaciones()
  const promocionesController = usePromocion(Promociones)
  const retailController = useRetail(Retail)
  const { engine } = usePermissions();
   //Desplegables
  const { options: empresaOptions, loading: loadingEmp, reload: reloadEmpresas } = useEmpresasSelect(Maestro);
  const { options: tipoDocOptions, loading: loadingTipo, reload: reloadTipoDoc } = useTipoDocumentoSelect(Maestro);
  const { options: cargoOptions, loading: loadingCargo, reload: reloadCargo } = useCargo(Maestro);
  const { options: modalidadOptions, loading: loadingModalidad, reload: reloadModalidadTrabajo } = useModalidadTrabajo(Maestro);
  const { options: especificidadOptions, loading: loadingEspecificdad, reload: reloadEspecidadCargo } = useEspecificidadCargo(Maestro);
  const { options: etapasOptions, loading: loadingEtapas, reload: reloadEtapas } = useEtapa(Maestro);
  const { options: nivelCargoOptions, loading: loadinNivelCargo, reload: reloadNivelCargo } = useNivelCargo(Maestro);
  const { options: CentroCostosOptions, loading: loadingCC, reload: reloadCC } = useCentroCostos(Maestro);
  const { options: COOptions, loading: loadingCO, reload: reloadCO } = useCentroOperativo(Maestro);
  const { options: UNOptions, loading: loadingUN, reload: reloadUN } = useUnidadNegocio(Maestro);
  const { options: origenOptions, loading: loadingOrigen, reload: reloadOrigenSeleccion } = useOrigenSeleccion(Maestro);
  const { options: tipoContratoOptions, loading: loadingTipoContrato, reload: reloadTipoContrato } = useTipoContrato(Maestro);
  const { options: tipoVacanteOptions, loading: loadingTipoVacante, reload: reloadTipoVacante } = useTipoVacante(Maestro);
  const { options: deptoOptions, loading: loadingDepto, reload: reloadDeptos } = useDeptosMunicipios(DeptosYMunicipios);
  const { options: dependenciaOptions, loading: loadingDependencias, } = useDependenciasMixtas(Maestro);
  const { options: temporalOptions, loading: loadingTemporal, reload: RealodTemporales } = useTemporales(Maestro);
 
  const [orden, setOrden] = React.useState("contrataciones");
  const [modal, setModal] = React.useState<boolean>(false)

  React.useEffect(() => {
      reloadEmpresas();
      reloadTipoDoc();
      reloadCargo();
      reloadModalidadTrabajo();
      reloadEspecidadCargo();
      reloadNivelCargo(),
      reloadCC(),
      reloadCO(),
      reloadDeptos(),
      reloadUN(),
      reloadOrigenSeleccion(),
      reloadTipoContrato(),
      reloadTipoContrato(),
      reloadTipoVacante(),
      reloadEtapas()
      RealodTemporales()
  }, []);

  const allOptions = [
    { value: "cesaciones", label: "Cesaciones", feature: "cesaciones.view" },
    { value: "habeas", label: "Habeas Data", feature: "habeas.view" },
    { value: "contrataciones", label: "Contrataciones", feature: "contrataciones.view" },
    { value: "promociones", label: "Promociones", feature: "promociones.view" },
    { value: "retail", label: "Retail", feature: "retail.view" },
  ] as const;

  const createPermissionBySection: Record<string, FeatureKey> = {
   contrataciones: "contrataciones.add",
   habeas: "habeas.add",
   promociones: "promociones.add",
    cesaciones: "cesaciones.add",
   retail: "retail.add",
  };

  const allowedOptions = React.useMemo(() => {
    return allOptions.filter((opt) => engine.can(opt.feature));
  }, [engine]);

  const canOpenCreateModal = React.useMemo(() => {
    const requiredPermission = createPermissionBySection[orden];
    if (!requiredPermission) return false;
    return engine.can(requiredPermission);
  }, [orden, engine]);

  return (
    <div className="rn-page">

      <div className="rn-toolbar">
        <div className="rn-toolbar__right">
          <select  id="orden" className="rn-select" value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar resultados">
            {allowedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {canOpenCreateModal &&
            <a className="btn btn-circle btn-circle--sm" onClick={() => setModal(true)} aria-label="Relacionar nuevo">+</a>
          }
        </div>
      </div>

      {
        orden === "contrataciones" ? ( 
          <TablaContratos 
            rows={contratosController.rows}
            loading={contratosController.loading}
            error={contratosController.error}
            pageIndex={contratosController.pageIndex}
            pageSize={contratosController.pageSize}
            hasNext={contratosController.hasNext}
            sorts={contratosController.sorts}
            setRange={contratosController.setRange}
            setPageSize={contratosController.setPageSize}
            nextPage={contratosController.nextPage}
            reloadAll={contratosController.reloadAll}
            toggleSort={contratosController.toggleSort}
            range={contratosController.range}
            search={contratosController.search}
            setSearch={contratosController.setSearch}
            loadFirstPage={contratosController.loadFirstPage}
            setEstado={contratosController.setEstado}
            estado={contratosController.estado}
            state={contratosController.state}
            setField={contratosController.setField}
            handleSubmit={contratosController.handleSubmit}
            handleEdit={contratosController.handleEdit}
            errors={contratosController.errors}
            searchRegister={contratosController.searchRegister}
            setState={contratosController.setState}
            handleCancelProcessbyId={contratosController.handleCancelProcessbyId}
            deleteContratacion={contratosController.deleteContrato}
            empresaOptions={empresaOptions}
            loadingEmp={loadingEmp}
            tipoDocOptions={tipoDocOptions}
            loadingTipo={loadingTipo}
            cargoOptions={cargoOptions}
            loadingCargo={loadingCargo}
            modalidadOptions={modalidadOptions}
            loadingModalidad={loadingModalidad}
            especificidadOptions={especificidadOptions}
            loadingEspecificdad={loadingEspecificdad}
            etapasOptions={etapasOptions}
            loadingEtapas={loadingEtapas}
            nivelCargoOptions={nivelCargoOptions}
            loadinNivelCargo={loadinNivelCargo}
            CentroCostosOptions={CentroCostosOptions}
            loadingCC={loadingCC}
            COOptions={COOptions}
            loadingCO={loadingCO}
            UNOptions={UNOptions}
            loadingUN={loadingUN}
            origenOptions={origenOptions}
            loadingOrigen={loadingOrigen}
            tipoContratoOptions={tipoContratoOptions}
            loadingTipoContrato={loadingTipoContrato}
            tipoVacanteOptions={tipoVacanteOptions}
            loadingTipoVacante={loadingTipoVacante}
            deptoOptions={deptoOptions}
            loadingDepto={loadingDepto}
            dependenciaOptions={dependenciaOptions}
            loadingDependencias={loadingDependencias}
            handleReactivatProcessbyId={contratosController.handleReactivateProcessById} 
            saveMedicalExams={contratosController.saveMedicalExams} /> ) :  
        orden === "habeas" ? (
          <TablaHabeas 
            rows={habeasController.rows} 
            loading={habeasController.loading} 
            error={""} 
            pageSize={habeasController.pageSize} 
            pageIndex={habeasController.pageIndex} 
            hasNext={habeasController.hasNext} 
            sorts={habeasController.sorts} 
            setRange={habeasController.setRange} 
            setPageSize={habeasController.setPageSize} 
            nextPage={habeasController.nextPage} 
            reloadAll={habeasController.loadFirstPage} 
            toggleSort={habeasController.toggleSort} 
            range={habeasController.range} 
            setSearch={habeasController.setSearch} 
            search={habeasController.search} 
            loadFirstPage={habeasController.loadFirstPage} 
            state={habeasController.state} 
            setField={habeasController.setField} 
            handleSubmit={habeasController.handleSubmit} 
            handleEdit={habeasController.handleEdit} 
            errors={habeasController.errors} 
            setState={habeasController.setState}
            deleteHabeas={habeasController.deleteHabeasData} 
            empresaOptions={empresaOptions} 
            loadingEmp={loadingEmp} 
            tipoDocOptions={tipoDocOptions} 
            loadingTipo={loadingTipo} 
            deptoOptions={deptoOptions} 
            loadingDepto={loadingDepto}/>) : 
        orden === "promociones" ? (
          <TablaPromociones 
            rows={promocionesController.rows}
            loading={promocionesController.loading}
            error={promocionesController.error}
            pageSize={promocionesController.pageSize}
            pageIndex={promocionesController.pageIndex}
            hasNext={promocionesController.hasNext}
            sorts={promocionesController.sorts}
            setRange={promocionesController.setRange}
            setPageSize={promocionesController.setPageSize}
            nextPage={promocionesController.nextPage}
            reloadAll={promocionesController.reloadAll}
            toggleSort={promocionesController.toggleSort}
            range={promocionesController.range}
            setSearch={promocionesController.setSearch}
            search={promocionesController.search}
            loadFirstPage={promocionesController.loadFirstPage}
            estado={promocionesController.estado}
            setEstado={promocionesController.setEstado}
            state={promocionesController.state}
            setField={promocionesController.setField}
            handleSubmit={promocionesController.handleSubmit}
            handleEdit={promocionesController.handleEdit}
            errors={promocionesController.errors}
            searchRegister={promocionesController.searchRegister}
            setState={promocionesController.setState}
            handleCancelProcessbyId={promocionesController.handleCancelProcessbyId}
            handleReactivateProcessById={promocionesController.handleReactivateProcessById}
            deletePromocion={promocionesController.deletePromocion}
            empresaOptions={empresaOptions}
            loadingEmp={loadingEmp}
            tipoDocOptions={tipoDocOptions}
            loadingTipo={loadingTipo}
            cargoOptions={cargoOptions}
            loadingCargo={loadingCargo}
            modalidadOptions={modalidadOptions}
            loadingModalidad={loadingModalidad}
            especificidadOptions={especificidadOptions}
            loadingEspecificdad={loadingEspecificdad}
            etapasOptions={etapasOptions}
            loadingEtapas={loadingEtapas}
            nivelCargoOptions={nivelCargoOptions}
            loadinNivelCargo={loadinNivelCargo}
            CentroCostosOptions={CentroCostosOptions}
            loadingCC={loadingCC}
            COOptions={COOptions}
            loadingCO={loadingCO}
            UNOptions={UNOptions}
            loadingUN={loadingUN}
            origenOptions={origenOptions}
            loadingOrigen={loadingOrigen}
            tipoContratoOptions={tipoContratoOptions}
            loadingTipoContrato={loadingTipoContrato}
            tipoVacanteOptions={tipoVacanteOptions}
            loadingTipoVacante={loadingTipoVacante}
            deptoOptions={deptoOptions}
            loadingDepto={loadingDepto}
            dependenciaOptions={dependenciaOptions}
            loadingDependencias={loadingDependencias} 
            submmiting={promocionesController.loading}
            saveMedicalExams={promocionesController.saveMedicalExams}/>) : 
        orden === "cesaciones" ? (
          <CesacionesTabla 
            rows={cesacionesController.rows}
            loading={cesacionesController.loading}
            error={cesacionesController.error}
            pageSize={cesacionesController.pageSize}
            pageIndex={cesacionesController.pageIndex}
            hasNext={cesacionesController.hasNext}
            sorts={cesacionesController.sorts}
            setRange={cesacionesController.setRange}
            setPageSize={cesacionesController.setPageSize}
            nextPage={cesacionesController.nextPage}
            reloadAll={cesacionesController.reloadAll}
            toggleSort={cesacionesController.toggleSort}
            range={cesacionesController.range}
            setSearch={cesacionesController.setSearch}
            search={cesacionesController.search}
            loadFirstPage={cesacionesController.loadFirstPage}
            setEstado={cesacionesController.setEstado}
            estado={cesacionesController.estado}
            state={cesacionesController.state}
            setField={cesacionesController.setField}
            handleSubmit={cesacionesController.handleSubmit}
            handleEdit={cesacionesController.handleEdit}
            errors={cesacionesController.errors}
            searchRegister={cesacionesController.searchRegister}
            setState={cesacionesController.setState}
            handleCancelProcessbyId={cesacionesController.handleCancelProcessbyId}
            handleReactivateProcessById={cesacionesController.handleReactivateProcessById}
            deleteCesacion={cesacionesController.deleteCesacion}
            sending={cesacionesController.loading}
            empresaOptions={empresaOptions}
            loadingEmp={loadingEmp}
            cargoOptions={cargoOptions}
            loadingCargo={loadingCargo}
            tipoDocOptions={tipoDocOptions}
            loadingTipo={loadingTipo}
            nivelCargoOptions={nivelCargoOptions}
            loadinNivelCargo={loadinNivelCargo}
            dependenciaOptions={dependenciaOptions}
            loadingDependencias={loadingDependencias}
            CentroCostosOptions={CentroCostosOptions}
            loadingCC={loadingCC}
            COOptions={COOptions}
            loadingCO={loadingCO}
            UNOptions={UNOptions}
            loadingUN={loadingUN}
            temporalOption={temporalOptions}
            temporalLoading={loadingTemporal}
            deptoOptions={deptoOptions} 
            loadingDeptos={loadingDepto}
            saveMedicalExams={cesacionesController.saveMedicalExams}/>) :
        orden === "retail" ? (
          <RetailTabla 
            rows={retailController.rows} 
            loading={retailController.loading} 
            error={retailController.error} 
            pageSize={retailController.pageSize} 
            pageIndex={retailController.pageIndex} 
            hasNext={retailController.hasNext} 
            sorts={retailController.sorts} 
            setRange={retailController.setRange} 
            setPageSize={retailController.setPageSize} 
            nextPage={retailController.nextPage} 
            reloadAll={retailController.reloadAll} 
            toggleSort={retailController.toggleSort} 
            range={retailController.range} 
            setSearch={retailController.setSearch} 
            search={retailController.search} 
            loadFirstPage={retailController.loadFirstPage} 
            setEstado={retailController.setEstado} 
            estado={retailController.estado} 
            state={retailController.state} 
            setField={retailController.setField} 
            handleSubmit={retailController.handleSubmit} 
            handleEdit={retailController.handleEdit} 
            errors={retailController.errors} 
            searchRegister={retailController.searchRegister} 
            setState={retailController.setState} 
            handleCancelProcessbyId={retailController.handleCancelProcessbyId} 
            handleReactivateProcessById={retailController.handleReactivateProcessById} 
            deleteRetail={retailController.deleteRetail}
            submitting={retailController.loading} 
            empresaOptions={empresaOptions} 
            loadingEmp={loadingEmp} 
            tipoDocOptions={tipoDocOptions} 
            loadingTipo={loadingTipo} 
            cargoOptions={cargoOptions} 
            loadingCargo={loadingCargo} 
            nivelCargoOptions={nivelCargoOptions} 
            loadinNivelCargo={loadinNivelCargo} 
            CentroCostosOptions={CentroCostosOptions} 
            loadingCC={loadingCC} 
            COOptions={COOptions} 
            loadingCO={loadingCO} 
            UNOptions={UNOptions} 
            loadingUN={loadingUN} 
            origenOptions={origenOptions} 
            loadingOrigen={loadingOrigen} 
            deptoOptions={deptoOptions} 
            loadingDepto={loadingDepto} 
            dependenciaOptions={dependenciaOptions} 
            loadingDependencias={loadingDependencias} 
            saveExamenesMedicos={retailController.saveMedicalExams}/>) : null
      }
      

      {/* MODALES AGREGAR */}
      {orden === "contrataciones" && modal ? 
        <FormContratacion 
          state={contratosController.state}
          setField={contratosController.setField}
          onClose={() => setModal(false)}
          handleSubmit={contratosController.handleSubmit}
          errors={contratosController.errors}
          searchRegister={contratosController.searchRegister}
          loadFirstPage={contratosController.loadFirstPage}
          empresaOptions={empresaOptions}
          loadingEmp={loadingEmp}
          tipoDocOptions={tipoDocOptions}
          loadingTipo={loadingTipo}
          cargoOptions={cargoOptions}
          loadingCargo={loadingCargo}
          modalidadOptions={modalidadOptions}
          loadingModalidad={loadingModalidad}
          especificidadOptions={especificidadOptions}
          loadingEspecificdad={loadingEspecificdad}
          etapasOptions={etapasOptions}
          loadingEtapas={loadingEtapas}
          nivelCargoOptions={nivelCargoOptions}
          loadinNivelCargo={loadinNivelCargo}
          CentroCostosOptions={CentroCostosOptions}
          loadingCC={loadingCC}
          COOptions={COOptions}
          loadingCO={loadingCO}
          UNOptions={UNOptions}
          loadingUN={loadingUN}
          origenOptions={origenOptions}
          loadingOrigen={loadingOrigen}
          tipoContratoOptions={tipoContratoOptions}
          loadingTipoContrato={loadingTipoContrato}
          tipoVacanteOptions={tipoVacanteOptions}
          loadingTipoVacante={loadingTipoVacante}
          deptoOptions={deptoOptions}
          loadingDepto={loadingDepto}
          dependenciaOptions={dependenciaOptions}
          loadingDependencias={loadingDependencias}
          handleEdit={contratosController.handleEdit}
          tipo={"new"}
          setState={contratosController.setState}
          handleCancelProcessbyId={contratosController.handleCancelProcessbyId}
          title={"Nueva Contratación"} 
          handleReactivateProcessById={contratosController.handleReactivateProcessById}/> : null}
      {orden === "habeas" && modal ? 
        <FormHabeas 
          onClose={() => setModal(false)}
          state={habeasController.state} 
          setField={habeasController.setField}
          handleSubmit={habeasController.handleSubmit}
          errors={habeasController.errors}
          loadFirstPage={habeasController.loadFirstPage}
          handleEdit={habeasController.handleEdit}
          tipo={"new"}
          setState={habeasController.setState}
          title={"Nuevo Habeas Data"}
          empresaOptions={empresaOptions}
          loadingEmp={habeasController.loading}
          tipoDocOptions={tipoDocOptions}
          loadingTipo={loadingTipo}
          deptoOptions={deptoOptions}
          loadingDepto={loadingDepto} 
          sending={habeasController.loading}        /> : null}
      {orden === "promociones" && modal ? 
        <FormPromociones 
          onClose={() => setModal(false)}
          state={promocionesController.state}
          setField={promocionesController.setField}
          handleSubmit={promocionesController.handleSubmit}
          errors={promocionesController.errors}
          loadFirstPage={promocionesController.loadFirstPage}
          handleEdit={promocionesController.handleEdit}
          searchRegister={promocionesController.searchRegister}
          tipo={"new"}
          setState={promocionesController.setState}
          handleCancelProcessbyId={promocionesController.handleCancelProcessbyId}
          handleReactivateProcessById={promocionesController.handleReactivateProcessById}
          title={"Nueva Promoción"}
          empresaOptions={empresaOptions}
          loadingEmp={loadingEmp}
          tipoDocOptions={tipoDocOptions}
          loadingTipo={loadingTipo}
          cargoOptions={cargoOptions}
          loadingCargo={loadingCargo}
          modalidadOptions={modalidadOptions}
          loadingModalidad={loadingModalidad}
          especificidadOptions={especificidadOptions}
          loadingEspecificdad={loadingEspecificdad}
          etapasOptions={etapasOptions}
          loadingEtapas={loadingEtapas}
          nivelCargoOptions={nivelCargoOptions}
          loadinNivelCargo={loadinNivelCargo}
          CentroCostosOptions={CentroCostosOptions}
          loadingCC={loadingCC}
          COOptions={COOptions}
          loadingCO={loadingCO}
          UNOptions={UNOptions}
          loadingUN={loadingUN}
          origenOptions={origenOptions}
          loadingOrigen={loadingOrigen}
          tipoContratoOptions={tipoContratoOptions}
          loadingTipoContrato={loadingTipoContrato}
          tipoVacanteOptions={tipoVacanteOptions}
          loadingTipoVacante={loadingTipoVacante}
          deptoOptions={deptoOptions}
          loadingDepto={loadingDepto}
          dependenciaOptions={dependenciaOptions}
          loadingDependencias={loadingDependencias} 
          submitting={promocionesController.loading}/> : null}
      {orden === "cesaciones" && modal ? 
        <FormCesacion 
          onClose={() => setModal(false)}
          state={cesacionesController.state}
          setField={cesacionesController.setField}
          handleSubmit={cesacionesController.handleSubmit}
          errors={cesacionesController.errors}
          handleEdit={cesacionesController.handleEdit}
          searchRegister={cesacionesController.searchRegister}
          handleCancelProcessbyId={cesacionesController.handleCancelProcessbyId}
          handleReactivateProcessById={cesacionesController.handleReactivateProcessById}
          title={"Nueva cesación"}
          empresaOptions={empresaOptions}
          loadingEmp={loadingEmp}
          cargoOptions={cargoOptions}
          loadingCargo={loadingCargo}
          tipoDocOptions={tipoDocOptions}
          loadingTipo={loadingTipo}
          nivelCargoOptions={nivelCargoOptions}
          loadinNivelCargo={loadinNivelCargo}
          dependenciaOptions={dependenciaOptions}
          loadingDependencias={loadingDependencias}
          CentroCostosOptions={CentroCostosOptions}
          loadingCC={loadingCC}
          COOptions={COOptions}
          loadingCO={loadingCO}
          UNOptions={UNOptions}
          loadingUN={loadingUN}
          temporalOption={temporalOptions}
          temporalLoading={loadingTemporal}
          deptoOptions={deptoOptions}
          loadingDeptos={loadingDepto}
          tipo={"new"}
          setState={cesacionesController.setState} 
          sending={cesacionesController.loading} /> : null}
      {orden === "retail" && modal ? 
        <FormRetail 
          onClose={() => setModal(false)}
          state={retailController.state}
          setField={retailController.setField}
          handleSubmit={retailController.handleSubmit}
          errors={retailController.errors}
          loadFirstPage={retailController.loadFirstPage} 
          handleEdit={retailController.handleEdit} 
          searchRegister={retailController.searchRegister} 
          tipo={"new"} 
          setState={retailController.setState} 
          handleCancelProcessbyId={retailController.handleCancelProcessbyId} 
          handleReactivateProcessById={retailController.handleReactivateProcessById} 
          title={"Nuevo retail"} 
          submitting={retailController.loading} 
          empresaOptions={empresaOptions} 
          loadingEmp={loadingEmp} 
          tipoDocOptions={tipoDocOptions} 
          loadingTipo={loadingTipo} 
          cargoOptions={cargoOptions} 
          loadingCargo={loadingCargo}  
          nivelCargoOptions={nivelCargoOptions} 
          loadinNivelCargo={loadinNivelCargo} 
          CentroCostosOptions={CentroCostosOptions} 
          loadingCC={loadingCC} 
          COOptions={COOptions} 
          loadingCO={loadingCO} 
          UNOptions={UNOptions} 
          loadingUN={loadingUN} 
          origenOptions={origenOptions} 
          loadingOrigen={loadingOrigen}
          deptoOptions={deptoOptions} 
          loadingDepto={loadingDepto} 
          dependenciaOptions={dependenciaOptions} 
          loadingDependencias={loadingDependencias}/> : null}
    </div>
  );
}