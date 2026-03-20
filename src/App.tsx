import * as React from "react";
import "./App.css";
import { AuthProvider, useAuth } from "./auth/authProvider";
import { GraphServicesProvider, useGraphServices } from "./graph/graphContext";
import type { User } from "./models/User";
import Welcome from "./Components/Welcome/Welcome";
import { AppHeader } from "./Components/Header/Header";
import { PazSalvoPage } from "./Components/PazSalvo/PazSalvoPage";
import NuevoTicketForm from "./Components/Tickets/NuevoTicket";
import GroupUsersManager from "./Components/Security/Security";
import { PermissionsProvider, usePermissions } from "./Funcionalidades/Permisos";
import { getAppPermissionsRows, getUserGroupIds } from "./utils/security";
import type { FeatureKey } from "./models/security";
import EnviarFormatoCard from "./Components/GD/SendDocument/SendDocument";
import { ReporteFiltros } from "./Components/GD/Reports/Reports";
import { ParametrosPage } from "./Components/GD/Settings/SettingsPage";
import { ColaboradoresExplorer } from "./Components/GD/View/VieweDocument";
import RegistrarNuevoPage from "./Components/GD/RegistrarNuevo/RegistrarNuevo";
import TablaEnvios from "./Components/GD/ConsultarDocumentos/ConsultarDocumentos";
import EnvioMasivoUI from "./Components/GD/SendDocument/BulkSend/Bulk";
import RequisicionPage from "./Components/Requisiciones/RequisicionPage"


/* ================== Config del sidebar plano ================== */


  type Section = {
    id: string;
    label: string;         
    feature?: FeatureKey;           
    anyOf?: FeatureKey[];      
    element: React.ReactNode;
    icon?: React.ReactNode;
  };

