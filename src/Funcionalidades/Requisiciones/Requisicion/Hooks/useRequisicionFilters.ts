import React from "react";
import { usePermissions } from "../../../Permisos";
import type { DateRange, GetAllOpts, SortDir, SortField } from "../../../../models/Commons";
import { useAuth } from "../../../../auth/authProvider";
import { useDebouncedValue } from "../../../Common/debounce";
import { esc } from "../../../../utils/text";
import { mapSortField } from "../utils/sorts";

export function useRequisicionFilters(pageSize: number) {
  
  const { engine, loading: loadingPerms } = usePermissions();
  const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);

  const [range, setRange] = React.useState<DateRange>({from: "", to: ""});
  const [search, setSearch] = React.useState<string>("");
  const [estado, setEstado] = React.useState<string>("all");
  const [cargo, setCargo] = React.useState<string>("all");
  const [año, setAño] = React.useState<string>("2026");
  const [cumpleANS, setCumpleANS] = React.useState<string>("all");
  const [ciudad, setCiudad] = React.useState<string>("all");
  const [analista, setAnalista] = React.useState<string>("all");
  const {account} = useAuth()

  const debouncedSearch = useDebouncedValue(search, 250);
  const canViewAll = engine.can("requisiciones.viewAll")

  const securityFilter = React.useMemo(() => {
    if (loadingPerms) return "";        
    if (!account?.username) return "";            
    if (canViewAll) return "";         
    return `fields/correoSolicitante eq '${esc(account?.username)}'`; 
  }, [loadingPerms, canViewAll, account?.username]);

  const orderby =
  sorts.length > 0
    ? sorts
        .map((s) => `${mapSortField(s.field)} ${s.dir}`)
        .join(",")
    : "fields/Created desc";

 const buildFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];
    const trimmedSearch = debouncedSearch.trim();

    if (estado && estado !== "all") filters.push(`fields/Estado eq '${estado}'`);
    if (cargo && cargo !== "all") filters.push(`fields/Title eq '${cargo}'`);
    if (cumpleANS && cumpleANS !== "all") filters.push(`fields/cumpleANS eq '${cumpleANS}'`);
    if (ciudad && ciudad !== "all") filters.push(`fields/Ciudad eq '${ciudad}'`);
    if (analista && analista !== "all") filters.push(`fields/nombreProfesional eq '${analista}'`);
    if (año && año !== "all") {
      const y = Number(año);
      const from = `${y}-01-01T00:00:00Z`;
      const toExclusive = `${y + 1}-01-01T00:00:00Z`;
      filters.push(`fields/Created ge '${from}'`);
      filters.push(`fields/Created lt '${toExclusive}'`);
    }
    if(securityFilter) filters.push(securityFilter)
    
    if (trimmedSearch) {
      const numericId = Number(trimmedSearch);
      if (!Number.isNaN(numericId)) {
        filters.push(`id eq ${numericId}`);
      }
    }

    if (range.from && range.to && range.from <= range.to) {
      filters.push(`fields/Created ge '${range.from}T00:00:00Z'`);
      filters.push(`fields/Created le '${range.to}T23:59:59Z'`);
    }

    console.warn(filters.join(" and "))

    return {
      filter: filters.length ? filters.join(" and ") : undefined,
      orderby,
      top: pageSize,
    };
  }, [estado, range.from, range.to, cargo, cumpleANS, ciudad, analista, año, securityFilter, debouncedSearch, pageSize, orderby]);


  return {
    buildFilter, range, search, sorts, estado, cargo, cumpleANS, ciudad, analista, año,
    setAño, setAnalista, setCargo, setRange, setSearch, setSorts,  setCiudad, setCumpleANS, setEstado,
  };
}



