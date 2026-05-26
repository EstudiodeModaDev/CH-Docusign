import * as React from "react";
import "../Empresas.css";
import { useUnidadNegocio, } from "../../../../Funcionalidades/Desplegables";
import type { withCode } from "../../../../models/Maestros";
import type { maestro } from "../../../../models/Desplegables";
import { useCoreGraphServices } from "../../../../graph/graphContext";
import { notify } from '../../../../utils/notify';

export const UnidadNegocioManager: React.FC = () => {
    const { Maestro, } = useCoreGraphServices();
    const { items, add, editItem, reload, remove} = useUnidadNegocio(Maestro);
    const [isEditing, setIsEditing] = React.useState(false);
    const [state, setState] = React.useState<withCode>({ Title: "", Codigo: ""})
    const [isAdding, setIsAdding] = React.useState<boolean>(false)

    const handleAddNew = () => {
        if(!state.Title){
            notify.auto("Rellene todos los campos")
        }
        const payload: maestro = {
            Abreviacion: "",
            Title: "Unidad de negocio",
            Codigo: state.Codigo,
            T_x00ed_tulo1: state.Title,
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
                <button type="button" className="btn btn-primary btn-xs" onClick={() => {setIsAdding(true); setState({...state, Title: "", Codigo: ""})}}>
                    <span className="emp-add-btn__icon">＋</span>
                    Añadir nueva UN
                </button>
            </div>

            <div className="emp-layout">
                {/* Lista izquierda */}
                <section className="emp-list">
                {items.map((CO) => (
                    <div key={CO.Id} className={ "emp-row"}>
                    <button type="button" className="emp-row__name" onClick={() => {setIsEditing(true); setState({Codigo: CO.Codigo, Title: CO.T_x00ed_tulo1, Id: CO.Id});}}>
                        {CO.T_x00ed_tulo1}
                    </button>

                    <div className="emp-row__actions">
                        <button type="button" className="emp-icon-btn" title="Eliminar"  onClick={() => handleDelete(CO.Id ?? "")}>
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
                                <label className="emp-label" htmlFor="empresaNombre">Unidad de negocio</label>
                                <input id="empresaNombre" type="text" className="emp-input" placeholder="Unidad de negocio" value={state?.Title} onChange={(e) => setState({...state, Title: e.target.value.toUpperCase()})}/>
                            </div>
                            <div className="emp-field">
                                <label className="emp-label" htmlFor="empresaNombre">Codigo</label>
                                <input id="empresaNombre" type="text" className="emp-input" placeholder="Codigo" value={state?.Codigo} onChange={(e) => setState({...state, Codigo: e.target.value.toUpperCase()})}/>
                            </div>
                            { isEditing &&
                                <div className="emp-actions">
                                    <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                    <button type="button" className="emp-btn emp-btn--ok" onClick={async () => {
                                                                                            console.table(state)
                                                                                            if(editItem){
                                                                                                await editItem({Title: "Unidad de negocio", T_x00ed_tulo1: state?.Title}, state!.Id ?? "", );
                                                                                                notify.auto("Se ha editado la unidad de negocio con éxito")
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
                                    <button type="button" className="emp-btn emp-btn--ok" onClick={async () => {
                                                                                                    try {
                                                                                                    if (!add) return;

                                                                                                    const payload = await handleAddNew(); // ✅ esperar
                                                                                                    if (!payload?.T_x00ed_tulo1?.trim()) return;

                                                                                                    await add(payload); // ✅ esperar
                                                                                                    notify.auto("Se ha agregado con éxito la UN");
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


