import * as React from "react";
import "./ViewerDocument.css";
import { useColaboradoresExplorer } from "../../../Funcionalidades/GD/DocumentViewer";
import { parseDateFlex } from "../../../utils/Date";
import { RenameModal } from "./ChangeName/ChangeName";
import { CancelProcessModal } from "./CancelProcess/CancelProcess";
import type { Archivo } from "../../../models/archivos";
import { SimpleFileUpload } from "../../GD/AddFile/AddFile";

/* ================= Helpers ================= */
function buildBreadcrumb(currentPath: string) {
  const parts = (currentPath || "")
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);

  // Limpieza opcional para que el BC sea “humano”
  return parts.map((p) => p.replace(/\s+/g, " "));
}

const EMPRESAS = [
  { key: "broken", label: "BROKEN" },
  { key: "estudio", label: "ESTUDIO DE MODA" },
  { key: "dh", label: "DH RETAIL" },
  { key: "denim", label: "DENIM HEAD" },
  { key: "meta", label: "METAGRAPHICS" },
  { key: "visual", label: "VISUAL" },
] as const;

export const ColaboradoresExplorer: React.FC = () => {
  const { empresa, currentPath, items, loading, error, search, setEmpresa, setSearch, depth, goUp, openItem, reload, handleCancelProcess, moveCarpeta, organizacion, setOrganizacion} = useColaboradoresExplorer();

  const [agregar, setAgregar] = React.useState(false);
  const [edit, setEdit] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<Archivo | null>(null);
  const [cancelProcess, setCancelProcess] = React.useState(false);

  const hayRuta = !!currentPath.trim();
  const showActions = depth >= 2;
  const breadcrumbParts = React.useMemo(() => buildBreadcrumb(currentPath), [currentPath]);
  const totalItems = items.length;
  const totalFolders = React.useMemo(() => items.filter((i) => i.isFolder).length, [items]);
  const totalFiles = totalItems - totalFolders;
  const isActivosOrRetirados =currentPath.toLowerCase().includes("activos") || currentPath.toLowerCase().includes("retirados");
  const isActivosOrCancelados = currentPath.toLowerCase().includes("activos") || currentPath.toLowerCase().includes("cancelados");

  const handleCancel = async () => {

    await handleCancelProcess();
    setCancelProcess(false);
  };

  const fileIndexById = React.useMemo(() => {
    const onlyFiles = items
      .filter((i) => !i.isFolder)
      .slice()
      .sort((a, b) => {
        const ta = a.created ? Date.parse(a.created) : 0;
        const tb = b.created ? Date.parse(b.created) : 0;
        return ta - tb;
      });

    const map = new Map<string, string>();
    onlyFiles.forEach((f, idx) => map.set(f.id, String(idx + 1).padStart(2, "0")));
    return map;
  }, [items]);

  const handleOpenRename = (item: any) => {
    setSelectedFile(item);
    setEdit(true);
  };

  return (
    <div className="ce2">
      {/* Sidebar */}
      <aside className="ce2-sb" aria-label="Empresas">
        <div className="ce2-sb__brand">
          <div className="ce2-sb__kicker">Expedientes</div>
        </div>

        <div className="ce2-sb__seg" role="tablist" aria-label="Selector de empresa">
          {EMPRESAS.map((e) => (
            <button key={e.key} role="tab" aria-selected={empresa === e.key} type="button" className={"ce2-sb__segBtn" + (empresa === e.key ? " is-active" : "")} onClick={() => setEmpresa(e.key as any)}>
              {e.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <section className="ce2-main">
        {/* Header */}
        <header className="ce3-head">
          {/* Top bar: breadcrumb + counters */}
          <div className="ce3-top">
            <div className="ce3-bc" aria-label="Ruta">
              <span className="ce3-bc__root">{EMPRESAS.find(e => e.key === empresa)?.label ?? "Inicio"}</span>
              {breadcrumbParts.length > 0 && <span className="ce3-bc__sep">/</span>}
              {breadcrumbParts.map((p, idx) => {
                const isLast = idx === breadcrumbParts.length - 1;
                return (
                  <React.Fragment key={`${p}-${idx}`}>
                    <span className={"ce3-bc__crumb" + (isLast ? " is-current" : "")} title={p}>
                      {p}
                    </span>
                    {!isLast && <span className="ce3-bc__sep">/</span>}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="ce3-kpis" aria-label="Resumen">
              <span className="ce3-kpi">{totalFiles} archivos</span>
              <span className="ce3-kpi">{totalFolders} carpetas</span>
            </div>
          </div>

          {/* Controls bar: left actions + right filters */}
          <div className="ce3-ctl">
            <div className="ce3-actions">
              {hayRuta && (
                <button type="button" className="ce3-btn ce3-btn--ghost" onClick={goUp}>
                  ← Volver
                </button>
              )}

              {showActions && (
                <button type="button" className="ce3-btn ce3-btn--primary" onClick={() => setAgregar(true)}>
                  + Agregar archivo
                </button>
              )}

              {/* Acciones “pesadas” a menú (reduce ruido) */}
              {showActions && (isActivosOrRetirados || isActivosOrCancelados) && (
                <details className="ce3-more">
                  <summary className="ce3-btn ce3-btn--ghost ce3-more__sum">Más ▾</summary>

                  <div className="ce3-more__menu">
                    {isActivosOrRetirados && (
                      <button type="button" className="ce3-menuItem" onClick={() =>
                                                                        currentPath.toLowerCase().includes("activos")
                                                                          ? moveCarpeta("Colaboradores Retirados")
                                                                          : moveCarpeta("Colaboradores Activos")
                                                                      }
                                                                    >
                        {currentPath.toLowerCase().includes("activos") ? "Marcar como retirado" : "Reintegrar colaborador"}
                      </button>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="ce3-filters">
              <select className="ce3-select" value={organizacion} onChange={(e) => setOrganizacion(e.target.value)} aria-label="Orden">
                <option value="asc">Más antiguas</option>
                <option value="desc">Más nuevas</option>
              </select>

              <input className="ce3-search" placeholder="Buscar por nombre…" value={search} onChange={(e) => setSearch(e.target.value)}/>
            </div>
          </div>
        </header>


        {/* Table */}
        <div className="ce2-panel">
          <div className="ce2-table" role="table" aria-label="Listado">
            <div className="ce2-thead" role="rowgroup">
              <div className="ce2-tr ce2-tr--head" role="row">
                <div className="ce2-th ce2-th--seq" role="columnheader">
                  #
                </div>
                <div className="ce2-th" role="columnheader">
                  Nombre
                </div>
                <div className="ce2-th ce2-th--date" role="columnheader">
                  Fecha
                </div>
                <div className="ce2-th ce2-th--act" role="columnheader" aria-label="Acciones">
                  {/* vacío intencional */}
                </div>
              </div>
            </div>

            <div className="ce2-tbody" role="rowgroup">
              {loading && <div className="ce2-state">Cargando…</div>}
              {!loading && error && <div className="ce2-state ce2-state--error">{error}</div>}
              {!loading && !error && items.length === 0 && <div className="ce2-state">No hay elementos aquí.</div>}

              {!loading &&
                !error &&
                items.map((item) => {
                  const seq = item.isFolder ? "—" : fileIndexById.get(item.id) ?? "--";
                  const date = parseDateFlex(item.lastModified ?? "")?.toLocaleDateString("es-CO") ?? "";
                  
                  return (
                    <button key={item.id} type="button" className="ce2-tr ce2-rowBtn" role="row" onClick={() => openItem(item)}>
                      <div className="ce2-td ce2-td--seq" role="cell">
                        <span className={"ce2-seq" + (seq === "—" ? " is-ghost" : "")}>{seq}</span>
                      </div>

                      <div className="ce2-td ce2-td--name" role="cell">
                        <span className={"ce2-ico " + (item.isFolder ? "is-folder" : "is-file")} aria-hidden="true" />

                        <span className="ce2-name" title={item.name}>
                          {item.name}
                        </span>
                        {item.isFolder && typeof item.childCount === "number" ? (
                          <span className="ce2-pill">
                            {item.childCount} {item.childCount === 1 ? "elemento" : "elementos"}
                          </span>
                        ) : null}
                      </div>

                      <div className="ce2-td ce2-td--date" role="cell">
                        <span className="ce2-date">{date}</span>
                      </div>

                      <div className="ce2-td ce2-td--act" role="cell">
                        {showActions && (
                          <button
                            type="button"
                            className="ce2-iconBtn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRename(item);
                            }}
                            aria-label="Renombrar"
                            title="Renombrar"
                          >
                            ✎
                          </button>
                        )}
                        <span className="ce2-chev" aria-hidden="true">
                          ›
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Modals */}
        {agregar ? <SimpleFileUpload folderPath={currentPath} onClose={() => setAgregar(false)} /> : null}

        <RenameModal
          open={edit}
          selectedFile={selectedFile!}
          onClose={() => setEdit(false)}
          biblioteca={empresa}
          recargar={reload}
        />

        <CancelProcessModal open={cancelProcess} onClose={() => setCancelProcess(false)} onEliminar={handleCancel} />
      </section>
    </div>
  );
};
