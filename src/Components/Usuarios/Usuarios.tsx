import * as React from "react";
import "../Settings/SettingsPage.css";
import { ParamTabs } from "../Settings/SettingsPage";

export type ParamTab = {
  id: string;
  label: string;
};

;
const TABS = [
  { id: "perfiles", label: "Perfiles" },
  { id: "usuarios", label: "Usuarios" },
];

export const UsuariosPage: React.FC = () => {
  const [active, setActive] = React.useState<string>("empresas");

  return (
    <section>
      <ParamTabs tabs={TABS} value={active} onChange={setActive} />

      {/* aquí renderizas según la pestaña */}

    </section>
  );
};
