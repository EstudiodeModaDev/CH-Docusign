import * as React from "react";
import "./Registrar.css";
import TablaContratos from "./Contratos/Contratos";
import TablaHabeas from "./HabeasData/HabeasData";
import TablaPromociones from "./Promociones/Promociones";
import FormContratacion from "./Modals/Contrato/addContrato";
import FormHabeas from "./Modals/HabeasData/addHabeasData";
import FormPromociones from "./Modals/Promociones/addPromociones";
export default function RegistrarNuevoPage() {
  const [orden, setOrden] = React.useState("contrataciones");
  const [modal, setModal] = React.useState<boolean>(false)

  return (
    <div className="rn-page">

      <div className="rn-toolbar">
        <div className="rn-toolbar__right">
          <select  id="orden" className="rn-select" value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar resultados">
            <option value="habeas">Habeas Data</option>
            <option value="contrataciones">Contrataciones</option>
            <option value="promociones">Promociones</option>
          </select>
          <a className="btn btn-circle btn-circle--sm" onClick={() => setModal(true)} aria-label="Relacionar nuevo">+</a>
        </div>
      </div>

      {orden === "contrataciones" ? <TablaContratos /> : orden === "habeas" ? <TablaHabeas/> : <TablaPromociones/>}

      {/* MODALES AGREGAR */}
      {orden === "contrataciones" && modal ? <FormContratacion onClose={() => setModal(false)}/> : null}
      {orden === "habeas" && modal ? <FormHabeas onClose={() => setModal(false)}/> : null}
      {orden === "promociones" && modal ? <FormPromociones onClose={() => setModal(false)}/> : null}

    </div>
  );
}
