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

export default function RegistrarNuevoPage() {
  const { Contratos, NovedadCancelada, HabeasData, Cesaciones,Promociones, Retail} = useGraphServices();
  const {rows, loading, error, state, pageSize, handleSubmit, pageIndex, hasNext, sorts, setField, setEstado, estado, setRange, setPageSize, nextPage, reloadAll,  toggleSort, range, setSearch, search, loadFirstPage, errors, searchRegister} = useContratos(Contratos, NovedadCancelada);
  const {rows: rowsHabeas, loading: loadingHabeas, error: errorHabeas, pageSize: pageSizeHabeas, pageIndex: pageIndexHabeas, state: stateHabeas, hasNext: hasNextHabeas, sorts: sortsHabeas, setRange: setRangeHabeas, setPageSize: setPageSizeHabeas, handleSubmit: handleSubmitHabeas, setField: setFieldHabeas, errors: errorsHabeas, loadFirstPage: loadFirstPageHabeas, cleanState, nextPage: nextPageHabeas, reloadAll: reloadAllHabeas, toggleSort: toggleSortHabeas, range: rangeHabeas, setSearch: setSearchHabeas, search: searchHabeas} = useHabeasData(HabeasData)
  const {rows: rowsCesaciones, loading: loadingCesaciones, error: errorCesaciones, pageSize: pageSizeCesaciones, pageIndex: pageIndexCesaciones, state: stateCesaciones, hasNext: hasNextCesaciones, sorts: sortsCesaciones, setRange: setRangeCesaciones, setPageSize: setPageSizeCesaciones, handleSubmit: handleSubmitCesaciones, setField: setFieldsCesaciones, errors: errorsCesaciones, loadFirstPage: loadFirstPageCesaciones, nextPage: nextPageCesaciones, reloadAll: reloadAllCesaciones, toggleSort: toggleSortCesaciones, range: rangeCesaciones, setSearch: setSearchCesaciones, search: searchCesaciones, estado: estadoCesaciones, setEstado: setEstadoCesaciones, searchRegister: searchCesacion} = useCesaciones(Cesaciones)
  const {rows: rowsPromociones, loading: loadingPromociones, error: errorPromociones, pageSize: pageSizePromociones, pageIndex: pageIndexPromociones, state: statePromociones, hasNext: hasNextPromociones, sorts: sortsPromociones, setRange: setRangePromociones, setPageSize: setPageSizePromociones, handleSubmit: handleSumbitPromociones, setField: setFieldsPromociones, errors: errorsPromociones, loadFirstPage: loadFirstPagePromociones, nextPage: nextPagePromociones, reloadAll: reloadAllPromociones, toggleSort: toggleSortPromociones, range: rangePromociones, setSearch: setSearchPromociones, search: searchPromociones, estado: estadoPromociones, setEstado: setEstadoPromociones, searchRegister: searchRegisterPromociones} = usePromocion(Promociones)
  const {rows: rowsRetail, loading: loadingRetail, error: errorRetail, pageSize: pageSizeRetail, pageIndex: pageIndexRetail, state: stateRetail, hasNext: hasNextRetail, sorts: sortsRetail, setRange: setRangeRetail, setPageSize: setPageSizeRetail, handleSubmit: handleSubmitRetail, setField: setFieldRetail, errors: errorsRetail, loadFirstPage: loadFirstPageRetail, nextPage: nextPageRetail, reloadAll: reloadAllRetail, toggleSort: toggleSortRetail, range: rangeRetail, setSearch: setSearchRetail, search: searchRetail, estado: estadoRetail, setEstado: setEstadoRetail, searchRegister: searchRegisterRetail} = useRetail(Retail)
  const [orden, setOrden] = React.useState("contrataciones");
  const [modal, setModal] = React.useState<boolean>(false)

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
        orden === "contrataciones" ? ( <TablaContratos rows={rows} loading={loading} error={error} pageIndex={pageIndex} pageSize={pageSize} hasNext={hasNext} sorts={sorts} setRange={setRange} setPageSize={setPageSize} nextPage={nextPage} reloadAll={reloadAll} toggleSort={toggleSort} range={range} search={search} setSearch={setSearch} loadFirstPage={loadFirstPage} setEstado={setEstado} estado={estado} /> ) :  
        orden === "habeas" ? (<TablaHabeas rows={rowsHabeas} loading={loadingHabeas} error={errorHabeas} pageSize={pageSizeHabeas} pageIndex={pageIndexHabeas} hasNext={hasNextHabeas} sorts={sortsHabeas} setRange={setRangeHabeas} setPageSize={setPageSizeHabeas} nextPage={nextPageHabeas} reloadAll={reloadAllHabeas} toggleSort={toggleSortHabeas} range={rangeHabeas} setSearch={setSearchHabeas} search={searchHabeas} loadFirstPage={loadFirstPageHabeas}/>) : 
        orden === "promociones" ? (<TablaPromociones rows={rowsPromociones} loading={loadingPromociones} error={errorPromociones} pageSize={pageSizePromociones} pageIndex={pageIndexPromociones} hasNext={hasNextPromociones} sorts={sortsPromociones} setRange={setRangePromociones} setPageSize={setPageSizePromociones} nextPage={nextPagePromociones} reloadAll={reloadAllPromociones} toggleSort={toggleSortPromociones} range={rangePromociones} setSearch={setSearchPromociones} search={searchPromociones} loadFirstPage={loadFirstPagePromociones} estado={estadoPromociones} setEstado={setEstadoPromociones} />) : 
        orden === "cesaciones" ? (<CesacionesTabla rows={rowsCesaciones} loading={loadingCesaciones} error={errorCesaciones} pageSize={pageSizeCesaciones} pageIndex={pageIndexCesaciones} hasNext={hasNextCesaciones} sorts={sortsCesaciones} setRange={setRangeCesaciones} setPageSize={setPageSizeCesaciones} nextPage={nextPageCesaciones} reloadAll={reloadAllCesaciones} toggleSort={toggleSortCesaciones} range={rangeCesaciones} setSearch={setSearchCesaciones} search={searchCesaciones} loadFirstPage={loadFirstPageCesaciones} setEstado={setEstadoCesaciones} estado={estadoCesaciones} />) :
        orden === "retail" ? (<RetailTabla rows={rowsRetail} loading={loadingRetail} error={errorRetail} pageSize={pageSizeRetail} pageIndex={pageIndexRetail} hasNext={hasNextRetail} sorts={sortsRetail} setRange={setRangeRetail} setPageSize={setPageSizeRetail} nextPage={nextPageRetail} reloadAll={reloadAllRetail} toggleSort={toggleSortRetail} range={rangeRetail} setSearch={setSearchRetail} search={searchRetail} loadFirstPage={loadFirstPageRetail} setEstado={setEstadoRetail} estado={estadoRetail} />) : null
      }
      

      {/* MODALES AGREGAR */}
      {orden === "contrataciones" && modal ? <FormContratacion state={state} setField={setField} onClose={() => setModal(false)} handleSubmit={() => handleSubmit()} errors={errors} searchRegister={(cedula: string) => searchRegister(cedula)} loadFirstPage={loadFirstPage}/> : null}
      {orden === "habeas" && modal ? <FormHabeas onClose={() => setModal(false)} state={stateHabeas} setField={setFieldHabeas} handleSubmit={handleSubmitHabeas} errors={errorsHabeas} loadFirstPage={loadFirstPageHabeas} cleanState={cleanState}/> : null}
      {orden === "promociones" && modal ? <FormPromociones onClose={() => setModal(false)} state={statePromociones} setField={setFieldsPromociones} handleSubmit={handleSumbitPromociones} errors={errorsPromociones} searchPromocion={searchRegisterPromociones} loadFirstPage={loadFirstPagePromociones}/> : null}
      {orden === "cesaciones" && modal ? <FormCesacion onClose={() => setModal(false)} state={stateCesaciones} setField={setFieldsCesaciones} handleSubmit={handleSubmitCesaciones} errors={errorsCesaciones} searchCesacion={searchCesacion} loadFirstPage={loadFirstPageCesaciones}/> : null}
      {orden === "retail" && modal ? <FormRetail onClose={() => setModal(false)} state={stateRetail} setField={setFieldRetail} handleSubmit={handleSubmitRetail} errors={errorsRetail} searchRetail={searchRegisterRetail} loadFirstPage={loadFirstPageRetail}/> : null}
    </div>
  );
}