const SECTIONS: Section[] = [
  { id: "nuevo", label: "Registrar Nuevo Ingreso", anyOf: ["cesaciones.view", "promociones.view", "habeas.view", "contrataciones.view", "retail.view"], element: <RegistrarNuevoPage/>, icon: 
                                                                                                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 16 16">
                                                                                                    <path fill="white" d="M7.5 4a.5.5 0 0 1 .5.5V7h2.5a.5.5 0 0 1 0 1H8v2.5a.5.5 0 0 1-1 0V8H4.5a.5.5 0 0 1 0-1H7V4.5a.5.5 0 0 1 .5-.5"/>
                                                                                                    <path fill="white" fill-rule="evenodd" d="M0 6.4c0-2.24 0-3.36.436-4.22A4.03 4.03 0 0 1 2.186.43c.856-.436 1.98-.436 4.22-.436h2.2c2.24 0 3.36 0 4.22.436c.753.383 1.36.995 1.75 1.75c.436.856.436 1.98.436 4.22v2.2c0 2.24 0 3.36-.436 4.22a4.03 4.03 0 0 1-1.75 1.75c-.856.436-1.98.436-4.22.436h-2.2c-2.24 0-3.36 0-4.22-.436a4.03 4.03 0 0 1-1.75-1.75C0 11.964 0 10.84 0 8.6zM6.4 1h2.2c1.14 0 1.93 0 2.55.051c.605.05.953.142 1.22.276a3.02 3.02 0 0 1 1.31 1.31c.134.263.226.611.276 1.22c.05.617.051 1.41.051 2.55v2.2c0 1.14 0 1.93-.051 2.55c-.05.605-.142.953-.276 1.22a3 3 0 0 1-1.31 1.31c-.263.134-.611.226-1.22.276c-.617.05-1.41.051-2.55.051H6.4c-1.14 0-1.93 0-2.55-.05c-.605-.05-.953-.143-1.22-.277a3 3 0 0 1-1.31-1.31c-.134-.263-.226-.61-.276-1.22c-.05-.617-.051-1.41-.051-2.55v-2.2c0-1.14 0-1.93.051-2.55c.05-.605.142-.953.276-1.22a3.02 3.02 0 0 1 1.31-1.31c.263-.134.611-.226 1.22-.276C4.467 1.001 5.26 1 6.4 1" clip-rule="evenodd"/>
                                                                                                  </svg>
   },
  { id: "enviar", label: "Enviar Documento", feature: "documents.send", element: <EnviarFormatoCard/>, icon: 
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24">
                                                                                              <path fill="white" d="M.292 1.665L24.002 12L.293 22.336L3.94 12L.292 1.665ZM5.708 13l-2 5.665L18.999 12L3.708 5.336l2 5.664H11v2H5.708Z"/>
                                                                                            </svg>
  },
  { id: "masivo", label: "Enviar Documentos Masivos", feature: "documents.send", element: <EnvioMasivoUI/>, icon: 
                                                                                                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24">
                                                                                                        <path fill="white" d="M.292 1.665L24.002 12L.293 22.336L3.94 12L.292 1.665ZM5.708 13l-2 5.665L18.999 12L3.708 5.336l2 5.664H11v2H5.708Z"/>
                                                                                                      </svg>
  },
  { id: "consultar",  label: "Consultar Documentos", feature: "documents.view", element: <TablaEnvios/>, icon: 
                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 21 21" fill="#000000">
                                                                                                      <g fill="none" fill-rule="evenodd" stroke="white" stroke-linecap="round" stroke-linejoin="round">
                                                                                                        <path d="M16.5 15.5v-7l-5-5h-5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zm-10-5h5m-5 2h7m-7 2h3"/>
                                                                                                        <path d="M11.5 3.5v3a2 2 0 0 0 2 2h3"/>
                                                                                                      </g>
                                                                                                    </svg> 
  },
  { id: "reportes", label: "Generar Reportes", feature: "reports.view", element: <ReporteFiltros/>, icon: 
                                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 2048 2048">
                                                                                                  <path fill="white" d="M1920 1280h-384V384h384v896zM0 1024h384v640H0v-640zm1408 512h-128v128h-256V0h384v1536zM512 384h384v1280H512V384zm1536 1280v128h-256v256h-128v-256h-256v-128h256v-256h128v256h256z"/>
                                                                                                </svg>
  },
  { id: "parametros", label: "Parametros", feature: "parametros.edit", element: <ParametrosPage/>, icon: 
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><g fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                                                                                              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                                                                                              <circle cx="12" cy="12" r="3"/>
                                                                                              </g>
                                                                                            </svg> 
  },
  { id: "security", label: "Accesos", element: <GroupUsersManager/>, feature: "acess.view", icon: 
                                                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
                                                                        <path fill="#ffffff" d="M9.993 10.573a4.5 4.5 0 1 0 0-9a4.5 4.5 0 0 0 0 9ZM10 0a6 6 0 0 1 3.04 11.174c3.688 1.11 6.458 4.218 6.955 8.078c.047.367-.226.7-.61.745c-.383.045-.733-.215-.78-.582c-.54-4.19-4.169-7.345-8.57-7.345c-4.425 0-8.101 3.161-8.64 7.345c-.047.367-.397.627-.78.582c-.384-.045-.657-.378-.61-.745c.496-3.844 3.281-6.948 6.975-8.068A6 6 0 0 1 10 0Z"/>
                                                                      </svg>
  },
  { id: "explorador", label: "Explorador de documentos", feature:"documents.explore", element: <ColaboradoresExplorer/>, icon: 
                                                                                                                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                                                                                                            <path fill="#ffffff" fill-rule="evenodd" d="M10.945 1.25h2.11c1.367 0 2.47 0 3.337.117c.9.12 1.658.38 2.26.981c.298.299.512.636.667 1.01c.932.116 1.715.372 2.333.99c.602.602.86 1.36.982 2.26c.116.867.116 1.97.116 3.337v4.11c0 1.367 0 2.47-.116 3.337c-.122.9-.38 1.658-.982 2.26c-.618.618-1.4.874-2.333.991c-.155.373-.369.71-.667 1.009c-.602.602-1.36.86-2.26.982c-.867.116-1.97.116-3.337.116h-2.11c-1.367 0-2.47 0-3.337-.116c-.9-.122-1.658-.38-2.26-.982a3.056 3.056 0 0 1-.667-1.009c-.932-.117-1.715-.373-2.333-.991c-.602-.602-.86-1.36-.981-2.26c-.117-.867-.117-1.97-.117-3.337v-4.11c0-1.367 0-2.47.117-3.337c.12-.9.38-1.658.981-2.26c.618-.618 1.4-.874 2.333-.99a3.07 3.07 0 0 1 .667-1.01c.602-.602 1.36-.86 2.26-.981c.867-.117 1.97-.117 3.337-.117ZM4.328 4.94c-.437.106-.71.26-.919.47c-.277.276-.457.664-.556 1.398c-.101.756-.103 1.757-.103 3.192v4c0 1.435.002 2.437.103 3.192c.099.734.28 1.122.556 1.399c.209.209.482.363.92.469c-.079-.812-.079-1.806-.079-3.005v-8.11c0-1.198 0-2.193.078-3.005Zm15.344 14.12c.437-.106.71-.26.919-.469c.277-.277.457-.665.556-1.4c.101-.754.103-1.755.103-3.19v-4c0-1.436-.002-2.437-.103-3.193c-.099-.734-.28-1.122-.556-1.399c-.209-.209-.482-.363-.92-.469c.079.812.079 1.807.079 3.005v8.11c0 1.198 0 2.193-.078 3.005ZM7.808 2.853c-.734.099-1.122.28-1.399.556c-.277.277-.457.665-.556 1.4C5.752 5.562 5.75 6.564 5.75 8v8c0 1.435.002 2.436.103 3.192c.099.734.28 1.122.556 1.399c.277.277.665.457 1.4.556c.754.101 1.756.103 3.191.103h2c1.435 0 2.437-.002 3.192-.103c.734-.099 1.122-.28 1.399-.556c.277-.277.457-.665.556-1.4c.101-.755.103-1.756.103-3.191V8c0-1.435-.002-2.437-.103-3.192c-.099-.734-.28-1.122-.556-1.399c-.277-.277-.665-.457-1.4-.556c-.754-.101-1.756-.103-3.191-.103h-2c-1.435 0-2.437.002-3.192.103ZM8.25 9A.75.75 0 0 1 9 8.25h6a.75.75 0 0 1 0 1.5H9A.75.75 0 0 1 8.25 9Zm0 4a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Zm0 4a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd"/>
                                                                                                                          </svg>
  },
  { id: "paz", label: "Paz y salvos", element: <PazSalvoPage/>, anyOf: ["paz.send", "paz.view", "paz.viewAll"],icon: 
                                                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                                                                                                  <path fill="#ffffff" fill-rule="evenodd" d="M10.945 1.25h2.11c1.367 0 2.47 0 3.337.117c.9.12 1.658.38 2.26.981c.298.299.512.636.667 1.01c.932.116 1.715.372 2.333.99c.602.602.86 1.36.982 2.26c.116.867.116 1.97.116 3.337v4.11c0 1.367 0 2.47-.116 3.337c-.122.9-.38 1.658-.982 2.26c-.618.618-1.4.874-2.333.991c-.155.373-.369.71-.667 1.009c-.602.602-1.36.86-2.26.982c-.867.116-1.97.116-3.337.116h-2.11c-1.367 0-2.47 0-3.337-.116c-.9-.122-1.658-.38-2.26-.982a3.056 3.056 0 0 1-.667-1.009c-.932-.117-1.715-.373-2.333-.991c-.602-.602-.86-1.36-.981-2.26c-.117-.867-.117-1.97-.117-3.337v-4.11c0-1.367 0-2.47.117-3.337c.12-.9.38-1.658.981-2.26c.618-.618 1.4-.874 2.333-.99a3.07 3.07 0 0 1 .667-1.01c.602-.602 1.36-.86 2.26-.981c.867-.117 1.97-.117 3.337-.117ZM4.328 4.94c-.437.106-.71.26-.919.47c-.277.276-.457.664-.556 1.398c-.101.756-.103 1.757-.103 3.192v4c0 1.435.002 2.437.103 3.192c.099.734.28 1.122.556 1.399c.209.209.482.363.92.469c-.079-.812-.079-1.806-.079-3.005v-8.11c0-1.198 0-2.193.078-3.005Zm15.344 14.12c.437-.106.71-.26.919-.469c.277-.277.457-.665.556-1.4c.101-.754.103-1.755.103-3.19v-4c0-1.436-.002-2.437-.103-3.193c-.099-.734-.28-1.122-.556-1.399c-.209-.209-.482-.363-.92-.469c.079.812.079 1.807.079 3.005v8.11c0 1.198 0 2.193-.078 3.005ZM7.808 2.853c-.734.099-1.122.28-1.399.556c-.277.277-.457.665-.556 1.4C5.752 5.562 5.75 6.564 5.75 8v8c0 1.435.002 2.436.103 3.192c.099.734.28 1.122.556 1.399c.277.277.665.457 1.4.556c.754.101 1.756.103 3.191.103h2c1.435 0 2.437-.002 3.192-.103c.734-.099 1.122-.28 1.399-.556c.277-.277.457-.665.556-1.4c.101-.755.103-1.756.103-3.191V8c0-1.435-.002-2.437-.103-3.192c-.099-.734-.28-1.122-.556-1.399c-.277-.277-.665-.457-1.4-.556c-.754-.101-1.756-.103-3.191-.103h-2c-1.435 0-2.437.002-3.192.103ZM8.25 9A.75.75 0 0 1 9 8.25h6a.75.75 0 0 1 0 1.5H9A.75.75 0 0 1 8.25 9Zm0 4a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Zm0 4a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd"/>
                                                                                                                </svg>
  },  
  { id: "soporte", label: "Soporte Tecnico", element: <NuevoTicketForm/>, icon: 
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                                                                              <g fill="none" fill-rule="evenodd">
                                                                                <path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/>
                                                                                <path fill="#ffffff" d="M5 11a7 7 0 0 1 14 0v2.035c1.696.243 3 1.702 3 3.465v.25A3.25 3.25 0 0 1 18.75 20A1.75 1.75 0 0 1 17 18.25V11a5 5 0 0 0-10 0v7.25A1.75 1.75 0 0 1 5.25 20A3.25 3.25 0 0 1 2 16.75v-.25a3.5 3.5 0 0 1 3-3.465V11Z"/>
                                                                              </g>
                                                                            </svg>
  },  
  { id: "requisiciones", label: "Requisiciones", element: <RequisicionPage/>, anyOf: ["requisiciones.viewAll"], icon: 
                                                                                                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 36 36" fill="#ffffff">
                                                                                                                    <g id="clarityEmployeeGroupLine0" fill="#ffffff">
                                                                                                                      <path d="M18.42 16.31a5.7 5.7 0 1 1 5.76-5.7a5.74 5.74 0 0 1-5.76 5.7Zm0-9.4a3.7 3.7 0 1 0 3.76 3.7a3.74 3.74 0 0 0-3.76-3.7Z"/>
                                                                                                                      <path d="M18.42 16.31a5.7 5.7 0 1 1 5.76-5.7a5.74 5.74 0 0 1-5.76 5.7Zm0-9.4a3.7 3.7 0 1 0 3.76 3.7a3.74 3.74 0 0 0-3.76-3.7Zm3.49 10.74a20.6 20.6 0 0 0-13 2a1.77 1.77 0 0 0-.91 1.6v3.56a1 1 0 0 0 2 0v-3.43a18.92 18.92 0 0 1 12-1.68Z"/>
                                                                                                                      <path d="M33 22h-6.7v-1.48a1 1 0 0 0-2 0V22H17a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V23a1 1 0 0 0-1-1Zm-1 10H18v-8h6.3v.41a1 1 0 0 0 2 0V24H32Z"/>
                                                                                                                      <path d="M21.81 27.42h5.96v1.4h-5.96zM10.84 12.24a18 18 0 0 0-7.95 2A1.67 1.67 0 0 0 2 15.71v3.1a1 1 0 0 0 2 0v-2.9a16 16 0 0 1 7.58-1.67a7.28 7.28 0 0 1-.74-2Zm22.27 1.99a17.8 17.8 0 0 0-7.12-2a7.46 7.46 0 0 1-.73 2A15.89 15.89 0 0 1 32 15.91v2.9a1 1 0 1 0 2 0v-3.1a1.67 1.67 0 0 0-.89-1.48Zm-22.45-3.62v-.67a3.07 3.07 0 0 1 .54-6.11a3.15 3.15 0 0 1 2.2.89a8.16 8.16 0 0 1 1.7-1.08a5.13 5.13 0 0 0-9 3.27a5.1 5.1 0 0 0 4.7 5a7.42 7.42 0 0 1-.14-1.3Zm14.11-8.78a5.17 5.17 0 0 0-3.69 1.55a7.87 7.87 0 0 1 1.9 1a3.14 3.14 0 0 1 4.93 2.52a3.09 3.09 0 0 1-1.79 2.77a7.14 7.14 0 0 1 .06.93a7.88 7.88 0 0 1-.1 1.2a5.1 5.1 0 0 0 3.83-4.9a5.12 5.12 0 0 0-5.14-5.07Z"/>
                                                                                                                    </g>
                                                                                                                  </svg>
  },  
];

