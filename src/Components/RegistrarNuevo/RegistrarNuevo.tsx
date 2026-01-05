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

export default function RegistrarNuevoPage() {
    const { Contratos, NovedadCancelada } = useGraphServices();
    const {rows, loading, error, state, pageSize, handleSubmit, pageIndex, hasNext, sorts, setField, setRange, setPageSize, nextPage, reloadAll,  toggleSort, range, setSearch, search, loadFirstPage, errors, searchRegister} = useContratos(Contratos, NovedadCancelada);

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
        orden === "contrataciones" ? ( <TablaContratos rows={rows} loading={loading} error={error} pageIndex={pageIndex} pageSize={pageSize} hasNext={hasNext} sorts={sorts} setRange={setRange} setPageSize={setPageSize} nextPage={nextPage} reloadAll={reloadAll} toggleSort={toggleSort} range={range}  search={search} setSearch={setSearch} loadFirstPage={loadFirstPage} /> ) :  
        orden === "habeas" ? (<TablaHabeas />) : 
        orden === "promociones" ? (<TablaPromociones />) : 
        orden === "cesaciones" ? (<CesacionesTabla />) : null
      }
      

      {/* MODALES AGREGAR */}
      {orden === "contrataciones" && modal ? <FormContratacion state={state} setField={setField} onClose={() => setModal(false)} handleSubmit={() => handleSubmit()} errors={errors} searchRegister={(cedula: string) => searchRegister(cedula)}/> : null}
      {orden === "habeas" && modal ? <FormHabeas onClose={() => setModal(false)}/> : null}
      {orden === "promociones" && modal ? <FormPromociones onClose={() => setModal(false)}/> : null}
      {orden === "cesaciones" && modal ? <FormCesacion onClose={() => setModal(false)}/> : null}

    </div>
  );
}
