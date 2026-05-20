import * as React from "react";
import RequisicionesMetricasPage from "../../Components/Requisiciones/Metricas/RequisicionesMetricas";
import { useCargo, useDeptosMunicipios, useDireccion } from "../../Funcionalidades/Desplegables";
import { useRequisicionesContext } from "../../Funcionalidades/Requisiciones/RequisicionesContext";
import { useRequisicionesMetrics } from "../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";
import { useGraphServices } from "../../graph/graphContext";
import type { desplegablesOption } from "../../models/Desplegables";
import type { requisiciones } from "../../models/Requisiciones/requisiciones";

const ALL_OPTION: desplegablesOption = { value: "all", label: "*Todos*" };
const ALL_FEMALE_OPTION: desplegablesOption = { value: "all", label: "*Todas*" };

export default function RequisicionesMetricasWrapper() {
  const requisicionesController = useRequisicionesContext();
  const { Maestro, DeptosYMunicipios, requisiciones } = useGraphServices();
  const { options: cargoOptions, reload: reloadCargo } = useCargo(Maestro);
  const { options: ciudadOptions, reload: reloadCiudades } = useDeptosMunicipios(DeptosYMunicipios);
  const { options: direccionOptions, reload: reloadDirecciones } = useDireccion(Maestro);

  const [direccion, setDireccion] = React.useState<string>("all");
  const [metricsRows, setMetricsRows] = React.useState<requisiciones[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    reloadCargo();
    reloadCiudades();
    reloadDirecciones();
  }, [reloadCargo, reloadCiudades, reloadDirecciones]);

  const loadMetricsRows = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const base = requisicionesController.buildFilter();
      const firstPage = await requisiciones.getAll({
        filter: base.filter,
        orderby: base.orderby,
        top: 500,
      });

      const allRows = [...(firstPage.items ?? [])];
      let nextLink = firstPage.nextLink;

      while (nextLink) {
        const nextPage = await requisiciones.getByNextLink(nextLink);
        allRows.push(...(nextPage.items ?? []));
        nextLink = nextPage.nextLink;
      }

      setMetricsRows(allRows);
    } catch (e: any) {
      setError(e?.message ?? "No fue posible cargar las métricas de requisiciones.");
      setMetricsRows([]);
    } finally {
      setLoading(false);
    }
  }, [requisicionesController.buildFilter, requisiciones]);

  React.useEffect(() => {
    loadMetricsRows();
  }, [loadMetricsRows]);

  const analistaOptions = React.useMemo<desplegablesOption[]>(() => {
    const seen = new Set<string>();
    const options: desplegablesOption[] = [];

    metricsRows.forEach((row) => {
      const name = String(row.nombreProfesional ?? "").trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      options.push({ value: name, label: name });
    });

    return options.sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [metricsRows]);

  const yearOptions = React.useMemo<desplegablesOption[]>(() => {
    const seen = new Set<string>();
    const years: desplegablesOption[] = [{ value: "all", label: "*Todos*" }];

    metricsRows.forEach((row) => {
      const raw = row.fechaInicioProceso;
      if (!raw) return;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return;

      const year = String(date.getFullYear());
      if (seen.has(year)) return;
      seen.add(year);
      years.push({ value: year, label: year });
    });

    if (requisicionesController.anio && requisicionesController.anio !== "all" && !seen.has(requisicionesController.anio)) {
      years.push({ value: requisicionesController.anio, label: requisicionesController.anio });
    }

    return years.sort((a, b) => {
      if (a.value === "all") return -1;
      if (b.value === "all") return 1;
      return Number(b.value) - Number(a.value);
    });
  }, [metricsRows, requisicionesController.anio]);

  const mergedDireccionOptions = React.useMemo<desplegablesOption[]>(() => {
    const map = new Map<string, desplegablesOption>();

    direccionOptions.forEach((option) => {
      map.set(option.value.toLowerCase(), option);
    });

    metricsRows.forEach((row) => {
      const value = String(row.direccion ?? "").trim();
      if (!value) return;
      const key = value.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { value, label: value });
      }
    });

    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [direccionOptions, metricsRows]);

  const dashboardRows = React.useMemo(() => {
    if (!direccion || direccion === "all") return metricsRows;
    const selected = direccion.trim().toLowerCase();
    return metricsRows.filter((row) => String(row.direccion ?? "").trim().toLowerCase() === selected);
  }, [metricsRows, direccion]);

  const now = React.useMemo(() => new Date(), []);
  const metrics = useRequisicionesMetrics(dashboardRows, now);

  return (
    <RequisicionesMetricasPage
      loading={loading}
      error={error}
      rowsCount={dashboardRows.length}
      metrics={metrics}
      anio={requisicionesController.anio}
      cargo={requisicionesController.cargo}
      ciudad={requisicionesController.ciudad}
      analista={requisicionesController.analista}
      direccion={direccion}
      yearOptions={yearOptions}
      cargoOptions={[ALL_OPTION, ...cargoOptions]}
      ciudadOptions={[ALL_FEMALE_OPTION, ...ciudadOptions]}
      analistaOptions={[ALL_OPTION, ...analistaOptions]}
      direccionOptions={[ALL_FEMALE_OPTION, ...mergedDireccionOptions]}
      setAnio={requisicionesController.setAnio}
      setCargo={requisicionesController.setCargo}
      setCiudad={requisicionesController.setCiudad}
      setAnalista={requisicionesController.setAnalista}
      setDireccion={setDireccion}
    />
  );
}
