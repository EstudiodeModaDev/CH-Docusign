export interface log{
  modulo: "Requisiciones" | "Contrataciones" | "Permisos" | "Documentos" | "Configuracion" | "Paz y salvos" | "Requisiciones";
  id_item_afectado: string
  accion: "Creacion" | "Edicion" | "Eliminacion" | "Error" | "Aprobacion" | "CambioPermisos" | "Rechazo"
  descripcion: string;
  detalle: string;
  actor: string;
  correo_actor: string;
  Created: string;
  resultado: "Exito" | "Error"
}