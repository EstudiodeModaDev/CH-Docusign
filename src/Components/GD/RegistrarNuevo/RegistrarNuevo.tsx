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
import { useContratos } from "../../../Funcionalidades/GD/Contratos";
import { useGraphServices } from "../../../graph/graphContext";
import { useHabeasData } from "../../../Funcionalidades/GD/HabeasData";
import { useCesaciones } from "../../../Funcionalidades/GD/Cesaciones";
import { usePromocion } from "../../../Funcionalidades/GD/Promocion";
import RetailTabla from "./Retail/Retail";
import { useRetail } from "../../../Funcionalidades/GD/Retail";
import FormRetail from "./Modals/Retail/addRetail";
import { useCargo, useCentroCostos, useCentroOperativo, useDependenciasMixtas, useDeptosMunicipios, useEmpresasSelect, useEspecificidadCargo, useEtapa, useModalidadTrabajo, useNivelCargo, useOrigenSeleccion, useTipoContrato, useTipoDocumentoSelect, useTipoVacante, useUnidadNegocio } from "../../../Funcionalidades/Desplegables";

export default function RegistrarNuevoPage() {
  const { Contratos, HabeasData, Cesaciones,Promociones, Retail, Maestro, DeptosYMunicipios} = useGraphServices();
  const {handleCancelProcessbyId, setState, rows, loading, error, state, pageSize, handleSubmit, pageIndex, hasNext, sorts, setField, setEstado, estado, setRange, setPageSize, nextPage, reloadAll,  toggleSort, range, setSearch, search, loadFirstPage, errors, searchRegister, handleEdit} = useContratos(Contratos,);
  const {rows: rowsHabeas, loading: loadingHabeas, error: errorHabeas, pageSize: pageSizeHabeas, pageIndex: pageIndexHabeas, state: stateHabeas, hasNext: hasNextHabeas, sorts: sortsHabeas, setRange: setRangeHabeas, setPageSize: setPageSizeHabeas, handleSubmit: handleSubmitHabeas, setField: setFieldHabeas, errors: errorsHabeas, loadFirstPage: loadFirstPageHabeas, cleanState, nextPage: nextPageHabeas, reloadAll: reloadAllHabeas, toggleSort: toggleSortHabeas, range: rangeHabeas, setSearch: setSearchHabeas, search: searchHabeas} = useHabeasData(HabeasData)
  const {rows: rowsCesaciones, loading: loadingCesaciones, error: errorCesaciones, pageSize: pageSizeCesaciones, pageIndex: pageIndexCesaciones, state: stateCesaciones, hasNext: hasNextCesaciones, sorts: sortsCesaciones, setRange: setRangeCesaciones, setPageSize: setPageSizeCesaciones, handleSubmit: handleSubmitCesaciones, setField: setFieldsCesaciones, errors: errorsCesaciones, loadFirstPage: loadFirstPageCesaciones, nextPage: nextPageCesaciones, reloadAll: reloadAllCesaciones, toggleSort: toggleSortCesaciones, range: rangeCesaciones, setSearch: setSearchCesaciones, search: searchCesaciones, estado: estadoCesaciones, setEstado: setEstadoCesaciones, searchRegister: searchCesacion} = useCesaciones(Cesaciones)
  const {rows: rowsPromociones, loading: loadingPromociones, error: errorPromociones, pageSize: pageSizePromociones, pageIndex: pageIndexPromociones, state: statePromociones, hasNext: hasNextPromociones, sorts: sortsPromociones, setRange: setRangePromociones, setPageSize: setPageSizePromociones, handleSubmit: handleSumbitPromociones, setField: setFieldsPromociones, errors: errorsPromociones, loadFirstPage: loadFirstPagePromociones, nextPage: nextPagePromociones, reloadAll: reloadAllPromociones, toggleSort: toggleSortPromociones, range: rangePromociones, setSearch: setSearchPromociones, search: searchPromociones, estado: estadoPromociones, setEstado: setEstadoPromociones, searchRegister: searchRegisterPromociones} = usePromocion(Promociones)
 
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
 
  const {rows: rowsRetail, loading: loadingRetail, error: errorRetail, pageSize: pageSizeRetail, pageIndex: pageIndexRetail, state: stateRetail, hasNext: hasNextRetail, sorts: sortsRetail, setRange: setRangeRetail, setPageSize: setPageSizeRetail, handleSubmit: handleSubmitRetail, setField: setFieldRetail, errors: errorsRetail, loadFirstPage: loadFirstPageRetail, nextPage: nextPageRetail, reloadAll: reloadAllRetail, toggleSort: toggleSortRetail, range: rangeRetail, setSearch: setSearchRetail, search: searchRetail, estado: estadoRetail, setEstado: setEstadoRetail, searchRegister: searchRegisterRetail} = useRetail(Retail)
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
  }, [reloadEmpresas, reloadTipoDoc, reloadCargo, reloadModalidadTrabajo, reloadEspecidadCargo]);

  return (
    <div className="rn-page">

      <div className="rn-toolbar">
        <div className="rn-toolbar__right">
          <select  id="orden" className="rn-select" value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar resultados">
            <option value="cesaciones">Cesaciones</option>
            <option value="habeas">Habeas Data</option>
            <option value="contrataciones">Contrataciones</option>
            <option value="promociones">Promociones</option>
            <option value="retail">Retail</option>
          </select>
          <a className="btn btn-circle btn-circle--sm" onClick={() => setModal(true)} aria-label="Relacionar nuevo">+</a>
        </div>
      </div>

      {
        orden === "contrataciones" ? ( 
          <TablaContratos 
            rows={rows} 
            loading={loading} 
            error={error} 
            pageIndex={pageIndex} 
            pageSize={pageSize} 
            hasNext={hasNext} 
            sorts={sorts} 
            setRange={setRange} 
            setPageSize={setPageSize} 
            nextPage={nextPage} 
            reloadAll={reloadAll} 
            toggleSort={toggleSort} 
            range={range} 
            search={search} 
            setSearch={setSearch} 
            loadFirstPage={loadFirstPage} 
            setEstado={setEstado} 
            estado={estado} 
            state={state} 
            setField={setField} 
            handleSubmit={handleSubmit} 
            handleEdit={handleEdit} 
            errors={errors} 
            searchRegister={searchRegister} 
            setState={setState} 
            handleCancelProcessbyId={handleCancelProcessbyId} 
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
            loadingDependencias={loadingDependencias} /> ) :  
        orden === "habeas" ? (<TablaHabeas rows={rowsHabeas} loading={loadingHabeas} error={errorHabeas} pageSize={pageSizeHabeas} pageIndex={pageIndexHabeas} hasNext={hasNextHabeas} sorts={sortsHabeas} setRange={setRangeHabeas} setPageSize={setPageSizeHabeas} nextPage={nextPageHabeas} reloadAll={reloadAllHabeas} toggleSort={toggleSortHabeas} range={rangeHabeas} setSearch={setSearchHabeas} search={searchHabeas} loadFirstPage={loadFirstPageHabeas}/>) : 
        orden === "promociones" ? (<TablaPromociones rows={rowsPromociones} loading={loadingPromociones} error={errorPromociones} pageSize={pageSizePromociones} pageIndex={pageIndexPromociones} hasNext={hasNextPromociones} sorts={sortsPromociones} setRange={setRangePromociones} setPageSize={setPageSizePromociones} nextPage={nextPagePromociones} reloadAll={reloadAllPromociones} toggleSort={toggleSortPromociones} range={rangePromociones} setSearch={setSearchPromociones} search={searchPromociones} loadFirstPage={loadFirstPagePromociones} estado={estadoPromociones} setEstado={setEstadoPromociones} />) : 
        orden === "cesaciones" ? (<CesacionesTabla rows={rowsCesaciones} loading={loadingCesaciones} error={errorCesaciones} pageSize={pageSizeCesaciones} pageIndex={pageIndexCesaciones} hasNext={hasNextCesaciones} sorts={sortsCesaciones} setRange={setRangeCesaciones} setPageSize={setPageSizeCesaciones} nextPage={nextPageCesaciones} reloadAll={reloadAllCesaciones} toggleSort={toggleSortCesaciones} range={rangeCesaciones} setSearch={setSearchCesaciones} search={searchCesaciones} loadFirstPage={loadFirstPageCesaciones} setEstado={setEstadoCesaciones} estado={estadoCesaciones} />) :
        orden === "retail" ? (<RetailTabla rows={rowsRetail} loading={loadingRetail} error={errorRetail} pageSize={pageSizeRetail} pageIndex={pageIndexRetail} hasNext={hasNextRetail} sorts={sortsRetail} setRange={setRangeRetail} setPageSize={setPageSizeRetail} nextPage={nextPageRetail} reloadAll={reloadAllRetail} toggleSort={toggleSortRetail} range={rangeRetail} setSearch={setSearchRetail} search={searchRetail} loadFirstPage={loadFirstPageRetail} setEstado={setEstadoRetail} estado={estadoRetail} />) : null
      }
      

      {/* MODALES AGREGAR */}
      {orden === "contrataciones" && modal ? 
        <FormContratacion 
          state={state}
          setField={setField}
          onClose={() => setModal(false)}
          handleSubmit={() => handleSubmit()}
          errors={errors}
          searchRegister={(cedula: string) => searchRegister(cedula)}
          loadFirstPage={loadFirstPage}
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
          handleEdit={handleEdit}
          tipo={"new"}
          setState={setState}
          handleCancelProcessbyId={handleCancelProcessbyId} 
          title={"Nueva Contratación"}/> : null}
      {orden === "habeas" && modal ? <FormHabeas onClose={() => setModal(false)} state={stateHabeas} setField={setFieldHabeas} handleSubmit={handleSubmitHabeas} errors={errorsHabeas} loadFirstPage={loadFirstPageHabeas} cleanState={cleanState}/> : null}
      {orden === "promociones" && modal ? <FormPromociones onClose={() => setModal(false)} state={statePromociones} setField={setFieldsPromociones} handleSubmit={handleSumbitPromociones} errors={errorsPromociones} searchPromocion={searchRegisterPromociones} loadFirstPage={loadFirstPagePromociones}/> : null}
      {orden === "cesaciones" && modal ? <FormCesacion onClose={() => setModal(false)} state={stateCesaciones} setField={setFieldsCesaciones} handleSubmit={handleSubmitCesaciones} errors={errorsCesaciones} searchCesacion={searchCesacion} loadFirstPage={loadFirstPageCesaciones}/> : null}
      {orden === "retail" && modal ? <FormRetail onClose={() => setModal(false)} state={stateRetail} setField={setFieldRetail} handleSubmit={handleSubmitRetail} errors={errorsRetail} searchRetail={searchRegisterRetail} loadFirstPage={loadFirstPageRetail}/> : null}
    </div>
  );
}