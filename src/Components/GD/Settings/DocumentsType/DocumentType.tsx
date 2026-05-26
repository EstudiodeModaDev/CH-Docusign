import * as React from "react";
import "../Empresas.css";
import { useCoreGraphServices } from "../../../../graph/graphContext";
import { useTipoDocumentoSelect } from "../../../../Funcionalidades/Desplegables";
import type { maestro } from "../../../../models/Desplegables";
import { notify } from '../../../../utils/notify';

export const DocumentTypeManager: React.FC = () => {
    const { Maestro, } = useCoreGraphServices();
    const { items, add, editItem, reload, remove} = useTipoDocumentoSelect(Maestro);
    const [isEditing, setIsEditing] = React.useState(false);
    const [state, setState] = React.useState<maestro>({ T_x00ed_tulo1: "", Abreviacion: "", Title: "", Codigo: ""})
    const [isAdding, setIsAdding] = React.useState<boolean>(false)

    const handleAddNew = () => {
        if(!state.T_x00ed_tulo1 || !state.Abreviacion){
            notify.auto("Rellene todos los campos")
        }
        const payload: maestro = {
            Abreviacion: state.Abreviacion,
            Title: "Tipos de documentos",
            Codigo: "",
            T_x00ed_tulo1: state.T_x00ed_tulo1
        }
        return payload
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres eliminar esta empresa?")) return;
        setIsAdding(false)
        setIsEditing(false)
        if(remove){
            await remove(id);
        }
        reload()
    };

    React.useEffect(() => {
        reload();
    }, [reload]);

    return (
        <div className="emp-page">
        {/* Botón superior */}
        <div className="emp-header">
            <button type="button" className="btn btn-primary btn-xs" onClick={() => {setIsAdding(true); setState({...state, T_x00ed_tulo1: "", Abreviacion: ""})}}>
                <span className="emp-add-btn__icon">＋</span>
                Añadir tipo de documento
            </button>
        </div>

        <div className="emp-layout">
            {/* Lista izquierda */}
            <section className="emp-list">
            {items.map((tipoDoc) => (
                <div key={tipoDoc.Id} className={ "emp-row"}>
                <button type="button" className="emp-row__name" onClick={() => {setIsEditing(true); setState(tipoDoc)}}>
                    {tipoDoc.T_x00ed_tulo1}
                </button>

                <div className="emp-row__actions">
                    <button type="button" className="emp-icon-btn" title="Eliminar"  onClick={() => handleDelete(tipoDoc.Id ?? "")}>
                        🗑
                    </button>
                </div>
                </div>
            ))}
            </section>


            { (isAdding || isEditing) &&
                <>
                    <section className="emp-form">
                        <div className="emp-field">
                            <label className="emp-label" htmlFor="empresaNombre">Tipo de documento</label>
                            <input id="empresaNombre" type="text" className="emp-input" placeholder="Tipo de documento" value={state?.T_x00ed_tulo1.toUpperCase()} onChange={(e) => setState({...state, T_x00ed_tulo1: e.target.value})}/>
                        </div>
                        <div className="emp-field">
                            <label className="emp-label" htmlFor="empresaNombre">Abreviación del tipo</label>
                            <input id="empresaNombre" type="text" className="emp-input" placeholder="Abreviación" value={state?.Abreviacion.toUpperCase()} onChange={(e) => setState({...state, Abreviacion   : e.target.value})}/>
                        </div>
                        { isEditing &&
                            <div className="emp-actions">
                                <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                <button type="button" className="emp-btn emp-btn--ok" onClick={async () => {
                                                                                        console.table(state)
                                                                                        if(editItem){
                                                                                            await editItem({T_x00ed_tulo1: state?.T_x00ed_tulo1, Abreviacion: state.Abreviacion}, state!.Id ?? "", );
                                                                                            notify.auto("Se ha actualizado con éxito el tipo de documento")
                                                                                            setIsAdding(false)
                                                                                            setIsEditing(false)
                                                                                            reload()
                                                                                        }
                                                                                        setIsEditing(false);}}>✔</button>
                            </div>
                        }
                        { isAdding &&
                            <div className="emp-actions">
                                <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                <button type="button" className="emp-btn emp-btn--ok"  onClick={async () => {
                                                                                                    try {
                                                                                                    if (!add) return;

                                                                                                    const payload = await handleAddNew(); // ✅ esperar
                                                                                                    if (!payload?.T_x00ed_tulo1?.trim()) return;

                                                                                                    await add(payload); // ✅ esperar
                                                                                                    notify.auto("Se ha agregado con éxito el tipo de documento");
                                                                                                    setIsEditing(false)
                                                                                                    setIsAdding(false)
                                                                                                    } catch (e: any) {
                                                                                                    console.error(e);
                                                                                                    notify.auto("Error agregando el cargo: " + (e?.message ?? e));
                                                                                                    }
                                                                                                }}>✔</button>
                            </div>
                        }
                    </section>
                </>
            }
        </div>
        </div>
    );
};


