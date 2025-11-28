// src/Funcionalidades/Users.ts (o donde lo tengas)
import * as React from "react";
import { resolveUserRole, type GroupRule } from "../utils/roles";
import { useGraphServices } from "../graph/graphContext";

type UseRoleOpts =
  | { singleGroup: { groupId: string; role: string }; groupRules?: never }
  | { groupRules: GroupRule[]; singleGroup?: never }
  | { singleGroup?: never; groupRules?: never };

// Tipo de permisos según tu objeto perfil
export type Permisos = {
  send: boolean;
  seguimiento: boolean;
  reportes: boolean;
  parametros: boolean;
  permisos: boolean;
  interfaz: boolean;
  features: boolean;
};

// La decisión ahora puede traer permisos
type RoleDecision = {
  role: string;
  source: "default" | "usuarios" | "group" | "manual-toggle" | string;
  permisos?: Partial<Permisos>;
};

const DEFAULT_ROLE = "Usuario";

const DEFAULT_PERMISOS: Permisos = {
  send: false,
  seguimiento: false,
  reportes: false,
  parametros: false,
  permisos: false,
  interfaz: false,
  features: false,
};

export function useUserRole(email?: string | null) {
  const opts: UseRoleOpts = {
    groupRules: [],
  };

  const { Usuarios, Graph, Perfiles } = useGraphServices() as {
    Usuarios: any;
    Graph?: any;
    Perfiles: any;
  };

  const [role, setRole] = React.useState<string>(DEFAULT_ROLE);
  const [source, setSource] = React.useState<RoleDecision["source"]>("default");
  const [permisos, setPermisos] = React.useState<Permisos>(DEFAULT_PERMISOS);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancel = false;

    (async () => {
      const safeEmail = String(email ?? "").trim().toLowerCase();
      if (!safeEmail) {
        if (!cancel) {
          setRole(DEFAULT_ROLE);
          setSource("default");
          setPermisos(DEFAULT_PERMISOS);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const decision = (await resolveUserRole({
          graph: Graph,
          usuariosSvc: Usuarios,
          email: safeEmail,
          defaultRole: DEFAULT_ROLE,
          PerfilService: Perfiles,
          ...(opts.groupRules ? { groupRules: opts.groupRules } : {}),
        })) as RoleDecision;

        if (!cancel) {
          setRole(decision.role);
          setSource(decision.source);

          // 👇 Mezclamos lo que venga de resolveUserRole con los defaults
          const incoming = decision.permisos ?? {};
          setPermisos({
            ...DEFAULT_PERMISOS,
            ...incoming,
          });
        }
      } catch (e: any) {
        if (!cancel) {
          setRole(DEFAULT_ROLE);
          setSource("default");
          setPermisos(DEFAULT_PERMISOS);
          setError(e?.message ?? "No fue posible determinar el rol");
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [email, Usuarios, Graph, Perfiles, JSON.stringify(opts)]);

  /** Alterna entre "Usuario" y "Administrador" sin I/O */
  const changeUser = React.useCallback(() => {
    setRole((prev) => (prev === "Administrador" ? "Usuario" : "Administrador"));
    setSource("manual-toggle");
    setLoading(false);
    setError(null);
    // aquí podrías cambiar permisos "fake" si quieres,
    // pero por ahora dejamos los reales que vinieron de SP
  }, []);

  return { role, source, permisos, loading, error, changeUser };
}
