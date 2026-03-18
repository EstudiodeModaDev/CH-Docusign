import React from "react";
import type { GraphUserLite } from "../graph/graphRest";
import { useGraphServices } from "../graph/graphContext";
import type { GroupOption } from "../utils/security";


type MembersResponse = {
  value: GraphUserLite[];
  "@odata.nextLink"?: string;
};

export function useSecurity(groups: GroupOption[]) {
  const { graph } = useGraphServices();

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

  const selectedGroup = React.useMemo(
    () => groups.find((g) => g.key === selectedKey) ?? null,
    [groups, selectedKey]
  );

  const filteredUsers = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter((u) =>
      (u.displayName ?? "").toLowerCase().includes(term) ||
      (u.mail ?? "").toLowerCase().includes(term) ||
      (u.userPrincipalName ?? "").toLowerCase().includes(term)
    );
  }, [users, search]);

  const loadFirstPage = React.useCallback(async () => {
    if (!selectedGroup?.groupId) return;

    setLoading(true);
    setError(null);
    setUsers([]);
    setNextLink(null);

    try {
      const res = await graph.get<MembersResponse>(
        `/groups/${selectedGroup.groupId}/members?$select=id,displayName,mail,userPrincipalName&$top=50`
      );

      setUsers(res?.value ?? []);
      setNextLink(res?.["@odata.nextLink"] ?? null);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [graph, selectedGroup?.groupId]);

  const loadMore = React.useCallback(async () => {
    if (!nextLink) return;

    setLoading(true);
    setError(null);

    try {
      const res = await graph.getAbsolute<MembersResponse>(nextLink);
      setUsers((prev) => [...prev, ...(res?.value ?? [])]);
      setNextLink(res?.["@odata.nextLink"] ?? null);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [graph, nextLink]);

  React.useEffect(() => {
    if (!selectedGroup?.groupId) return;
    void loadFirstPage();
  }, [selectedGroup?.groupId, loadFirstPage]);

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
      await loadFirstPage();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setAddBusy(false);
    }
  }, [graph, selectedGroup?.groupId, addEmail, loadFirstPage]);

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
        await loadFirstPage();
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    },
    [graph, selectedGroup?.groupId, loadFirstPage]
  );

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
  };
}