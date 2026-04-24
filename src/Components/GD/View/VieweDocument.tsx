import * as React from "react";
import "./ViewerDocument.css";
import { parseDateFlex } from "../../../utils/Date";
import { RenameModal } from "./ChangeName/ChangeName";
import { CancelProcessModal } from "./CancelProcess/CancelProcess";
import type { Archivo } from "../../../models/archivos";
import { SimpleFileUpload } from "../../GD/AddFile/AddFile";
import { useColaboradoresExplorer } from "../../../Funcionalidades/GD/DocumentViewer/hooks/useColaboradoresExplorer";
import { useFolderControl } from "../../../Funcionalidades/GD/DocumentViewer/CheckFolderControl/hooks/useFolderControl";
import type { ControlRevisionCarpetas } from "../../../models/DocumentViewer";
import { useFolderHistorial } from "../../../Funcionalidades/GD/DocumentViewer/CheckFolderHistorial/hooks/useFolderHistorial";
import { buildBreadcrumb, getEstadoClass, normalizeEstado, parseFolderDataFromPath } from "./utils/Helpers";
import { useDocumentPermissions } from "../../../Funcionalidades/Common/usePermissions";
import { columns, EMPRESAS } from "./utils/Constants";
import { ReasonModal } from "../Common/ReasonModal/ReasonModal";
import { TableModal } from "../Common/TableModal/TableModal";

type SearchFolderResult = {
  founded: boolean;
  folders: ControlRevisionCarpetas | null;
};

