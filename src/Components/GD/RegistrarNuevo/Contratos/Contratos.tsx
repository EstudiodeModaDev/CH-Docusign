import * as React from "react";
import "./Contratos.css";
import type { DateRange, SortDir, SortField } from "../../../../models/Commons";
import type { Novedad, NovedadErrors } from "../../../../models/Novedades";
import { useGraphServices } from "../../../../graph/graphContext";
import { toISODateFlex } from "../../../../utils/Date";
import { formatPesosEsCO } from "../../../../utils/Number";
import { useEnvios } from "../../../../Funcionalidades/GD/Envios";
import type { desplegablesOption } from "../../../../models/Desplegables";
import type { SetField } from "../Modals/Contrato/addContrato";
import FormContratacion from "../Modals/Contrato/addContrato";

function renderSortIndicator(
  field: SortField,
  sorts: Array<{ field: SortField; dir: SortDir }>
) {
  const idx = sorts.findIndex((s) => s.field === field);
  if (idx < 0) return null;
  const dir = sorts[idx].dir === "asc" ? "▲" : "▼";
  return (
    <span style={{ marginLeft: 6, opacity: 0.85 }}>
      {dir}
      {sorts.length > 1 ? ` ${idx + 1}` : ""}
    </span>
  );
}

export type Props = {
  rows: Novedad[];
  loading: boolean;
  error: string | null;

  pageSize: number;
  pageIndex: number;
  hasNext: boolean;

  sorts: Array<{ field: SortField; dir: SortDir }>;
  toggleSort: (field: SortField, multi?: boolean) => void;

  range: DateRange;
  setRange: React.Dispatch<React.SetStateAction<DateRange>>;

  setPageSize: (size: number) => void;
  nextPage: () => void;
  reloadAll: () => void;

  setSearch: React.Dispatch<React.SetStateAction<string>>;
  search: string;
  loadFirstPage: () => Promise<void>;

  setEstado: React.Dispatch<React.SetStateAction<string>>;
  estado: string;

  state: Novedad
  setField: SetField<Novedad>;
  handleSubmit: () => Promise<{ok: boolean; created: string | null;}>;
  handleEdit: (e: React.FormEvent, NovedadSeleccionada: Novedad) => void;
  errors: NovedadErrors
  searchRegister: (cedula: string) => Promise<Novedad | null>
  setState: (n: Novedad) => void
  handleCancelProcessbyId: (id: string, r: string) => void
  handleReactivatProcessbyId: (id: string,) => void

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
};

export type PropsPagination = {
  reloadAll: () => void;
  nextPage: () => void;
  pageIndex: number;
  hasNext: boolean;
  loading: boolean;
  pageSize: number;
  totalRows: number;
};