/* ============================================================
   Shell: controla autenticación básica y muestra LoggedApp
   ============================================================ */
function Shell() {
  const { ready, account, signIn, signOut } = useAuth();
  const [loadingAuth, setLoadingAuth] = React.useState(false);

  const user: User = account
    ? {
        displayName: account.name ?? account.username ?? "Usuario",
        mail: account.username ?? "",
        jobTitle: "",
      }
    : null;

  const isLogged = Boolean(account);

  const handleAuthClick = async () => {
    if (!ready || loadingAuth) return;
    setLoadingAuth(true);
    try {
      if (isLogged) await signOut();
      else await signIn("popup");
    } finally {
      setLoadingAuth(false);
    }
  };

  if (!ready || !isLogged) {
    return (
      <div className="page layout">
        <section className="page-view">
          <Welcome onLogin={handleAuthClick} />
        </section>
      </div>
    );
  }

  return <LoggedApp user={user as User} />;
}

/* ============================================================
   Sidebar plano (colapsable)
   ============================================================ */

type SidebarProps = {
  sections: Section[];
  activeId: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
};

function SidebarSimple({sections, activeId, onSelect, collapsed, onToggle,}: SidebarProps) {
  return (
    <aside
      className={`gd-sidebar ${collapsed ? "gd-sidebar--collapsed" : ""}`}
    >
      <div className="gd-sidebar__header">
        <button
          type="button"
          className="gd-sidebar__toggle"
          onClick={onToggle}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="gd-sidebar__nav">
        {sections.map((s) => {
          const active = s.id === activeId;
          return (
            <button
              key={s.id}
              className={`gd-sidebar__item ${
                active ? "is-active" : ""
              } ${collapsed ? "is-compact" : ""}`}
              onClick={() => onSelect(s.id)}
            >
              <span className="gd-sidebar__icon" aria-hidden="true">
                {s.icon ?? "•"}
              </span>
              {/* podrías meter un icono aquí si quieres */}
              <span className="gd-sidebar__label">{s.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}


function LoggedApp({ user }: { user: User }) {
  // ✅ hooks SIEMPRE arriba
  const { engine, loading } = usePermissions(); // o { loading, engine } según tu provider
  const [activeId, setActiveId] = React.useState<string>("nuevo");
  const [collapsed, setCollapsed] = React.useState(false);

  // ✅ filtrar SECTIONS según permisos (sin condicionar hooks)
  const allowedSections = React.useMemo(() => {
    if (loading) return []; // mientras carga, mejor no mostrar menú
    return SECTIONS.filter((s) => {
      if (s.feature) return engine.can(s.feature);
      if (s.anyOf?.length) return engine.canAny(...s.anyOf);
      return true; // sin feature => visible
    });
  }, [engine, loading]);

  // ✅ mantener activeId válido cuando cambian permisos
  React.useEffect(() => {
    if (!allowedSections.length) return;
    if (!allowedSections.some((s) => s.id === activeId)) {
      setActiveId(allowedSections[0].id);
    }
  }, [allowedSections, activeId]);

  const activeSection =
    allowedSections.find((s) => s.id === activeId) ?? allowedSections[0];

  // ✅ ahora sí puedes condicionar render (después de hooks)
  if (loading) {
    return <div style={{ padding: 24 }}>Cargando permisos...</div>;
  }

  if (!allowedSections.length) {
    return <div style={{ padding: 24 }}>No tienes permisos para ver módulos.</div>;
  }

  return (
    <div className={`gd-layout ${collapsed ? "is-collapsed" : ""}`}>
      <SidebarSimple
        sections={allowedSections}
        activeId={activeSection?.id ?? ""}
        onSelect={setActiveId}
        collapsed={collapsed}
        onToggle={() => setCollapsed((p) => !p)}
      />

      <main className="gd-main">
        <AppHeader
          title={"Gestor Digital Capital Humano"}
          userName={user?.displayName ?? ""}
          userRole={""}
          avatarUrl={""}
          mail={user?.mail ?? ""}
        />

        <section className="gd-content">
          {activeSection?.element ?? null}
        </section>
      </main>
    </div>
  );
}

/* ============================================================
   App root y gate de servicios
   ============================================================ */

export default function App() {
  return (
    <AuthProvider>
      <GraphServicesGate>
        <ShellWithPerms />
      </GraphServicesGate>
    </AuthProvider>
  );
}
function GraphServicesGate({ children }: { children: React.ReactNode }) {
  const { ready, account } = useAuth();
  if (!ready || !account) return <>{children}</>;
  return <GraphServicesProvider>{children}</GraphServicesProvider>;
}

function ShellWithPerms() {
  const { account } = useAuth();

  // ✅ Si no hay sesión, NO montes permisos (Shell muestra Welcome)
  if (!account) return <Shell />;

  // ✅ Ya hay sesión => GraphServicesProvider está montado por el gate
  return <AuthedPermsShell />;
}

function AuthedPermsShell() {
  const { graph, MatrizPermisos } = useGraphServices();

  return (
    <PermissionsProvider
      deps={{
        getMyGroupIds: () => getUserGroupIds(graph),
        getAppPermissionsRows: () => getAppPermissionsRows(MatrizPermisos),
      }}
    >
      <Shell />
    </PermissionsProvider>
  );
}
