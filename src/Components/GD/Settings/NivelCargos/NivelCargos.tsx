import * as React from "react";
import "../Empresas.css";
import { useGraphServices } from "../../../../graph/graphContext";
import { useNivelCargo, } from "../../../../Funcionalidades/Desplegables";
import type { maestro } from "../../../../models/Desplegables";

export const NivelCargosManager: React.FC = () => {
    const { Maestro, } = useGraphServices();
    const { items, add, editItem, reload, remove} = useNivelCargo(Maestro);
    const [isEditing, setIsEditing] = React.useState(false);
    const [state, setState] = React.useState<maestro>({ T_x00ed_tulo1: "", Abreviacion: "", Title: "", Codigo: ""})
    const [isAdding, setIsAdding] = React.useState<boolean>(false)

    const handleAddNew = () => {
        if(!state.T_x00ed_tulo1){
            alert("Rellene todos los campos")
        }
        const payload: maestro = {
            Abreviacion: state?.Abreviacion,
            Title: "Nivel de cargos",
            Codigo: "",
            T_x00ed_tulo1: state.T_x00ed_tulo1.toUpperCase()
        }
        setState({ T_x00ed_tulo1: "", Abreviacion: "", Title: "", Codigo: ""})
        alert("Se ha añadido con éxito")
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
                <button type="button" className="btn btn-primary btn-xs" onClick={() => {setIsAdding(true); setState({...state, T_x00ed_tulo1: ""})}}>
                    <span className="emp-add-btn__icon">＋</span>
                    Añadir nuevo nivel
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
                                <label className="emp-label" htmlFor="empresaNombre">Cargos</label>
                                <input id="empresaNombre" type="text" className="emp-input" placeholder="Tipo de documento" value={state?.T_x00ed_tulo1} onChange={(e) => setState({...state, T_x00ed_tulo1: e.target.value})}/>
                            </div>
                            { isEditing &&
                                <div className="emp-actions">
                                    <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                    <button type="button" className="emp-btn emp-btn--ok" onClick={async () => {
                                                                                            console.table(state)
                                                                                            if(editItem){
                                                                                                await editItem({Title: "Nivel de cargos", T_x00ed_tulo1: state?.T_x00ed_tulo1}, state!.Id ?? "", );
                                                                                                alert("Se ha editado con exito el nivel de cargo")
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
                                                                                                    alert("Se ha agregado con éxito el nivel de cargo");
                                                                                                    setIsEditing(false)
                                                                                                    setIsAdding(false)
                                                                                                    } catch (e: any) {
                                                                                                    console.error(e);
                                                                                                    alert("Error agregando el cargo: " + (e?.message ?? e));
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
