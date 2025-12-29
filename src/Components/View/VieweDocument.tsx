import * as React from "react";
import "./ViewerDocument.css";
import { useColaboradoresExplorer } from "../../Funcionalidades/DocumentViewer";
import { SimpleFileUpload } from "../AddFile/AddFile";
import { parseDateFlex } from "../../utils/Date";
import { RenameModal } from "./ChangeName/ChangeName";
import { CancelProcessModal} from "./CancelProcess/CancelProcess"
import type { Archivo } from "../../models/archivos";
import { useContratos } from "../../Funcionalidades/Contratos";
import { useGraphServices } from "../../graph/graphContext";

/* ================== Componente único ================== */
export const ColaboradoresExplorer: React.FC = () => {
    const {Contratos, NovedadCancelada} = useGraphServices()
    const { empresa, currentPath, items, loading, error, search, setEmpresa, setSearch, depth, goUp, openItem, reload, handleCancelProcess, moveCarpeta, organizacion, setOrganizacion} = useColaboradoresExplorer();
    const { handleCancelProcess: elimarProceso} = useContratos(Contratos,NovedadCancelada)
    const [agregar, setAgregar] = React.useState<boolean>(false)
    const [edit, setEdit] = React.useState<boolean>(false)
    const [selectedFile, setSelectedFile] = React.useState<Archivo | null>(null)
    const [cancelProcess, setCancelProcess] = React.useState<boolean>(false)
 
    const hayRuta = !!currentPath.trim();

    const handleCancel = async (razon: string) => {
        const parts = currentPath.split("/").filter(Boolean);
        const lastRoute = (parts.at(-1) ?? "").trim();
        const lastRoutSplited =  lastRoute.split("-")
        const cedula = (lastRoutSplited.at(0) ?? "").trim();
        await elimarProceso(cedula, razon)
        await handleCancelProcess()
        setCancelProcess(false)
    };

    return (
        <div className="colab-explorer">
        {/* Sidebar */}
            <aside className="colab-explorer__sidebar">
                <h2 className="colab-explorer__sidebar-title">Colaboradores</h2>

                <button type="button" className={"colab-explorer__empresa-btn" + (empresa === "estudio" ? " colab-explorer__empresa-btn--active" : "")} onClick={() => setEmpresa("estudio")}>
                    ESTUDIO DE MODA
                </button>

                <button type="button"  className={"colab-explorer__empresa-btn" + (empresa === "dh" ? " colab-explorer__empresa-btn--active" : "")} onClick={() => setEmpresa("dh")}>
                    DH RETAIL
                </button>

                <button type="button"  className={"colab-explorer__empresa-btn" + (empresa === "denim" ? " colab-explorer__empresa-btn--active" : "")} onClick={() => setEmpresa("denim")}>
                    DENIM HEAD
                </button>

                <button type="button"  className={"colab-explorer__empresa-btn" + (empresa === "visual" ? " colab-explorer__empresa-btn--active" : "")} onClick={() => setEmpresa("visual")}>
                    VISUAL
                </button>
            </aside>

        {/* Panel derecho */}
            <section className="colab-explorer__main">
                <header className="colab-explorer__toolbar">
                    <div className="colab-explorer__toolbar-left">

                        {hayRuta && (
                            <button type="button" className="colab-explorer__up-btn" onClick={goUp}>↑ Volver atras</button>
                            
                        )}

                        {depth >= 2 && (
                            <>
                                <button type="button" className="colab-explorer__up-btn" onClick={() => setAgregar(true)}>Agregar archivo</button>
                                {currentPath.toLocaleLowerCase().includes("activos") || currentPath.toLocaleLowerCase().includes("retirados") ?
                                    <button type="button" className="colab-explorer__up-btn" onClick={() => currentPath.toLocaleLowerCase().includes("activos") ?
                                                                                                        moveCarpeta("Colaboradores Retirados"):
                                                                                                        moveCarpeta("Colaboradores Activos")}>
                                        {currentPath.toLocaleLowerCase().includes("activos") ? "Colaborador retirado" : "Reintegrar colaborador"}
                                    </button> : null
                                }
                                {currentPath.toLocaleLowerCase().includes("activos") || currentPath.toLocaleLowerCase().includes("cancelados") ?
                                    <button type="button" className="colab-explorer__up-btn btn-danger" onClick={() => setCancelProcess(true)}>
                                        {currentPath.toLocaleLowerCase().includes("activos") ? "Inactivar proceso" : "Reactivar proceso"}
                                    </button> : null
                                }
                            </>
                        )}
                    </div>

                    <div className="colab-explorer__toolbar-right">
                        <select name="orden" id="orden" onChange={(e) => setOrganizacion(e.target.value)} value={organizacion}>
                            <option value="asc" selected>Mas antiguas primero</option>
                            <option value="desc">Mas nuevas primero</option>
                        </select>
                        <div className="colab-explorer__search">
                            <input type="text" placeholder="Buscar por nombre" value={search} onChange={(e) => setSearch(e.target.value)} className="colab-explorer__search-input"/>
                        </div>
                    </div>
                </header>

                <div className="colab-explorer__list">
                    {loading && <p className="colab-explorer__info">Cargando…</p>}
                    {error && !loading && (<p className="colab-explorer__error">{error}</p>)}
                    {!loading && !error && items.length === 0 && (
                        <p className="colab-explorer__info">No se encontraron elementos en esta carpeta.</p>
                    )}
                    {!loading && !error && items.map((item) => (
                        <button key={item.id} type="button" className="colab-explorer__row" onClick={() => openItem(item)}>
                            <div className="colab-explorer__row-left">
                                <span className={item.isFolder ? "colab-explorer__folder-icon" : "colab-explorer__file-icon"} aria-hidden="true"/>
                                <span className="colab-explorer__row-name">{item.name}</span>
                                <span className="colab-explorer__row-date">{parseDateFlex(item.lastModified ?? "")?.toLocaleDateString("es-CO") ?? ""}</span>
                            </div>

                            {depth >= 2 && (
                                <div className="colab-explorer__row-right">
                                    <button type="button" className="colab-explorer__edit-btn" onClick={(e) => {e.stopPropagation(); setSelectedFile(item); setEdit(true);}} aria-label="Editar nombre"                            >
                                        <span className="colab-explorer__edit-icon" aria-hidden="true" />
                                    </button>
                                </div>
                            )}
                        </button>
                    ))}
                        
                </div>
                {agregar ? <SimpleFileUpload folderPath={currentPath} onClose={() => setAgregar(false)}></SimpleFileUpload> : null}
                <RenameModal open={edit} selectedFile={selectedFile!} onClose={() => setEdit(false) } biblioteca={empresa} recargar={reload}></RenameModal>
                <CancelProcessModal open={cancelProcess} onClose={() => setCancelProcess(false) } onEliminar={handleCancel}/>
            </section>
        </div>
    );
};
