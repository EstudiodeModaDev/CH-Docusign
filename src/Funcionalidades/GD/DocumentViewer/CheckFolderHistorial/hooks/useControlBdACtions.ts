import { useGraphServices } from "../../../../../graph/graphContext";
import type { HistorialRevisionCarpetas } from "../../../../../models/DocumentViewer";

export function useFolderHistorialActions() {
  const graph = useGraphServices()

  const handleSubmitBd = async (state: Partial<HistorialRevisionCarpetas>): Promise<HistorialRevisionCarpetas> => {
    try {
      console.log("Enviando a creación con estado:", state);
      const created = await graph.historialRevisionCarpetas.create(state);
      console.log("Se ha creado la entidad de la carpeta con éxito", created)
      return created
    } catch {
      throw new Error("Algo ha salido mal")
    }
  };

  return {
    handleSubmitBd,

  };
}