export const ColaboradoresExplorer: React.FC = () => {
  const viewerController = useColaboradoresExplorer();
  const { canInactivateRegister, canCheckFinishedFolder, canDelete, canApprove, } = useDocumentPermissions();

  const [agregar, setAgregar] = React.useState(false);
  const [edit, setEdit] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<Archivo | null>(null);
  const [cancelProcess, setCancelProcess] = React.useState(false);
  const [returnFolder, setReturnFolder] = React.useState(false);
  const [folderHistory, setFolderHistory] = React.useState(false);
  const [historial, setHistorial] = React.useState<any[]>([]);

  const [folderState, setFolderState] = React.useState<SearchFolderResult>({founded: false, folders: null,});
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const lastAutoCreatedPathRef = React.useRef<string>("");
  const autoCreatingPathRef = React.useRef<string>("");
  const hayRuta = !!viewerController.currentPath.trim();
  const showActions = viewerController.depth >= 2;

  const breadcrumbParts = React.useMemo(() => buildBreadcrumb(viewerController.currentPath), [viewerController.currentPath]);

  const totalItems = viewerController.items.length;

  const totalFolders = React.useMemo(() => viewerController.items.filter((i) => i.isFolder).length, [viewerController.items]);

  const totalFiles = totalItems - totalFolders;

  const isActivosOrRetirados = viewerController.currentPath.toLowerCase().includes("activos") || viewerController.currentPath.toLowerCase().includes("retirados");

  const folderInfo = React.useMemo(() => {
    return parseFolderDataFromPath(viewerController.currentPath);
  }, [viewerController.currentPath]);

  const folderController = useFolderControl(folderInfo, viewerController.empresa);
  const folderHistorial = useFolderHistorial(folderInfo);
  const { searchSpecificFolder, createEntity, state: folderControlState, setState: setFolderControlState } = folderController;

  const fileIndexById = React.useMemo(() => {
    const onlyFiles = viewerController.items
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
  }, [viewerController.items]);

  const currentEstado = React.useMemo(() => {return normalizeEstado(folderState.folders?.Estado);}, [folderState]);

  const isFolderLockedForReview = React.useMemo(() => {return currentEstado === "en revisión" || currentEstado === "aprobada";}, [currentEstado]);
  const isFolderLockedForApproval = React.useMemo(() => { return currentEstado === "aprobada" || currentEstado === "en construcción"}, [currentEstado]);

  const reviewButtonLabel = React.useMemo(() => {
    if (currentEstado === "aprobada") return "Carpeta aprobada";
    if (currentEstado === "en revisión") return "Carpeta en revisión";
    return "Enviar a revisión";
  }, [currentEstado]);

  const loadFolderState = React.useCallback(async () => {
    if (!folderInfo.cedula) {
      setFolderState({ founded: false, folders: null });
      return;
    }

    setLoading(true);
    try {
      const result = await searchSpecificFolder(folderInfo.cedula);
      setFolderState({
        founded: !!result?.founded,
        folders: result?.folders ?? null,
      });
    } catch (error) {
      console.error("Error cargando estado de la carpeta:", error);
      setFolderState({ founded: false, folders: null });
    } finally {
      setLoading(false);
    }
  }, [folderInfo.cedula, searchSpecificFolder]);

  React.useEffect(() => {
    loadFolderState();
  }, [loadFolderState]);

  const handleCancel = async () => {
    await viewerController.handleCancelProcess();
    setCancelProcess(false);
  };

  const handleOpenRename = (item: Archivo) => {
    setSelectedFile(item);
    setEdit(true);
  };

  const handleSearchAndCreateControlEntity = React.useCallback(async () => {
    if (!selectedFile?.isFolder) return;

    const nombreCarpeta = selectedFile.name?.trim() ?? "";
    const [cedula = "", nombre = ""] = nombreCarpeta.split(" - ").map((v) => v.trim());

    if (!cedula || !nombre) return;

    const folderPath = selectedFile.path?.trim() ?? "";
    if (!folderPath) return;

    // Evita recrear varias veces para la misma carpeta en la misma sesión.
    if (lastAutoCreatedPathRef.current === folderPath) return;
    if (autoCreatingPathRef.current === folderPath) return;

    autoCreatingPathRef.current = folderPath;

    try {
      const folderEncontrado = await searchSpecificFolder(cedula);

      if (folderEncontrado?.founded) {
        lastAutoCreatedPathRef.current = folderPath;
        await loadFolderState();
        return;
      }

      const nextState: ControlRevisionCarpetas = {
        ...folderControlState,
        Cedula: cedula,
        NombreColaborador: nombre,
        FolderName: nombreCarpeta,
        FolderPath: folderPath,
      Title: `Control de revisión: ${cedula} - ${nombre}`,
      };

      setFolderControlState(nextState);
      const created = await createEntity(nextState);

      if (created.ok) {
        lastAutoCreatedPathRef.current = folderPath;
        await loadFolderState();
      }

    } finally {
      if (autoCreatingPathRef.current === folderPath) {
        autoCreatingPathRef.current = "";
      }
    }
  }, [selectedFile, searchSpecificFolder, folderControlState, setFolderControlState, createEntity, loadFolderState]);

  // Busca/crea el control únicamente cuando seleccionas una carpeta válida.
  React.useEffect(() => {
    if (!selectedFile?.isFolder) return;
    handleSearchAndCreateControlEntity();
  }, [selectedFile, handleSearchAndCreateControlEntity]);

  const handleReviewFolder = async () => {
    if (isFolderLockedForReview) return;
    setSending(true);
    await folderHistorial.sendFolderToRevision(folderInfo);
    await loadFolderState();
    setSending(false)
  };

  const handleApproveFolder = async () => {
    if (isFolderLockedForApproval) return;
    setSending(true);
    await folderHistorial.approveFolder(folderInfo);
    await loadFolderState();
    setSending(false)
  };

  const handleReturnFolder = async (motivo: string) => {
    setSending(true);
    await folderHistorial.returnFolder(folderInfo, motivo);
    await loadFolderState();
    setSending(false);
  };

  const viewFolderHistory = async () => {
    const historial = await folderHistorial.searchSpecificFolder(folderInfo.cedula);
    setHistorial(historial.folders ?? []);
    setFolderHistory(true);
  };

  return (
    <div className="ce2">
      <aside className="ce2-sb" aria-label="Empresas">
        <div className="ce2-sb__brand">
          <div className="ce2-sb__kicker">Expedientes</div>
        </div>

        <div className="ce2-sb__seg" role="tablist" aria-label="Selector de empresa">
          {EMPRESAS.map((e) => (
            <button key={e.key} role="tab" aria-selected={viewerController.empresa === e.key} type="button" className={"ce2-sb__segBtn" + (viewerController.empresa === e.key ? " is-active" : "")} onClick={() => viewerController.setEmpresa(e.key)}>
              {e.label}
            </button>
          ))}
        </div>
      </aside>

      <section className="ce2-main">
        <header className="ce3-head">
          <div className="ce3-top">
            <div className="ce3-bc" aria-label="Ruta">
              <span className="ce3-bc__root">{EMPRESAS.find((e) => e.key === viewerController.empresa)?.label ?? "Inicio"}</span>

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
              <span className={getEstadoClass(folderState.folders?.Estado!)}><strong>{folderState.folders?.Estado}</strong></span>
              <span className="ce3-kpi">{totalFiles} archivos</span>
              <span className="ce3-kpi">{totalFolders} carpetas</span>
            </div>
          </div>

          <div className="ce3-ctl">
            <div className="ce3-actions">
              {hayRuta && (
                <button type="button" className="ce3-btn ce3-btn--ghost" onClick={viewerController.goUp}>
                  ← Volver
                </button>
              )}

              {showActions && (
                <button type="button" className="ce3-btn ce3-btn--primary" onClick={() => setAgregar(true)}>
                  + Agregar archivo
                </button>
              )}

              {/*Acciones*/}
              {showActions && (
                <details className="ce3-more">
                  <summary className="ce3-btn ce3-btn--ghost ce3-more__sum">
                    Más ▾
                  </summary>

                  <div className="ce3-more__menu">
                    {canInactivateRegister && isActivosOrRetirados && (
                      <button
                        type="button"
                        className="ce3-menuItem"
                        onClick={() =>
                          viewerController.currentPath.toLowerCase().includes("activos")
                            ? viewerController.moveCarpeta("Colaboradores Retirados")
                            : viewerController.moveCarpeta("Colaboradores Activos")
                        }
                      >
                        {viewerController.currentPath.toLowerCase().includes("activos")
                          ? "Marcar como retirado"
                          : "Reintegrar colaborador"}
                      </button>
                    )}

                    {/*Boton de enviar a revisión*/}
                    {canCheckFinishedFolder && (
                      <button
                        type="button"
                        className="ce3-menuItem"
                        onClick={handleReviewFolder}
                        disabled={isFolderLockedForReview || loading}
                        title={
                          isFolderLockedForReview
                            ? "Carpeta en construcción"
                            : loading
                            ? "Cargando estado de la carpeta"
                            : "Enviar carpeta a revisión"
                        }
                      >
                        {reviewButtonLabel}
                      </button>
                    )}

                    {/*Boton de enviar a aprobación*/}
                    {canApprove && (
                      <button 
                        type="button"
                        className="ce3-menuItem"
                        onClick={handleApproveFolder}
                        disabled={isFolderLockedForApproval || loading}
                        title={
                          isFolderLockedForApproval
                            ? "La carpeta esta en construcción o aprobada"
                            : loading
                            ? "Cargando estado de la carpeta"
                            : "Aprobar carpeta"
                        }
                      >
                        {isFolderLockedForApproval ? "Carpeta no apta para aprobar" : sending ? "Cargando..." :"Aprobar carpeta"}
                      </button>
                    )}

                    {/*Boton de devolución*/}
                    {canApprove && (
                      <button
                        type="button"
                        className="ce3-menuItem"
                        onClick={() => setReturnFolder(true)}
                        disabled={isFolderLockedForApproval || loading}
                        title={
                          isFolderLockedForApproval
                            ? "La carpeta esta en construcción o aprobada"
                            : loading
                            ? "Cargando estado de la carpeta"
                            : "Devolver carpeta"
                        }
                      >
                        {isFolderLockedForApproval ? "Carpeta no apta para devolver" : sending ? "Cargando..." : "Devolver carpeta"}
                      </button>
                    )}

                    <button type="button" className="ce3-menuItem" onClick={() => viewFolderHistory()} disabled={sending || loading}>
                        Ver historial
                    </button>
                  </div>
                </details>
              )}
            </div>

            <div className="ce3-filters">
              <select
                className="ce3-select"
                value={viewerController.organizacion}
                onChange={(e) =>
                  viewerController.setOrganizacion(e.target.value as "asc" | "desc")
                }
                aria-label="Orden"
              >
                <option value="asc">Más antiguas</option>
                <option value="desc">Más nuevas</option>
              </select>

              <input
                className="ce3-search"
                placeholder="Buscar por nombre…"
                value={viewerController.search}
                onChange={(e) => viewerController.setSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

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
                <div
                  className="ce2-th ce2-th--act"
                  role="columnheader"
                  aria-label="Acciones"
                />
              </div>
            </div>

            <div className="ce2-tbody" role="rowgroup">
              {viewerController.loading && <div className="ce2-state">Cargando…</div>}

              {!viewerController.loading && viewerController.error && (
                <div className="ce2-state ce2-state--error">
                  {viewerController.error}
                </div>
              )}

              {!viewerController.loading &&
                !viewerController.error &&
                viewerController.items.length === 0 && (
                  <div className="ce2-state">No hay elementos aquí.</div>
                )}

              {!viewerController.loading &&
                !viewerController.error &&
                viewerController.items.map((item) => {
                  const seq = item.isFolder ? "—" : fileIndexById.get(item.id) ?? "--";
                  const date =
                    parseDateFlex(item.lastModified ?? "")?.toLocaleDateString("es-CO") ?? "";

                  return (
                    <button key={item.id} type="button" className="ce2-tr ce2-rowBtn" role="row" onClick={() => {setSelectedFile(item); viewerController.openItem(item);}}>                   <div className="ce2-td ce2-td--seq" role="cell">
                        <span className={"ce2-seq" + (seq === "—" ? " is-ghost" : "")}>
                          {seq}
                        </span>
                      </div>

                      <div className="ce2-td ce2-td--name" role="cell">
                        <span className={"ce2-ico " + (item.isFolder ? "is-folder" : "is-file")} aria-hidden="true"/>

                        <span className="ce2-name" title={item.name}>
                          {item.name}
                        </span>

                        {item.isFolder && typeof item.childCount === "number" ? (
                          <span className="ce2-pill">
                            {item.childCount}{" "}
                            {item.childCount === 1 ? "elemento" : "elementos"}
                          </span>
                        ) : null}
                      </div>

                      <div className="ce2-td ce2-td--date" role="cell">
                        <span className="ce2-date">{date}</span>
                      </div>

                      <div className="ce2-td ce2-td--act" role="cell">
                        {showActions && (
                          <>
                            <button type="button" className="ce2-iconBtn" onClick={(e) => {e.stopPropagation(); handleOpenRename(item);}} aria-label="Renombrar" title="Renombrar">
                               ✎
                            </button>

                            {canDelete && (
                              <button
                                type="button"
                                className="ce2-iconBtn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewerController.handleDelete(item.id, item.name);
                                }}
                                aria-label="Eliminar"
                                title="Eliminar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 26 26">
                                  <path fill="#ff0000" d="M11.5-.031c-1.958 0-3.531 1.627-3.531 3.594V4H4c-.551 0-1 .449-1 1v1H2v2h2v15c0 1.645 1.355 3 3 3h12c1.645 0 3-1.355 3-3V8h2V6h-1V5c0-.551-.449-1-1-1h-3.969v-.438c0-1.966-1.573-3.593-3.531-3.593h-3zm0 2.062h3c.804 0 1.469.656 1.469 1.531V4H10.03v-.438c0-.875.665-1.53 1.469-1.53zM6 8h5.125c.124.013.247.031.375.031h3c.128 0 .25-.018.375-.031H20v15c0 .563-.437 1-1 1H7c-.563 0-1-.437-1-1V8zm2 2v12h2V10H8zm4 0v12h2V10h-2zm4 0v12h2V10h-2z"
                                  />
                                </svg>
                              </button>
                            )}
                          </>
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

        {agregar ? (
          <SimpleFileUpload folderPath={viewerController.currentPath} onClose={() => setAgregar(false)}  handleUploadClick={viewerController.handleUploadClick}/>
        ) : null}

        <RenameModal open={edit} selectedFile={selectedFile!} onClose={() => setEdit(false)} biblioteca={viewerController.empresa} recargar={viewerController.reload}/>

        <CancelProcessModal open={cancelProcess} onClose={() => setCancelProcess(false)} onEliminar={handleCancel}/>

        <ReasonModal open={returnFolder} onClose={() => setReturnFolder(false)} onSend={handleReturnFolder} title={"Devolver carpeta"}/>

        <TableModal open={folderHistory} title={"Historial de Revisiones"} rows={historial} columns={columns} onClose={() => setFolderHistory(false)}/>
      </section>
    </div>
  );
};
