import React from "react";
import type { GraphUserLite } from "../graph/graphRest";
import { useCoreGraphServices } from "../graph/graphContext";
import type { GroupOption } from "../utils/security";


type MembersResponse = {
  value: GraphUserLite[];
  "@odata.nextLink"?: string;
};

const EXCLUDED_SYNC_TERMS = [
  "facturacion",
  "integracion", 
  "facturas",
  "test", 
  "diesel", 
  "kipling", 
  "pilatos", 
  "superdry", 
  "new balance", 
  "newbalance", 
  "parqueadero", 
  "mfg",
  "prueba",
  "e-global",
  "movivisual",
  "replaycol",
  "gmail",
  "virtualconfe",
  "crm",
  "fupbi",
  "bdo",
  "grupo-exito",
  "hacku",
  "brokenchains",
  "styleink",
  "1beat",
  "prevalentware",
  "onebeat",
  "mtagraphics",
  "lehablamaria",
  "solucionesbpo",
  "arkia",
  "movivisual",
  "parking",
  "parkin",
  "creditotucuota"
];

function isExcludedFromSync(user: GraphUserLite): boolean {
  const haystack = [user.displayName, user.mail, user.userPrincipalName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return EXCLUDED_SYNC_TERMS.some((term) => haystack.includes(term));
}

function buildMemberSearchFilter(term: string): string {
  const escaped = term.trim().replace(/'/g, "''");
  return ["displayName", "mail", "userPrincipalName"]
    .map((prop) => `startswith(${prop},'${escaped}')`)
    .join(" or ");
}

const PAGE_SIZE = 50;

export function useSecurity(groups: GroupOption[]) {
  const { graph } = useCoreGraphServices();

  const initialGroup = React.useMemo(() => {
    if (!groups?.length) return null;
    return groups.find((g) => g.key === "seleccion") ?? groups[0];
  }, [groups]);

  const [selectedKey, setSelectedKey] = React.useState<string>(initialGroup?.key ?? "");
  const [users, setUsers] = React.useState<GraphUserLite[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [nextLink, setNextLink] = React.useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [addEmail, setAddEmail] = React.useState("");
  const [addBusy, setAddBusy] = React.useState(false);

  const [syncing, setSyncing] = React.useState(false);
  const [syncProgress, setSyncProgress] = React.useState<{
    processed: number;
    added: number;
    failed: number;
    total: number;
  } | null>(null);
  const [syncSummary, setSyncSummary] = React.useState<{
    added: number;
    skipped: number;
    failed: number;
    total: number;
  } | null>(null);

  const selectedGroup = React.useMemo(
    () => groups.find((g) => g.key === selectedKey) ?? null,
    [groups, selectedKey]
  );

  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(handle);
  }, [search]);

  // El filtrado se hace en el servidor (Graph), así que no hace falta filtrar de nuevo en el cliente.
  const filteredUsers = users;

  // Cuántos usuarios había cargado el usuario (página inicial + "Cargar más" acumulados).
  // Se usa para restaurar la misma cantidad tras un reload silencioso (ej. después de eliminar).
  const loadedTargetRef = React.useRef(PAGE_SIZE);

  const fetchFirstPage = React.useCallback(async (): Promise<{ items: GraphUserLite[]; nextLink: string | null }> => {
    if (!selectedGroup?.groupId) return { items: [], nextLink: null };

    const term = debouncedSearch;
    const path = term
      ? `/groups/${selectedGroup.groupId}/members/microsoft.graph.user?$select=id,displayName,mail,userPrincipalName&$top=${PAGE_SIZE}&$count=true&$filter=${encodeURIComponent(buildMemberSearchFilter(term))}`
      : `/groups/${selectedGroup.groupId}/members?$select=id,displayName,mail,userPrincipalName&$top=${PAGE_SIZE}`;

    const res = await graph.get<MembersResponse>(path, { headers: { ConsistencyLevel: "eventual" } });
    return { items: res?.value ?? [], nextLink: res?.["@odata.nextLink"] ?? null };
  }, [graph, selectedGroup?.groupId, debouncedSearch]);

  const fetchNextPage = React.useCallback(async (link: string): Promise<{ items: GraphUserLite[]; nextLink: string | null }> => {
    const res = await graph.getAbsolute<MembersResponse>(link, { headers: { ConsistencyLevel: "eventual" } });
    return { items: res?.value ?? [], nextLink: res?.["@odata.nextLink"] ?? null };
  }, [graph]);

  const loadFirstPage = React.useCallback(async () => {
    if (!selectedGroup?.groupId) return;

    setLoading(true);
    setError(null);
    setUsers([]);
    setNextLink(null);
    loadedTargetRef.current = PAGE_SIZE;

    try {
      const { items, nextLink } = await fetchFirstPage();
      setUsers(items);
      setNextLink(nextLink);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [selectedGroup?.groupId, fetchFirstPage]);

  const loadMore = React.useCallback(async () => {
    if (!nextLink) return;

    setLoading(true);
    setError(null);

    try {
      const { items, nextLink: next } = await fetchNextPage(nextLink);
      setUsers((prev) => {
        const merged = [...prev, ...items];
        loadedTargetRef.current = merged.length;
        return merged;
      });
      setNextLink(next);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [nextLink, fetchNextPage]);

  // Recarga desde la página 1 pero sigue paginando hasta recuperar la misma cantidad
  // de usuarios que ya se tenían cargados (en vez de colapsar todo a la primera página).
  const reloadPreservingLimit = React.useCallback(async () => {
    if (!selectedGroup?.groupId) return;

    const target = loadedTargetRef.current;

    setLoading(true);
    setError(null);

    try {
      let { items: accumulated, nextLink: next } = await fetchFirstPage();

      while (accumulated.length < target && next) {
        const page = await fetchNextPage(next);
        accumulated = [...accumulated, ...page.items];
        next = page.nextLink;
      }

      setUsers(accumulated);
      setNextLink(next);
      loadedTargetRef.current = Math.max(PAGE_SIZE, accumulated.length);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [selectedGroup?.groupId, fetchFirstPage, fetchNextPage]);

  React.useEffect(() => {
    if (!selectedGroup?.groupId) return;
    void loadFirstPage();
  }, [selectedGroup?.groupId, debouncedSearch, loadFirstPage]);

  const handleAdd = React.useCallback(async () => {
    if (!selectedGroup?.groupId) return;

    const email = addEmail.trim();
    if (!email) return;

    setAddBusy(true);
    setError(null);

    try {
      await graph.addUserToGroup(selectedGroup.groupId, email);
      setIsAddOpen(false);
      setAddEmail("");
      await reloadPreservingLimit();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setAddBusy(false);
    }
  }, [graph, selectedGroup?.groupId, addEmail, reloadPreservingLimit]);

  const handleRemove = React.useCallback(
    async (user: GraphUserLite) => {
      if (!selectedGroup?.groupId) return;

      const label = user.mail ?? user.userPrincipalName ?? user.displayName ?? user.id;
      const ok = window.confirm(`¿Quitar del grupo a: ${label}?`);
      if (!ok) return;

      setLoading(true);
      setError(null);

      try {
        const email = (user.mail ?? user.userPrincipalName ?? "").trim();
        if (!email) {
          throw new Error("Este usuario no tiene mail o UPN para remover.");
        }

        await graph.removeUserFromGroup(selectedGroup.groupId, email);
        await reloadPreservingLimit();
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    },
    [graph, selectedGroup?.groupId, reloadPreservingLimit]
  );

  const syncActiveUsers = React.useCallback(async () => {
    if (!selectedGroup?.groupId) return;

    setSyncing(true);
    setError(null);
    setSyncSummary(null);

    try {
      const [activeUsersRaw, currentMembers] = await Promise.all([
        graph.getAllActiveUsers(),
        graph.getAllGroupMembers(selectedGroup.groupId),
      ]);

      const activeUsers = activeUsersRaw.filter((u) => !isExcludedFromSync(u));

      const memberIds = new Set(currentMembers.map((m) => m.id));
      const total = activeUsers.length;

      let processed = 0;
      let added = 0;
      let failed = 0;

      setSyncProgress({ processed, added, failed, total });

      for (const user of activeUsers) {
        if (!memberIds.has(user.id)) {
          try {
            await graph.addUserIdToGroup(selectedGroup.groupId, user.id);
            memberIds.add(user.id);
            added += 1;
          } catch {
            failed += 1;
          }
        }

        processed += 1;
        setSyncProgress({ processed, added, failed, total });
      }

      setSyncSummary({ added, skipped: total - added - failed, failed, total });
      await loadFirstPage();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSyncing(false);
    }
  }, [graph, selectedGroup?.groupId, loadFirstPage]);

  return {
    selectedKey,
    setSelectedKey,
    selectedGroup,

    users,
    filteredUsers,

    search,
    setSearch,

    loading,
    error,

    loadFirstPage,
    loadMore,
    nextLink,

    isAddOpen,
    setIsAddOpen,
    addEmail,
    setAddEmail,
    addBusy,
    handleAdd,
    handleRemove,

    syncing,
    syncProgress,
    syncSummary,
    syncActiveUsers,
  };
}