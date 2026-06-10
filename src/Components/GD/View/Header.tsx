import * as React from "react";
import "./ViewerDocument.css";
import { useColaboradoresExplorer } from "../../../Funcionalidades/GD/DocumentViewer/hooks/useColaboradoresExplorer";
import { buildBreadcrumb, getEstadoClass, normalizeEstado, } from "./utils/Helpers";
import { useDocumentPermissions } from "../../../Funcionalidades/Common/usePermissions";
import {  EMPRESAS } from "./utils/Constants";

type ColaboradoresExplorerHeader = {
  folderState:string;
  setAgregar: (value: boolean) => void;
  viewerController: ReturnType<typeof useColaboradoresExplorer>;
  handleReviewFolder: () => void;
  loading: boolean;
  sending: boolean;
  handleApproveFolder: () => void;
  setReturnFolder: (value: boolean) => void;
  viewFolderHistory: () => void;
};

export const ColaboradoresExplorerHeader: React.FC<ColaboradoresExplorerHeader> = ({loading, sending,  folderState, setAgregar, viewerController, handleReviewFolder, handleApproveFolder, setReturnFolder, viewFolderHistory}) => {
  const { canInactivateRegister, canCheckFinishedFolder, canApprove, } = useDocumentPermissions();

  const hayRuta = !!viewerController.currentPath.trim();
  const showActions = viewerController.depth >= 2;

  const breadcrumbParts = React.useMemo(() => buildBreadcrumb(viewerController.currentPath), [viewerController.currentPath]);

  const totalItems = viewerController.items.length;

  const totalFolders = React.useMemo(() => viewerController.items.filter((i) => i.isFolder).length, [viewerController.items]);

  const totalFiles = totalItems - totalFolders;

  const isActivosOrRetirados = viewerController.currentPath.toLowerCase().includes("activos") || viewerController.currentPath.toLowerCase().includes("retirados");

  const currentEstado = React.useMemo(() => {return normalizeEstado(folderState);}, [folderState]);

  const isFolderLockedForReview = React.useMemo(() => {return currentEstado === "en revisión" || currentEstado === "aprobada";}, [currentEstado]);
  const isFolderLockedForApproval = React.useMemo(() => { return currentEstado === "aprobada" || currentEstado === "en construcción"}, [currentEstado]);

  const reviewButtonLabel = React.useMemo(() => {
    if (currentEstado === "aprobada") return "Carpeta aprobada";
    if (currentEstado === "en revisión") return "Carpeta en revisión";
    return "Enviar a revisión";
  }, [currentEstado]);
  

  return (
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
          <span className={getEstadoClass(folderState)}><strong>{folderState}</strong></span>
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
  );
};
