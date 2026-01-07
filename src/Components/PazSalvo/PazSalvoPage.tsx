import * as React from "react";
import { PazSalvosEnviados } from "./PazSalvosHome/PazSalvo";
import { PazSalvoForm } from "./SolicitarPazSalvo/NewPazSalvo";
import { useGraphServices } from "../../graph/graphContext";
import { usePermisosPazSalvos } from "../../Funcionalidades/PazSalvos/PermisosPaz";
import { useAuth } from "../../auth/authProvider";
import { useRenovar } from "../../Funcionalidades/PazSalvos/Renovar";
import { useFirmaUsuario } from "../../Funcionalidades/PazSalvos/Firmas";
import { FirmaPicker } from "./SignPicker/SignPicker";
import "./PazSalvo.css";
import { MotivoAdjuntosForm } from "./RespuestaPazSalvo/RespuestaPazSalvo";
import type { PazSalvo } from "../../models/PazSalvo";
import { PazSalvoRespuestasTable } from "./VerRespuestasPazSalvo/VerRespuestasPazSalvo";

export const PazSalvoPage: React.FC = () => {
  const [selectedModule, setSelectedModule] = React.useState<string>("home");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [selectedPazSalvo, setSelectedPazSalvo] = React.useState<PazSalvo | null>(null);
  const { account } = useAuth();
  const username = account?.username || ""; 
  const { PermisosPaz, Renovar, Firmas } = useGraphServices();
  const { isAdmin, checkAdmin } = usePermisosPazSalvos(PermisosPaz);
  const { loadRenovables, updateState } = useRenovar(Renovar);
  const { firmaItem, refresh } = useFirmaUsuario(Firmas, username);
  
  /*
  const needRenovar = async (correo: string) => {
    if (!correo) return;
    setLoading(true);

    try {
      const existentes = await loadRenovables();

      if (existentes && existentes[0]?.Estado === "Renovar") {
        setSelectedModule("MustRenovar");
      }
    } finally {
      setLoading(false);
    }
  };*/

  const oldSign = async (correo: string) => {
    if (!correo) return;

    setLoading(true);
    try {
      const firma = await refresh(); 

      const existentes = await loadRenovables();
      if (existentes && existentes[0]?.Estado === "Renovado" && firma?.lastModified) {
        const lastModifiedDate = new Date(firma.lastModified);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastModifiedDate.getTime()); // milisegundos
        const diffDays = diffTime / (1000 * 60 * 60 * 24); // ms → días
        if (diffDays > 95) {
          setSelectedModule("MustRenovar");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const dontHaveSign = async (correo: string) => {
    if (!correo) return;

    setLoading(true);
    try {
      const firma = await refresh(); 

      if (!firma) {
        setSelectedModule("MustRenovar");
      }
    } finally {
      setLoading(false);
    }
  };

  const singInProcess = async () => {
    const user = account?.username || "";
    await (oldSign(user));
    await checkAdmin(user);
    //await needRenovar(user);
    await dontHaveSign(username)
  };

  React.useEffect(() => {
    singInProcess();
  }, [account]);

  const url = `${firmaItem?.serverUrl}${firmaItem?.serverRelativeUrl}`;

  return (
    <div>
      {loading ? (<p>Cargando...</p>) : 
      selectedModule === "MustRenovar" ? (  <div className="firma-alert">
                                              <p>Debe actualizar su firma</p>
                                              <FirmaPicker src={url} disabled={loading} onChangeFile={async (file) => {
                                                                                              await Firmas.uploadImage(file, "Firmas", `${username}.png`);
                                                                                              await updateState()
                                                                                            }}/>
                                              <small>Para actualizar su firma debe ir a su correo, descargar la firma que tiene configurada y subirla aqui.</small>
                                              <small>Después de actualizar su firma, podrá continuar solicitando paz y salvo.</small>
                                            </div>
                                            ) : 
      selectedModule === "home" ? (<PazSalvosEnviados onNew={() => setSelectedModule("new")} onSelectRow={(p) => { setSelectedPazSalvo(p); } } isAdmin={isAdmin} changeView={setSelectedModule}/>) : 
      selectedModule === "new" ? (<PazSalvoForm onBack={() => setSelectedModule("home")} /> ) : 
      selectedModule === "respuesta" ? (<MotivoAdjuntosForm IdPazSalvo={selectedPazSalvo!} onBack={() => {setSelectedModule("home")}} /> ) : 
      selectedModule === "verRespuestas" ? (<PazSalvoRespuestasTable pazSalvo={selectedPazSalvo!} onBack={() => setSelectedModule("home")}></PazSalvoRespuestasTable>) : null}
    </div>
  );
};
