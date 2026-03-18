import * as React from "react";
import type { DateRange } from "../../../models/Commons";
import type { desplegablesOption } from "../../../models/Desplegables";
import type { requisiciones } from "../../../models/requisiciones";
import { spDateToDDMMYYYY, toISODateFlex } from "../../../utils/Date";
import "./tablaRequisiciones.css";

type Props = {
  rows: requisiciones[];

  id: string;
  estado: string;
  cargo: string;
  rango: DateRange;
  cumple: string;
  ciudad: string;
  analista: string;

  setId: (id: string) => void;
  setEstado: (estado: string) => void;
  setCargo: (cargo: string) => void;
  setRange: (next: DateRange) => void;
  setCumple: (cumple: string) => void;
  setCiudad: (ciudad: string) => void;
  setAnalista: (analista: string) => void;

  cargoOptions: desplegablesOption[];
  ciudadOptions: desplegablesOption[];

  labels?: Partial<{
    id: string;
    estado: string;
    cargo: string;
    ciudad: string;
    analista: string;
    cumpleANS: string;
    fechaDesde: string;
    fechaHasta: string;
  }>;

  onOpenRow: (row: requisiciones) => void;

  className?: string;
  emptyText?: string;
};

export default function RequisicionesBoard(props: Props) {
  const {rows, id, estado, cargo, rango, cumple, ciudad, analista,  setId, setEstado, setCargo, setRange, setCumple, setCiudad, setAnalista, cargoOptions, ciudadOptions, onOpenRow, className, emptyText = "No hay requisiciones para los filtros seleccionados.",} = props;

  const L = {
    id: "ID",
    estado: "Estado",
    cargo: "Cargo",
    ciudad: "Ciudad",
    analista: "Analista",
    cumpleANS: "¿Cumple ANS?",
    fechaDesde: "Fecha desde",
    fechaHasta: "Fecha hasta",
    ...(props.labels ?? {}),
  };

  const cumpleAnsOptions: desplegablesOption[] = [
    { value: "all", label: "*Todos*" },
    { value: "Si", label: "Sí" },
    { value: "No", label: "Sí" },
    { value: "pendiente", label: "Pendiente" },
  ];

  const estadoOptions: desplegablesOption[] = [
    { value: "all", label: "*Todos*" },
    { value: "Activo", label: "Activo" },
    { value: "Cancelado", label: "Cancelado" },
    { value: "Cerrado", label: "Cerrado" },
  ];

  const analistaFilterOptions: desplegablesOption[] = React.useMemo(() => {
    const set = new Set<string>();
    (rows ?? []).forEach((r) => {
      const name = String((r as any)?.nombreProfesional ?? "").trim();
      if (name) set.add(name);
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((name) => ({ value: name, label: name }));
  }, [rows]);

  const cargoOptionsWithAll = React.useMemo<desplegablesOption[]>(
    () => [{ value: "all", label: "*Todos*" }, ...(cargoOptions ?? [])],
    [cargoOptions]
  );

  const ciudadOptionsWithAll = React.useMemo<desplegablesOption[]>(
    () => [{ value: "all", label: "*Todos*" }, ...(ciudadOptions ?? [])],
    [ciudadOptions]
  );

  return (
    <div className={`rb-wrap ${className ?? ""}`.trim()}>
      {/* FILTERS */}
      <section className="rb-filters rb-filters--layout" aria-label="Filtros requisiciones">
        <div className="rb-field rb-a-id">
          <label className="rb-label">{L.id}</label>
          <input type="number" className="rb-input" value={id} placeholder="Ingrese ID" onChange={(e) => setId(e.target.value)}/>
        </div>

        <div className="rb-field rb-a-cargo">
          <label className="rb-label">{L.cargo}</label>
          <select className="rb-select" value={cargo} onChange={(e) => setCargo(e.target.value)}>
            {cargoOptionsWithAll.map((o) => (
              <option key={String(o.value)} value={String(o.label)}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rb-field rb-a-desde">
          <label className="rb-label">{L.fechaDesde}</label>
          <div className="rb-date">
            <input className="rb-input" type="date" value={String(rango?.from ?? "")} onChange={(e) => setRange({ ...rango, from: e.target.value })}/>
          </div>
        </div>

        <div className="rb-field rb-a-hasta">
          <label className="rb-label">{L.fechaHasta}</label>
          <div className="rb-date">
            <input className="rb-input" type="date" value={String(rango?.to ?? "")} onChange={(e) => setRange({ ...rango, to: e.target.value })}/>
          </div>
        </div>

        <div className="rb-field rb-a-cumple">
          <label className="rb-label">{L.cumpleANS}</label>
          <select className="rb-select" value={cumple} onChange={(e) => setCumple(e.target.value)}>
            {cumpleAnsOptions.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rb-field rb-a-ciudad">
          <label className="rb-label">{L.ciudad}</label>
          <select className="rb-select" value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
            {ciudadOptionsWithAll.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rb-field rb-a-analista">
          <label className="rb-label">{L.analista}</label>
          <select className="rb-select" value={analista} onChange={(e) => setAnalista(e.target.value)}>
            <option value="all">*Todos*</option>
            {analistaFilterOptions.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rb-field rb-a-estado">
          <label className="rb-label">{L.estado}</label>
          <select className="rb-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {estadoOptions.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* LIST */}
      <section className="rb-list" aria-label="Listado requisiciones">
        {rows.length === 0 ? (
          <div className="rb-empty">{emptyText}</div>
        ) : (
          rows.map((r) => {
            const tone = getToneByEstado(String((r as any).Estado ?? (r as any).estado ?? ""));
            const cumpleStr = String((r as any).cumpleANS ?? "").trim().toLowerCase();

            const showAns = cumpleStr !== "" && cumpleStr !== "pendiente";
            const ansOk = cumpleStr === "si" || cumpleStr === "sí" || cumpleStr === "true";
            const ansNo = cumpleStr === "no" || cumpleStr === "false" || cumpleStr === "0";
            const showDias = r.Estado.toLocaleLowerCase() === "Activo";
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const limite = new Date(toISODateFlex(r.fechaLimite));
            limite.setHours(0, 0, 0, 0);

            const msPorDia = 1000 * 60 * 60 * 24;

            const diffDias = Math.round((+limite - +hoy) / msPorDia); 
            // >0: faltan días, <0: atraso, 0: hoy

            let texto = "";
            if (r.Estado === "Activo") {
              if (diffDias < 0) {
                texto = `${Math.abs(diffDias)} días de retraso!`;
              } else {
                texto = `Quedan ${diffDias} días!`;
              }
            }

            const idRow = String((r as any).Id ?? (r as any).ID ?? "");
            const estadoRow = r.Estado
            const correo = String((r as any).correoSolicitante ?? (r as any)["Mail solicitante"] ?? "");
            const cargoRow = String((r as any).Title ?? "") +  " EN " + r.Ciudad.toUpperCase();
            const fIni = spDateToDDMMYYYY((r as any).fechaInicioProceso) ?? "—";
            const fLim = spDateToDDMMYYYY((r as any).fechaLimite) ?? "—";

            return (
              <button key={idRow || crypto.randomUUID()} type="button" className={`rb-row rb-tone-${tone}`} onClick={() => onOpenRow(r)} title="Ver detalle">
                <div className="rb-row__main">
                  <div className="rb-row__left">
                    <div className="rb-row__id">
                      <span className="rb-row__idlabel">ID:</span> {idRow || "—"}{" "}
                      <span className="rb-row__estado">{estadoRow || "—"}</span>
                    </div>

                    <div className="rb-row__meta">
                      <div className="rb-row__metaCol">
                        <div>
                          <span className="rb-row__metaLabel">Fecha inicio:</span>{" "}
                          <span className="rb-row__metaVal">{fIni}</span>
                        </div>
                        <div>
                          <span className="rb-row__metaLabel">Correo:</span>{" "}
                          <span className="rb-row__metaVal">{correo || "—"}</span>
                        </div>
                      </div>

                      <div className="rb-row__metaCol">
                        <div className="rb-row__cargo">{cargoRow || "—"}</div>
                        <div>
                          <span className="rb-row__metaLabel">Fecha límite:</span>{" "}
                          <span className="rb-row__metaVal">{fLim}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rb-row__right">
                    <div className="rb-row__ans">
                      {!showAns ? (
                        <span className="rb-emoji rb-emoji--na" aria-label="Pendiente">
                          {texto}
                        </span>
                      ) : ansOk ? (
                        <span className="rb-emoji rb-emoji--ok" aria-label="Cumple ANS">
                          🙂
                        </span>
                      ) : ansNo ? (
                        <span className="rb-emoji rb-emoji--bad" aria-label="No cumple ANS">
                          🙁
                        </span>
                      ) : (
                        <span className="rb-emoji rb-emoji--na" aria-label="Sin dato">
                          —
                        </span>
                      )}

                      {!showDias ? (
                        <span className="rb-emoji rb-emoji--na" aria-label="Pendiente">
                          
                        </span>
                      ) : (
                        null
                      )}
                    </div>

                    <div className="rb-row__arrow" aria-hidden>
                      ❯
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </section>
    </div>
  );
}

function getToneByEstado(estado: string) {
  const s = String(estado ?? "").trim().toLowerCase();
  if (s.includes("cancel")) return "cancel";
  if (s.includes("cerr")) return "closed";
  if (s.includes("activo") || s.includes("abiert")) return "active";
  return "neutral";
}
