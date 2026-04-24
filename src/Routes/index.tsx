import { Navigate, Route, Routes } from "react-router-dom";
import RegistrarNuevoPage from "../Components/GD/RegistrarNuevo/RegistrarNuevo";
import SolicitudesAprobacion from "../Components/GD/RegistrarNuevo/Update/AproveList/AproveList";
import EnviarFormatoCard from "../Components/GD/SendDocument/SendDocument";
import EnvioMasivoUI from "../Components/GD/SendDocument/BulkSend/Bulk";
import { ReporteFiltros } from "../Components/GD/Reports/Reports";
import { ParametrosPage } from "../Components/GD/Settings/SettingsPage";
import GroupUsersManager from "../Components/Security/Security";
import { ColaboradoresExplorer } from "../Components/GD/View/VieweDocument";
import { PazSalvoPage } from "../Components/PazSalvo/PazSalvoPage";
import NuevoTicketForm from "../Components/Tickets/NuevoTicket";
import NewRequisicionWrapper from "./Wrapper/newRequisicion";
import TablaEnvios from "../Components/GD/ConsultarDocumentos/ConsultarDocumentos";
import { ConfiguracionesVariasComponent } from "../Components/GD/Settings/ConfiguracionesVarias/ConfiguracionesVarias";
import { EmpresasManager } from "../Components/GD/Settings/CompaniesSettings/CompaniesSettings";
import { OrigenSeleccionManager } from "../Components/GD/Settings/OrigenSeleccion/OrigenSeleccion";
import { DocumentTypeManager } from "../Components/GD/Settings/DocumentsType/DocumentType";
import { CargosManager } from "../Components/GD/Settings/Cargos/Cargos";
import { ModalidadesManager } from "../Components/GD/Settings/ModalidadesTrabajo/ModalidadesTrabajo";
import { EspecificidadManager } from "../Components/GD/Settings/EspecificidadCargo/EspecificidadCargo";
import { NivelCargosManager } from "../Components/GD/Settings/NivelCargos/NivelCargos";
import { CentroOperativoManager } from "../Components/GD/Settings/CentrosOperativos/CentrosOperativos";
import { UnidadNegocioManager } from "../Components/GD/Settings/UnidadNegocio/UnidadNegocio";
import { TipoContratoManager } from "../Components/GD/Settings/TipoContrato/TipoContrato";
import { TipoVacanteManager } from "../Components/GD/Settings/TipoVacante/TipoVacante";
import { CentroCostosManager } from "../Components/GD/Settings/CentroCostos/CentroCostos";
import { CesacionStepsManager } from "./Wrapper/ProcesoCesacionWrapper";
import { NovedadesStepsManager } from "./Wrapper/ProcesoNovedadesWrapper";
import { RetailStepsManager } from "./Wrapper/ProcesoRetailWrapper";
import { PromocionStepsManager } from "./Wrapper/ProcesoPromocionWrapper";
import RequisicionPage from "../Components/Requisiciones/RequisicionPage";
import { RequisicionesProvider } from "../Funcionalidades/Requisiciones/RequisicionesContext";


/**
 * Define las rutas principales de la aplicación.
 * @param props - Propiedades compartidas entre vistas dependientes del proyecto seleccionado.
 * @returns Árbol de rutas configurado para la aplicación.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/gd/register" element={<RegistrarNuevoPage />} />
      <Route path="/gd/request" element={<SolicitudesAprobacion/>}/>
      <Route path="/gd/send/one" element={<EnviarFormatoCard/>}/>
      <Route path="/gd/send/masive" element={<EnvioMasivoUI/>}/>
      <Route path="/gd/send/look" element={<TablaEnvios/>}/>
      <Route path="/gd/reports" element={<ReporteFiltros/>}/>
      <Route path="/gd/documents/view" element={<ColaboradoresExplorer/>}/>
      <Route path="/paz" element={<PazSalvoPage/>}/>
      <Route path="/settings" element={<ParametrosPage/>}>
        <Route index element={<Navigate to="/settings/configuraciones" replace />} />
        <Route path="configuraciones" element={<ConfiguracionesVariasComponent/>}/>
        <Route path="empresas" element={<EmpresasManager/>}/>
        <Route path="origenes" element={<OrigenSeleccionManager/>}/>
        <Route path="tiposdocumentos" element={<DocumentTypeManager/>}/>
        <Route path="cargos" element={<CargosManager/>}/>
        <Route path="modalidades" element={<ModalidadesManager/>}/>
        <Route path="especificidad" element={<EspecificidadManager/>}/>
        <Route path="nivel" element={<NivelCargosManager/>}/>
        <Route path="co" element={<CentroOperativoManager/>}/>
        <Route path="un" element={<UnidadNegocioManager/>}/>
        <Route path="tipocontrato" element={<TipoContratoManager/>}/>
        <Route path="tipovacante" element={<TipoVacanteManager/>}/>
        <Route path="cc" element={<CentroCostosManager/>}/>
        <Route path="proceso/cesacion" element={<CesacionStepsManager/>}/>
        <Route path="proceso/novedades" element={<NovedadesStepsManager/>}/>
        <Route path="proceso/promocion" element={<PromocionStepsManager/>}/>
        <Route path="proceso/retail" element={<RetailStepsManager/>}/>
      </Route>
      <Route path="/access" element={<GroupUsersManager/>}/>
      <Route path="/support" element={<NuevoTicketForm/>}/>
      <Route path="/requisicion" element={<RequisicionesProvider />}>
        <Route index element={<RequisicionPage />} />
        <Route path="new" element={<NewRequisicionWrapper/>}/>
      </Route>
    </Routes>
  );
}
