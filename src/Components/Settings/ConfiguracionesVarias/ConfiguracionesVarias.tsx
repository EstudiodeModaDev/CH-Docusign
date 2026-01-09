import * as React from "react";
import "../Empresas.css";
import { useGraphServices } from "../../../graph/graphContext";
import type { configuraciones } from "../../../models/Desplegables";

export const ConfiguracionesVariasComponent: React.FC = () => {
    const { configuraciones, } = useGraphServices();
    const [isEditing, setIsEditing] = React.useState(false);
    const [state, setState] = React.useState<configuraciones>({ Title: "", Valor: ""})
    const [rows, setRows] = React.useState<configuraciones[]>([])

    const loadConfigs = async () => {
        const configs = await configuraciones.getAll()
        setRows(configs)
    };

    
    const editItem = async (): Promise<boolean> => {
        if(!state.Valor){
            alert("El parametro debe tener un valor")
            return false
        }

        configuraciones.update(state.Id ?? "", {Valor: state.Valor.trim()})
        return true
    };
    

    React.useEffect(() => {
        loadConfigs()
    }, [loadConfigs]);

    return (
        <div className="emp-page">

        <div className="emp-layout">
            {/* Lista izquierda */}
            <section className="emp-list">
            {rows.map((c) => (
                <div key={c.Id} className={ "emp-row"}>
                    <button type="button" className="emp-row__name" onClick={() => {setIsEditing(true); setState(c)}}>
                        {c.Title}
                    </button>
                </div>
            ))}
            </section>


            { (isEditing) &&
                <>
                    <section className="emp-form">
                        <div className="emp-field">
                            <label className="emp-label" htmlFor="empresaNombre">Nombre del parametro</label>
                            <input id="empresaNombre" type="text" className="emp-input" placeholder="Nombre del parametro" value={state?.Title.toUpperCase()} disabled/>
                        </div>
                        <div className="emp-field">
                            <label className="emp-label" htmlFor="empresaNombre">Valor del parametro</label>
                            <input id="empresaNombre" type="text" className="emp-input" placeholder="Abreviación" value={state?.Valor.toUpperCase()} onChange={(e) => setState({...state, Valor   : e.target.value})}/>
                        </div>
                        { isEditing &&
                            <div className="emp-actions">
                                <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false);}}>✕</button>
                                <button type="button" className="emp-btn emp-btn--ok" onClick={async () => {
                                                                                        console.table(state)
                                                                                        if(editItem){
                                                                                            const next = await editItem();
                                                                                            if(next){
                                                                                                alert("Se ha actualizado con éxito el tipo de documento")
                                                                                                setIsEditing(false)
                                                                                                loadConfigs()
                                                                                            }

                                                                                        }}}>✔</button>
                            </div>
                        }
                    </section>
                </>
            }
        </div>
        </div>
    );
};
