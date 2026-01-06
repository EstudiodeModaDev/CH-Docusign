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
import { useContratos } from "../../Funcionalidades/Contratos";
import { useGraphServices } from "../../graph/graphContext";
import { useHabeasData } from "../../Funcionalidades/HabeasData";

export default function RegistrarNuevoPage() {
  const { Contratos, NovedadCancelada, HabeasData} = useGraphServices();
  const {rows, loading, error, state, pageSize, handleSubmit, pageIndex, hasNext, sorts, setField, setEstado, estado, setRange, setPageSize, nextPage, reloadAll,  toggleSort, range, setSearch, search, loadFirstPage, errors, searchRegister} = useContratos(Contratos, NovedadCancelada);
  const {rows: rowsHabeas, loading: loadingHabeas, error: errorHabeas, pageSize: pageSizeHabeas, pageIndex: pageIndexHabeas, state: stateHabeas, hasNext: hasNextHabeas, sorts: sortsHabeas, setRange: setRangeHabeas, setPageSize: setPageSizeHabeas, handleSubmit: handleSubmitHabeas, setField: setFieldHabeas, errors: errorsHabeas, loadFirstPage: loadFirstPageHabeas, cleanState, nextPage: nextPageHabeas, reloadAll: reloadAllHabeas, toggleSort: toggleSortHabeas, range: rangeHabeas, setSearch: setSearchHabeas, search: searchHabeas} = useHabeasData(HabeasData)
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
          </select>
          <a className="btn btn-circle btn-circle--sm" onClick={() => setModal(true)} aria-label="Relacionar nuevo">+</a>
        </div>
      </div>

      {
        orden === "contrataciones" ? ( <TablaContratos rows={rows} loading={loading} error={error} pageIndex={pageIndex} pageSize={pageSize} hasNext={hasNext} sorts={sorts} setRange={setRange} setPageSize={setPageSize} nextPage={nextPage} reloadAll={reloadAll} toggleSort={toggleSort} range={range} search={search} setSearch={setSearch} loadFirstPage={loadFirstPage} setEstado={setEstado} estado={estado} /> ) :  
        orden === "habeas" ? (<TablaHabeas rows={rowsHabeas} loading={loadingHabeas} error={errorHabeas} pageSize={pageSizeHabeas} pageIndex={pageIndexHabeas} hasNext={hasNextHabeas} sorts={sortsHabeas} setRange={setRangeHabeas} setPageSize={setPageSizeHabeas} nextPage={nextPageHabeas} reloadAll={reloadAllHabeas} toggleSort={toggleSortHabeas} range={rangeHabeas} setSearch={setSearchHabeas} search={searchHabeas} loadFirstPage={loadFirstPageHabeas}/>) : 
        orden === "promociones" ? (<TablaPromociones />) : 
        orden === "cesaciones" ? (<CesacionesTabla />) : null
      }
      

      {/* MODALES AGREGAR */}
      {orden === "contrataciones" && modal ? <FormContratacion state={state} setField={setField} onClose={() => setModal(false)} handleSubmit={() => handleSubmit()} errors={errors} searchRegister={(cedula: string) => searchRegister(cedula)} loadFirstPage={loadFirstPage}/> : null}
      {orden === "habeas" && modal ? <FormHabeas onClose={() => setModal(false)} state={stateHabeas} setField={setFieldHabeas} handleSubmit={handleSubmitHabeas} errors={errorsHabeas} loadFirstPage={loadFirstPageHabeas} cleanState={cleanState}/> : null}
      {orden === "promociones" && modal ? <FormPromociones onClose={() => setModal(false)}/> : null}
      {orden === "cesaciones" && modal ? <FormCesacion onClose={() => setModal(false)}/> : null}

    </div>
  );
}
