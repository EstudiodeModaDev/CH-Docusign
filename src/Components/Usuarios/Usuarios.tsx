import * as React from "react";
import { ParamTabs } from "../GD/Settings/Tabs";
import type { ParamTab } from "../../models/Props";

const TABS: ParamTab[] = [
  { id: "perfiles", label: "Perfiles" },
  { id: "usuarios", label: "Usuarios" },
];

export const UsuariosPage: React.FC = () => {
  const [active, setActive] = React.useState<string>("perfiles");

  return (
    <section>
      <ParamTabs tabs={TABS} value={active} onChange={setActive} />

      {/* aquí renderizas según la pestaña */}

    </section>
  );
};
