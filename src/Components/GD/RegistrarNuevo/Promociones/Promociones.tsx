import * as React from "react";
import "../Contratos/Contratos.css";
import type { DateRange, SortDir, SortField } from "../../../../models/Commons";
import { useGraphServices } from "../../../../graph/graphContext";
import { toISODateFlex } from "../../../../utils/Date";
import type { Promocion, PromocionErrors } from "../../../../models/Promociones";
import { formatPesosEsCO } from "../../../../utils/Number";
import { useEnvios } from "../../../../Funcionalidades/GD/Envios";
import FormPromocion from "../Modals/Promociones/addPromociones";
import type { SetField } from "../Modals/Contrato/addContrato";
import type { desplegablesOption } from "../../../../models/Desplegables";

function renderSortIndicator(field: SortField, sorts: Array<{field: SortField; dir: SortDir}>) {
  const idx = sorts.findIndex(s => s.field === field);
  if (idx < 0) return null;
  const dir = sorts[idx].dir === 'asc' ? '▲' : '▼';
  return <span style={{ marginLeft: 6, opacity: 0.85 }}>{dir}{sorts.length > 1 ? ` ${idx+1}` : ''}</span>;
}

type Props = {
  rows: Promocion[];
  loading: boolean;
  error: string | null;
  pageSize: number;
  pageIndex: number;
  hasNext: boolean;
  sorts: Array<{field: SortField; dir: SortDir}>;
  setRange: React.Dispatch<React.SetStateAction<DateRange>>;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  reloadAll: () => void;
  toggleSort: (field: SortField, multi?: boolean) => void;
  range: DateRange;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  search: string;
  loadFirstPage: () => Promise<void>
  estado: string,
  setEstado: React.Dispatch<React.SetStateAction<string>>;

  state: Promocion
  setField: SetField<Promocion>;
  handleSubmit: () => Promise<{ok: boolean; created: string | null;}>;
  handleEdit: (e: React.FormEvent, NovedadSeleccionada: Promocion) => void;
  errors: PromocionErrors
  searchRegister: (cedula: string) => Promise<Promocion | null>
  
  selectedPromocion?: Promocion
  setState: (n: Promocion) => void
  handleCancelProcessbyId: (id: string, r: string) => void
  handleReactivateProcessById: (id: string) => void
  submmiting: boolean

  //Desplegables
  empresaOptions: desplegablesOption[]
  loadingEmp: boolean
  tipoDocOptions: desplegablesOption[], 
  loadingTipo: boolean
  cargoOptions: desplegablesOption[], 
  loadingCargo: boolean, 
  modalidadOptions: desplegablesOption[], 
  loadingModalidad: boolean,
  especificidadOptions: desplegablesOption[], 
  loadingEspecificdad: boolean, 
  etapasOptions: desplegablesOption[], 
  loadingEtapas: boolean, 
  nivelCargoOptions: desplegablesOption[], 
  loadinNivelCargo: boolean, 
  CentroCostosOptions: desplegablesOption[]
  loadingCC: boolean
  COOptions: desplegablesOption[]
  loadingCO: boolean, 
  UNOptions: desplegablesOption[]
  loadingUN: boolean,
  origenOptions: desplegablesOption[], 
  loadingOrigen: boolean
  tipoContratoOptions: desplegablesOption[], 
  loadingTipoContrato: boolean, 
  tipoVacanteOptions: desplegablesOption[], 
  loadingTipoVacante: boolean, 
  deptoOptions: desplegablesOption[], 
  loadingDepto: boolean, 
  dependenciaOptions: desplegablesOption[], 
  loadingDependencias: boolean
}

export type PropsPagination = {
  reloadAll: () => void;
  nextPage: () => void;
  pageIndex: number;
  hasNext: boolean;
  loading: boolean;
  pageSize: number;
  totalRows: number;
};

