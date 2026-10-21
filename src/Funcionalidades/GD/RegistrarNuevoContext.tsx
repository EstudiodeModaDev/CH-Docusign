import * as React from "react";
import type { useContratos } from "./Contratos/hooks/useContratos";
import type { useHabeasData } from "./Habeas/hooks/useHabeas";
import type { usePromocion } from "./Promocion";
import type { useCesaciones } from "./Cesaciones/hooks/useCesaciones";
import type { useRetail } from "./Retail";

type RegistroPersonasContextValue = {
  searchNovedad: ReturnType<typeof useContratos>["searchRegister"];
  searchHabeas: ReturnType<typeof useHabeasData>["searchRegister"];
  searchPromocion: ReturnType<typeof usePromocion>["searchRegister"];
  searchCesacion: ReturnType<typeof useCesaciones>["searchRegister"];
  searchRetail: ReturnType<typeof useRetail>["searchRegister"];
};

const RegistroPersonasContext = React.createContext<RegistroPersonasContextValue | null>(null);

export const RegistroPersonasProvider = RegistroPersonasContext.Provider;

// eslint-disable-next-line react-refresh/only-export-components
export function useRegistroPersonasContext(): RegistroPersonasContextValue {
  const ctx = React.useContext(RegistroPersonasContext);

  if (!ctx) {
    throw new Error("useRegistroPersonasContext debe usarse dentro de RegistroPersonasProvider");
  }

  return ctx;
}