export default function TablaContratos({handleReactivatProcessbyId, tipoVacanteOptions, loadingTipoVacante, deptoOptions, loadingDepto, dependenciaOptions, loadingDependencias,CentroCostosOptions, loadingCC, COOptions, loadingCO, UNOptions, loadingUN, origenOptions, loadingOrigen, tipoContratoOptions, loadingTipoContrato, errors, searchRegister, setState, loadingModalidad, especificidadOptions, loadingEspecificdad, etapasOptions, loadingEtapas, nivelCargoOptions, loadinNivelCargo, empresaOptions, loadingEmp, tipoDocOptions, loadingTipo, cargoOptions, loadingCargo, modalidadOptions, state, setField, handleSubmit, handleCancelProcessbyId, handleEdit,  rows, loading: loadingContratos, error, pageSize: pageSizeContratos, pageIndex: pageIndexContratos, hasNext: hasNextContratos, sorts, estado, setRange, setEstado, setPageSize, nextPage: nextPageContratos, reloadAll: reloadAllContratos, toggleSort, range, setSearch, search, loadFirstPage,}: Props) {
  const { Envios, DetallesPasosNovedades, } = useGraphServices();
  const { canEdit } = useEnvios(Envios);

  const [visible, setVisible] = React.useState(false);
  const [novedadSeleccionada, setNovedadSeleccionada] = React.useState<Novedad | null>(null);
  const [tipoFormulario, setTipoFormulario] = React.useState<"new" | "edit" | "view">("view");
  const [pctById, setPctById] = React.useState<Record<string, number>>({});

  const openRow = React.useCallback(
    async (novedad: Novedad) => {
      setNovedadSeleccionada(novedad);
      const modo = await canEdit(String(novedad.Id ?? ""), "Novedades");
      setTipoFormulario(modo);
      setVisible(true);
    },
    [canEdit]
  );

  const onClose = React.useCallback(async () => {
    await loadFirstPage();
    setVisible(false);
  }, [loadFirstPage]);

  const fetchPctForNovedad = React.useCallback(
    async (novedadId: string) => {
      if (!novedadId) return;

      const safeId = novedadId.replace(/'/g, "''");
      const items = await DetallesPasosNovedades.getAll({
        filter: `fields/Title eq '${safeId}'`,
        orderby: "fields/NumeroPaso asc",
      });

      const pct =
        items.length > 0
          ? (items.filter((i) => i.EstadoPaso === "Completado" || i.EstadoPaso?.toLocaleLowerCase() === "omitido").length / items.length) *
            100
          : 0;

      setPctById((prev) => {
        const rounded = Math.round(pct * 100) / 100;
        if (prev[novedadId] === rounded) return prev;
        return { ...prev, [novedadId]: rounded };
      });
    },
    [DetallesPasosNovedades]
  );

  const isCanceladas = estado === "cancelado";

  React.useEffect(() => {
    for (const c of rows) {
      const id = String(c?.Id ?? "");
      if (!id) continue;
      if (pctById[id] !== undefined) continue;
      fetchPctForNovedad(id);
    }
  }, [rows, pctById, fetchPctForNovedad]);

  const onRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, n: Novedad) => {
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
            <th role="button" tabIndex={0} onClick={(e) => toggleSort("Cedula", (e as any).shiftKey)} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
              Cedula {renderSortIndicator("Cedula", sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort("Nombre", (e as any).shiftKey)} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
              Nombre {renderSortIndicator("Nombre", sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort("Salario", (e as any).shiftKey)} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
              Salario {renderSortIndicator("Salario", sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort("inicio", (e as any).shiftKey)} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
              Fecha de inicio {renderSortIndicator("inicio", sorts)}
            </th>

            <th>Reportado por</th>
            <th style={{ textAlign: "center" }}>%</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((n) => (
            <tr key={n.Id} tabIndex={0} onClick={() => openRow(n)} onKeyDown={(e) => onRowKeyDown(e, n)}>
              <td>{n.Numero_x0020_identificaci_x00f3_}</td>
              <td><span title={n.NombreSeleccionado}>{n.NombreSeleccionado}</span></td>
              <td><span title={n.SALARIO}>{formatPesosEsCO(n.SALARIO)}</span></td>
              <td>{toISODateFlex(n.FECHA_x0020_REQUERIDA_x0020_PARA0) || "–"}</td>
              <td><span title={n.Informaci_x00f3_n_x0020_enviada_}>{n.Informaci_x00f3_n_x0020_enviada_}</span></td>
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

      <Paginacion
        reloadAll={reloadAllContratos}
        nextPage={nextPageContratos}
        pageIndex={pageIndexContratos}
        hasNext={hasNextContratos}
        loading={loadingContratos}
        pageSize={pageSizeContratos}
        totalRows={rows.length}
      />
    </>
  );

  const TablaCanceladas = () => (
    <>
      <table>
        <thead>
          <tr>
            <th role="button" tabIndex={0} onClick={(e) => toggleSort("Cedula", (e as any).shiftKey)} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
              Cedula {renderSortIndicator("Cedula", sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort("Nombre", (e as any).shiftKey)} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
              Nombre {renderSortIndicator("Nombre", sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort("Salario", (e as any).shiftKey)} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
              Salario {renderSortIndicator("Salario", sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort("inicio", (e as any).shiftKey)} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
              Fecha de inicio {renderSortIndicator("inicio", sorts)}
            </th>

            <th>Razón de cancelación</th>
            <th>Cancelado por</th>
            <th style={{ textAlign: "center" }}>%</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((n) => (
            <tr key={n.Id} tabIndex={0} onClick={() => openRow(n)} onKeyDown={(e) => onRowKeyDown(e, n)}>
              <td>{n.Numero_x0020_identificaci_x00f3_}</td>
              <td><span title={n.NombreSeleccionado}>{n.NombreSeleccionado}</span></td>
              <td><span title={n.SALARIO}>{formatPesosEsCO(n.SALARIO)}</span></td>
              <td>{toISODateFlex(n.FECHA_x0020_REQUERIDA_x0020_PARA0) || "–"}</td>
              <td>{n.RazonCancelacion || "–"}</td>
              <td><span title={n.Informaci_x00f3_n_x0020_enviada_}>{n.Informaci_x00f3_n_x0020_enviada_}</span></td>
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

      <Paginacion
        reloadAll={reloadAllContratos}
        nextPage={nextPageContratos}
        pageIndex={pageIndexContratos}
        hasNext={hasNextContratos}
        loading={loadingContratos}
        pageSize={pageSizeContratos}
        totalRows={rows.length}
      />
    </>
  );

  return (
    <div className="tabla-novedades">
      <div className="rn-toolbar tabla-filters">
        <div className="rn-toolbar__left">
          <input className="rn-input" onChange={(e) => setSearch(e.target.value)} value={search} placeholder="Buscador..."/>

          <select name="estado" id="estado" onChange={(e) => setEstado(e.target.value)} value={estado} className="rn-input">
            <option value="proceso">En proceso</option>
            <option value="finalizado">Finalizados</option>
            <option value="cancelado">Cancelado</option>
            <option value="todos">Todos</option>
          </select>

          <input type="date" className="rn-input rn-date" onChange={(e) => setRange({ ...range, from: e.target.value })} value={range.from}/>
          <input type="date" className="rn-input rn-date" onChange={(e) => setRange({ ...range, to: e.target.value })} value={range.to}/>
        </div>
      </div>

      {loadingContratos && <p>Cargando registros...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loadingContratos && !error && rows.length === 0 && (
        <p>No hay registros para los filtros seleccionados.</p>
      )}

      <div className="novedades-wrap filas-novedades">
        {isCanceladas ? <TablaCanceladas /> : <TablaNormal />}
      </div>

      {visible && novedadSeleccionada ? (
        <FormContratacion 
          state={state}
          setField={setField}
          onClose={onClose}
          handleSubmit={() => handleSubmit()}
          errors={errors}
          searchRegister={(cedula: string) => searchRegister(cedula)}
          loadFirstPage={loadFirstPage}
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
          loadingDependencias={loadingDependencias}
          handleEdit={handleEdit}
          tipo={tipoFormulario}
          setState={setState}
          selectedNovedad={novedadSeleccionada}
          handleCancelProcessbyId={handleCancelProcessbyId}
          title={"Editar contratación de: " + novedadSeleccionada.NombreSeleccionado} 
          handleReactivateProcessById={handleReactivatProcessbyId}/>
      ) : null}
    </div>
  );
}
