import type { historicoFecha } from "../../../../models/Requisiciones/historicoFechas";
import { useRequisicionesServices } from "../../../../graph/graphContext";
import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";

type Props = {
};

export function useHistoricoFechas({ }: Props) {
  const {
    historicoFechas,
  } = useRequisicionesServices();

  const createNewAnsLog = async (r: requisiciones, motivo: string, nuevaFecha: string): Promise<boolean> => {
    try{
      await historicoFechas.create({
        Title: r.Id ?? "",
        ANS: r.ANS,
        fechaComentario: new Date(),
        fechaLimite: r.fechaLimite ?? "",
        observacion: motivo,
        Nuevo_Ans: nuevaFecha,
        Accion: "Postergación de ANS"
      });

      return true
    }catch(e){
      throw new Error("No se ha podido crear el registro de historico de fechas " + e)
    }
  };

  const createNewGeneralLog = async (r: requisiciones, observacion: string, accion: string): Promise<boolean> => {
    try{
      await historicoFechas.create({
        Title: r.Id ?? "",
        ANS: "",
        fechaComentario: new Date().toISOString(),
        fechaLimite: r.fechaLimite ?? "",
        observacion: observacion,
        Nuevo_Ans: "",
        Accion: accion
      });

      return true
    }catch(e){
      throw new Error("No se ha podido crear el registro de historico de fechas " + e)
    }
  };

  const getRequisicionLogs = async (r: requisiciones,): Promise<{
    ok: boolean;
    data: historicoFecha[];
  }> => {
    try{
      const logs = await historicoFechas.getAll({
        filter: `fields/Title eq '${r.Id}'`,
        top: 500
      });

      const data = [...logs.items].sort(
        (a, b) => new Date(b.fechaComentario).getTime() - new Date(a.fechaComentario).getTime()
      );

      return { ok: true, data };
    }catch(e){
      throw new Error("No se ha podido obtener el historico de la requisicion " + e)
    }
  };



  return {
    createNewAnsLog,
    createNewGeneralLog,
    getRequisicionLogs
  };
}


