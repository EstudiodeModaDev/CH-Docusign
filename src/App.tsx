import * as React from "react";
import "./App.css";
import { AuthProvider, useAuth } from "./auth/authProvider";
import { GraphServicesProvider, useCoreGraphServices,  } from "./graph/graphContext";
import type { User } from "./models/User";
import Welcome from "./Components/Welcome/Welcome";
import { AppHeader } from "./Components/Header/Header";
import { PermissionsProvider, usePermissions } from "./Funcionalidades/Permisos";
import { getAppPermissionsRows, getUserGroupIds } from "./utils/security";
import type { FeatureKey } from "./models/security";
import { SidebarSimple } from "./Components/Sidebar/Sidebar";
import AppRoutes from "./Routes";
import { useLocation, useNavigate } from "react-router-dom"
import { SECTIONS } from "./consts/sidebar";


/* ================== Config del sidebar plano ================== */

export type Section = {
    id: string;
    label: string;         
    feature?: FeatureKey;           
    anyOf?: FeatureKey[];      
    to?: string;
    icon?: React.ReactNode;
  };


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


function LoggedApp({ user }: { user: User }) {
  const { engine, loading } = usePermissions();
  const [collapsed, setCollapsed] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const allowedSections = React.useMemo(() => {
    if (loading) return [];
    return SECTIONS.filter((s) => {
      if (s.feature) return engine.can(s.feature);
      if (s.anyOf?.length) return engine.canAny(...s.anyOf);
      return true;
    });
  }, [engine, loading]);

  const firstAllowedRoute = allowedSections[0]?.to;

  React.useEffect(() => {
    if (loading || !firstAllowedRoute) return;

    const currentAllowed = allowedSections.some((s) => {
      if (!s.to) return false;
      return location.pathname === s.to || location.pathname.startsWith(`${s.to}/`);
    });

    if (location.pathname === "/" || !currentAllowed) {
      navigate(firstAllowedRoute, { replace: true });
    }
  }, [loading, firstAllowedRoute, allowedSections, location.pathname, navigate]);

  if (loading) return <div style={{ padding: 24 }}>Cargando permisos...</div>;
  if (!allowedSections.length) return <div style={{ padding: 24 }}>No tienes permisos para ver módulos.</div>;

  const activeSection =
    allowedSections.find((s) =>
      s.to ? location.pathname === s.to || location.pathname.startsWith(`${s.to}/`) : false
    ) ?? allowedSections[0];

  return (
    <div className={`gd-layout ${collapsed ? "is-collapsed" : ""}`}>
      <SidebarSimple
        sections={allowedSections}
        activeId={activeSection?.id ?? ""}
        onSelect={(id) => {
          const section = allowedSections.find((s) => s.id === id);
          if (section?.to) navigate(section.to);
        }}
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
          <AppRoutes />
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
  const { graph, MatrizPermisos } = useCoreGraphServices();

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
