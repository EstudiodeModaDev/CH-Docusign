import * as React from "react";
import "./ViewerDocument.css";
import { useColaboradoresExplorer } from "../../Funcionalidades/DocumentViewer";
import { SimpleFileUpload } from "../AddFile/AddFile";

type EmpresaKey = "estudio" | "dh";


/* ================== Componente único ================== */
export const ColaboradoresExplorer: React.FC = () => {
    const { empresa, currentPath, items, loading, error, search,
        setEmpresa, setSearch, depth, goUp, openItem} = useColaboradoresExplorer();
    const [agregar, setAgregar] = React.useState<boolean>(false)
 
    const hayRuta = !!currentPath.trim();

    return (
        <div className="colab-explorer">
        {/* Sidebar */}
            <aside className="colab-explorer__sidebar">
                <h2 className="colab-explorer__sidebar-title">Colaboradores</h2>

                <button type="button" className={"colab-explorer__empresa-btn" + (empresa === "estudio" ? " colab-explorer__empresa-btn--active" : "")} onClick={() => setEmpresa("estudio")}>
                Estudio de Moda
                </button>

                <button type="button"  className={"colab-explorer__empresa-btn" + (empresa === "dh" ? " colab-explorer__empresa-btn--active" : "")} onClick={() => setEmpresa("dh")}>
                DH Retail
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
                            <button type="button" className="colab-explorer__up-btn" onClick={() => setAgregar(true)}>Agregar archivo</button>
                        )}
                    </div>

                    <div className="colab-explorer__toolbar-right">
                        <div className="colab-explorer__search">
                            <span className="colab-explorer__search-icon" aria-hidden="true">🔍</span>
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
                    {!loading && !error &&
                        items.map((item) => (
                            <button key={item.id} type="button" className="colab-explorer__row" onClick={() => openItem(item)} >
                                <div className="colab-explorer__row-left">
                                    <span   className={item.isFolder ? "colab-explorer__folder-icon" : "colab-explorer__file-icon"} aria-hidden="true"/>
                                    <span className="colab-explorer__row-name">{item.name}</span>
                                </div>
                            </button>
                        ))}
                </div>
                {agregar ? <SimpleFileUpload folderPath={currentPath} onClose={() => setAgregar(false)}></SimpleFileUpload> : null}
            </section>
        </div>
    );
};
