import * as React from "react";
import { useAuth } from "../auth/authProvider";
import { GraphRest } from "./graphRest";
import { buildGraphDomainServices } from "./graphDomains";
import type {
  CoreServices,
  GestorServices,
  PazSalvoServices,
  RequisicionesServices,
} from "./graphDomains";
import { mergeGraphConfig } from "./graphConfig";
import type { UnifiedConfig } from "./graphConfig";

const CoreGraphServicesContext = React.createContext<CoreServices | null>(null);
const GestorServicesContext = React.createContext<GestorServices | null>(null);
const PazSalvoServicesContext = React.createContext<PazSalvoServices | null>(null);
const RequisicionesServicesContext = React.createContext<RequisicionesServices | null>(null);

type ProviderProps = {
  children: React.ReactNode;
  config?: Partial<UnifiedConfig>;
};

export const GraphServicesProvider: React.FC<ProviderProps> = ({ children, config }) => {
  const { getToken } = useAuth();

  const cfg = React.useMemo(() => mergeGraphConfig(config), [config]);
  const graph = React.useMemo(() => new GraphRest(getToken), [getToken]);
  const domains = React.useMemo(() => buildGraphDomainServices(cfg, graph), [cfg, graph]);

  return (
      <CoreGraphServicesContext.Provider value={domains.core}>
        <GestorServicesContext.Provider value={domains.gestor}>
          <PazSalvoServicesContext.Provider value={domains.pazSalvo}>
            <RequisicionesServicesContext.Provider value={domains.requisiciones}>
              {children}
            </RequisicionesServicesContext.Provider>
          </PazSalvoServicesContext.Provider>
        </GestorServicesContext.Provider>
      </CoreGraphServicesContext.Provider>
  );
};

export function useCoreGraphServices(): CoreServices {
  const ctx = React.useContext(CoreGraphServicesContext);
  if (!ctx) throw new Error("useCoreGraphServices debe usarse dentro de <GraphServicesProvider>.");
  return ctx;
}

export function useGestorServices(): GestorServices {
  const ctx = React.useContext(GestorServicesContext);
  if (!ctx) throw new Error("useGestorServices debe usarse dentro de <GraphServicesProvider>.");
  return ctx;
}

export function usePazSalvoServices(): PazSalvoServices {
  const ctx = React.useContext(PazSalvoServicesContext);
  if (!ctx) throw new Error("usePazSalvoServices debe usarse dentro de <GraphServicesProvider>.");
  return ctx;
}

export function useRequisicionesServices(): RequisicionesServices {
  const ctx = React.useContext(RequisicionesServicesContext);
  if (!ctx) throw new Error("useRequisicionesServices debe usarse dentro de <GraphServicesProvider>.");
  return ctx;
}

export type {
  CoreServices,
  GestorServices,
  GraphServices,
  PazSalvoServices,
  RequisicionesServices,
} from "./graphDomains";
export type { SiteConfig, UnifiedConfig } from "./graphConfig";