export default function TablaPromociones({submmiting, origenOptions, nivelCargoOptions, tipoVacanteOptions, tipoContratoOptions, loadingEspecificdad, loadingCC, loadingCO, loadingDependencias, loadingDepto, loadingEtapas, loadingOrigen, loadingTipoContrato, loadingTipoVacante, loadingUN, loadingCargo, empresaOptions, loadingEmp, tipoDocOptions, loadingTipo, cargoOptions, modalidadOptions, loadingModalidad, deptoOptions, etapasOptions, COOptions, CentroCostosOptions, UNOptions, dependenciaOptions, loadinNivelCargo, especificidadOptions, errors, handleEdit, setState, handleCancelProcessbyId,searchRegister,  handleReactivateProcessById, setField, handleSubmit, state, rows, loading: loadingPromociones, error, pageSize: pageSizePromociones, pageIndex: pageIndexPromociones, hasNext: hasNextPromociones, sorts, estado, setRange, setEstado, setPageSize, nextPage: nextPagePromociones, reloadAll: reloadAllPromociones, toggleSort, range, setSearch, search, loadFirstPage,}: Props) {
  const { Envios, DetallesPasosPromocion,} = useGraphServices();
  const { canEdit } = useEnvios(Envios);
  
  const [visible, setVisible] = React.useState(false);
  const [novedadSeleccionada, setNovedadSeleccionada] = React.useState<Promocion | null>(null);
  const [tipoFormulario, setTipoFormulario] = React.useState<"new" | "edit" | "view">("edit");
  const [pctById, setPctById] = React.useState<Record<string, number>>({});

  const openRow = React.useCallback(
    async (novedad: Promocion) => {
      setNovedadSeleccionada(novedad);
      const modo = await canEdit(String(novedad.Id ?? ""), "Promocion");
      setTipoFormulario(modo);
      setVisible(true);
    },
    [canEdit]
  );

  const onClose = React.useCallback(async () => {
    await loadFirstPage();
    setVisible(false);
  }, [loadFirstPage]);

  const fetchPctForPromociones= React.useCallback(
    async (novedadId: string) => {
      if (!novedadId) return;

      const safeId = novedadId.replace(/'/g, "''");
      const items = await DetallesPasosPromocion.getAll({
        filter: `fields/Title eq '${safeId}'`,
        orderby: "fields/NumeroPaso asc",
      });

      const pct =
        items.length > 0
          ? (items.filter((i) => i.EstadoPaso === "Completado").length / items.length) *
            100
          : 0;

      setPctById((prev) => {
        const rounded = Math.round(pct * 100) / 100;
        if (prev[novedadId] === rounded) return prev;
        return { ...prev, [novedadId]: rounded };
      });
    },
    [DetallesPasosPromocion]
  );

  const isCanceladas = estado === "cancelado";

  React.useEffect(() => {
    for (const c of rows) {
      const id = String(c?.Id ?? "");
      if (!id) continue;
      if (pctById[id] !== undefined) continue;
      fetchPctForPromociones(id);
    }
  }, [rows, pctById, fetchPctForPromociones]);

  
  React.useEffect(() => {
    if(estado === "cancelado"){
      reloadAllPromociones()
    }
  }, [estado]);

  const onRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, n: Promocion) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openRow(n);
    }
  };

  const Paginacion = ({reloadAll, loading, pageIndex, pageSize, hasNext,  nextPage, totalRows,}: PropsPagination) =>
    totalRows > 0 ? (
      <div className="paginacion">
        <button onClick={reloadAll} disabled={loading || pageIndex <= 1}>
          Anterior
        </button>

        <span>Página {pageIndex}</span>

        <button onClick={nextPage} disabled={loading || !hasNext}>
          Siguiente
        </button>

        <label htmlFor="page-size" style={{ marginLeft: 12, marginRight: 8 }}>
          Registros por página:
        </label>

        <select id="page-size" value={pageSize} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPageSize(parseInt(e.target.value, 10))} disabled={loading}>
          {[10, 15, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    ) : null;

  const TablaNormal = () => (
    <>
      <table>
        <thead>
          <tr>
            <th role="button" tabIndex={0} onClick={(e) => toggleSort('Cedula', e.shiftKey)} aria-label="Ordenar por Cedula" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Cedula {renderSortIndicator('Cedula', sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort('Nombre', e.shiftKey)} aria-label="Ordenar por Nombre" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Nombre {renderSortIndicator('Nombre', sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort('Salario', e.shiftKey)} aria-label="Ordenar por Salario" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Salario {renderSortIndicator('Salario', sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort('promocion', e.shiftKey)} aria-label="Ordenar por fecha de promocion" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Fecha de la promoción {renderSortIndicator('promocion', sorts)}
            </th>

            <th>Reportado por</th>

            <th style={{ textAlign: "center" }}>%</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((n) => (
            <tr key={n.Id} tabIndex={0} onClick={() => openRow(n)} onKeyDown={(e) => onRowKeyDown(e, n)}>
              <td>{n.NumeroDoc}</td>
              <td><span title={n.NombreSeleccionado}>{n.NombreSeleccionado}</span></td>
              <td><span title={n.Salario}>{formatPesosEsCO(n.Salario)}</span></td>
              <td>{toISODateFlex(n.FechaIngreso) || "–"}</td>
              <td><span title={n.InformacionEnviadaPor}>{n.InformacionEnviadaPor}</span></td>
              <td style={{ textAlign: "center" }}>
                {(() => {
                  const id = String(n.Id ?? "");
                  const pct = pctById[id];
                  return pct === undefined ? "…" : `${pct.toFixed(2)}%`;
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Paginacion reloadAll={reloadAllPromociones} nextPage={nextPagePromociones} pageIndex={pageIndexPromociones} hasNext={hasNextPromociones} loading={loadingPromociones} pageSize={pageSizePromociones} totalRows={rows.length}/>
    </>
  );

  const TablaCanceladas = () => (
    <>
      <table>
        <thead>
          <tr>
            <th style={{ whiteSpace: "nowrap" }}>Cedula</th>
            <th style={{ whiteSpace: "nowrap" }}>Nombre</th>
            <th style={{ whiteSpace: "nowrap" }}>Fecha cancelación</th>
            <th>Motivo cancelación</th>
            <th>Cancelado por</th>
            <th style={{ textAlign: "center" }}>%</th>
          </tr>
        </thead>

        <tbody>
          {(rows ?? []).map((n: any) => (
            <tr key={n.Id} tabIndex={0}>
              <td>{n.Numeroidentificacion}</td>
              <td><span title={n.Nombre}>{n.Nombre}</span></td>
              <td>{toISODateFlex(n.Created) || "–"}</td>
              <td><span title={n.RazonCancelacion}>{n.RazonCancelacion || "–"}</span></td>
              <td><span title={n.Procesocanceladopor}>{n.Procesocanceladopor || "–"}</span></td>
              <td style={{ textAlign: "center" }}>
                {(() => {
                  const id = String(n.Id ?? "");
                  const pct = pctById[id];
                  return pct === undefined ? "…" : `${pct.toFixed(2)}%`;
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Paginacion reloadAll={reloadAllPromociones} nextPage={nextPagePromociones} pageIndex={pageIndexPromociones} hasNext={hasNextPromociones} loading={false} pageSize={pageSizePromociones} totalRows={(rows).length}/>
    </>
  );

  return (
    <div className="tabla-novedades">
      <div className="rn-toolbar tabla-filters">
        <div className="rn-toolbar__left">
          <input className="rn-input" onChange={(e) => setSearch(e.target.value)} value={search} placeholder="Buscador..."/>

          <select name="estado" id="estado" onChange={(e) => setEstado(e.target.value)} value={estado} className="rn-input">
            <option value="En proceso">En proceso</option>
            <option value="Completado">Finalizados</option>
            <option value="Cancelado">Cancelado</option>
            <option value="todos">Todos</option>
          </select>

          <input type="date" className="rn-input rn-date" onChange={(e) => setRange({ ...range, from: e.target.value })} value={range.from}/>
          <input type="date" className="rn-input rn-date" onChange={(e) => setRange({ ...range, to: e.target.value })} value={range.to}/>
        </div>
      </div>

      {loadingPromociones && <p>Cargando registros...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loadingPromociones && !error && rows.length === 0 && (
        <p>No hay registros para los filtros seleccionados.</p>
      )}

      <div className="novedades-wrap filas-novedades">
        {isCanceladas ? <TablaCanceladas /> : <TablaNormal />}
      </div>

      {visible && novedadSeleccionada ? (
        <FormPromocion 
          onClose={onClose}
          state={state}
          setField={setField}
          handleSubmit={handleSubmit}
          handleEdit={handleEdit}
          errors={errors}
          searchRegister={searchRegister}
          loadFirstPage={loadFirstPage}
          tipo={tipoFormulario}
          setState={setState}
          handleCancelProcessbyId={handleCancelProcessbyId}
          handleReactivateProcessById={handleReactivateProcessById}
          title={"Editar promoción de: " + novedadSeleccionada.NombreSeleccionado}
          empresaOptions={empresaOptions}
          loadingEmp={loadingEmp}
          tipoDocOptions={tipoDocOptions}
          loadingTipo={loadingTipo}
          cargoOptions={cargoOptions}
          loadingCargo={loadingCargo}
          modalidadOptions={modalidadOptions}
          loadingModalidad={loadingModalidad}
          especificidadOptions={especificidadOptions}
          loadingEspecificdad={loadingEspecificdad}
          etapasOptions={etapasOptions}
          loadingEtapas={loadingEtapas}
          nivelCargoOptions={nivelCargoOptions}
          loadinNivelCargo={loadinNivelCargo}
          CentroCostosOptions={CentroCostosOptions}
          loadingCC={loadingCC}
          COOptions={COOptions}
          loadingCO={loadingCO}
          UNOptions={UNOptions}
          loadingUN={loadingUN}
          origenOptions={origenOptions}
          loadingOrigen={loadingOrigen}
          tipoContratoOptions={tipoContratoOptions}
          loadingTipoContrato={loadingTipoContrato}
          tipoVacanteOptions={tipoVacanteOptions}
          loadingTipoVacante={loadingTipoVacante}
          deptoOptions={deptoOptions}
          loadingDepto={loadingDepto}
          dependenciaOptions={dependenciaOptions}
          loadingDependencias={loadingDependencias} submitting={submmiting} selectedPromocion={novedadSeleccionada}/>
      ) : null}
    </div>
  );
}
