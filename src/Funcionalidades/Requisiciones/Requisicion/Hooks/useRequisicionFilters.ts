import React from "react";
import { usePermissions } from "../../../Permisos";
import type { GetAllOpts, SortDir, SortField } from "../../../../models/Commons";
import { useAuth } from "../../../../auth/authProvider";
import { useDebouncedValue } from "../../../Common/debounce";
import { esc } from "../../../../utils/text";
import { mapSortField } from "../utils/sorts";

export function useRequisicionFilters(pageSize: number) {
  const { engine, loading: loadingPerms } = usePermissions();
  const [sorts, setSorts] = React.useState<Array<{ field: SortField; dir: SortDir }>>([{ field: "id", dir: "desc" }]);

  const [mes, setMes] = React.useState<string>("");
  const [search, setSearch] = React.useState<string>("");
  const [estado, setEstado] = React.useState<string>("");
  const [cargo, setCargo] = React.useState<string>("");
  const [anio, setAnio] = React.useState<string>("2026");
  const [cumpleANS, setCumpleANS] = React.useState<string>("all");
  const [ciudad, setCiudad] = React.useState<string>("all");
  const [analista, setAnalista] = React.useState<string>("all");
  const { account } = useAuth();

  const debouncedSearch = useDebouncedValue(search, 250);
  const canViewAll = engine.can("requisiciones.viewAll");

  const securityFilter = React.useMemo(() => {
    if (loadingPerms) return "";
    if (!account?.username) return "";
    if (canViewAll) return "";
    return `fields/correoSolicitante eq '${esc(account.username)}' or fields/correoProfesional eq '${esc(account.username)}'`;
  }, [loadingPerms, canViewAll, account?.username]);

  const orderby =
    sorts.length > 0
      ? sorts.map((s) => `${mapSortField(s.field)} ${s.dir}`).join(",")
      : "fields/Created desc";

  const buildFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];
    const trimmedSearch = debouncedSearch.trim();

    if (estado && estado !== "all") filters.push(`fields/Estado eq '${estado}'`);
    if (cargo && cargo !== "all") filters.push(`fields/Title eq '${cargo}'`);
    if (cumpleANS && cumpleANS !== "all") filters.push(`fields/cumpleANS eq '${cumpleANS}'`);
    if (ciudad && ciudad !== "all") filters.push(`fields/Ciudad eq '${ciudad}'`);
    if (analista && analista !== "all") filters.push(`fields/nombreProfesional eq '${analista}'`);

    if (anio && anio !== "all") {
      const y = Number(anio);
      const from = `${y}-01-01T00:00:00Z`;
      const toExclusive = `${y + 1}-01-01T00:00:00Z`;
      filters.push(`fields/Created ge '${from}'`);
      filters.push(`fields/Created lt '${toExclusive}'`);
    }

    if (securityFilter) filters.push(securityFilter);

    if (trimmedSearch) {
      const numericId = Number(trimmedSearch);
      if (!Number.isNaN(numericId)) {
        filters.push(`id eq ${numericId}`);
      }
    }

    if (mes) {
      const { from, toExclusive } = buildUtcMonthRange(mes);
      filters.push(`fields/fechaInicioProceso ge '${from}'`);
      filters.push(`fields/fechaInicioProceso lt '${toExclusive}'`);
    }

    return {
      filter: filters.length ? filters.join(" and ") : undefined,
      orderby,
      top: pageSize,
    };
  }, [estado, cargo, cumpleANS, ciudad, analista, anio, securityFilter, debouncedSearch, mes, pageSize, orderby]);

  return {
    buildFilter,
    mes,
    search,
    sorts,
    estado,
    cargo,
    cumpleANS,
    ciudad,
    analista,
    anio,
    setMes,
    setAnio,
    setAnalista,
    setCargo,
    setSearch,
    setSorts,
    setCiudad,
    setCumpleANS,
    setEstado,
  };
}

function buildUtcMonthRange(monthValue: string) {
  const [yearStr, monthStr] = monthValue.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return {
      from: "",
      toExclusive: "",
    };
  }

  const from = `${yearStr}-${monthStr}-01T00:00:00Z`;
  const nextMonth = new Date(Date.UTC(year, month, 1));

  return {
    from,
    toExclusive: nextMonth.toISOString(),
  };
}
