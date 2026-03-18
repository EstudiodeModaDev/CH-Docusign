import React from "react";
import type { DateRange, SortDir, SortField } from "../../../../models/Commons";
import { createDefaultRange } from "../../../Common/Defaults";
;

export function useCargoCiudadAnalistaFilters() {
  const [range, setRange] = React.useState<DateRange>(createDefaultRange());
  const [pageSize, setPageSize] = React.useState<number>(10);
  const [sorts, setSorts] = React.useState<Array<{ field: SortField; dir: SortDir }>>([{ field: "id", dir: "desc" },]);
  const [search, setSearch] = React.useState<string>("");
  const [estado, setEstado] = React.useState<string>("todos");

  return {
    range,
    setRange,
    pageSize,
    setPageSize,
    sorts,
    setSorts,
    search,
    setSearch,
    estado,
    setEstado,
  };
}