export const FEATURES = {
  Contrataciones: ["contrataciones.inactivate", "contrataciones.add", "contrataciones.delete", "contrataciones.edit", "contrataciones.view",],
  Cesaciones: ["cesaciones.inactivate", "cesaciones.add", "cesaciones.delete", "cesaciones.edit", "cesaciones.view",],
  Documentos: ["documents.add", "documents.edit", "documents.explore", "documents.retirement", "documents.send", "documents.view",],
  Habeas: ["habeas.add", "habeas.delete", "habeas.edit", "habeas.view",],
  Parametros: ["parametros.edit"],
  PazYSalvos: ["paz.send", "paz.view", "paz.viewAll"],
  Promociones: ["promociones.inactivate", "promociones.add", "promociones.delete", "promociones.edit", "promociones.view",],
  Retail: ["retail.inactivate", "retail.add", "retail.delete", "retail.edit", "retail.view",],
  Reportes: ["reports.view"],
  Requisiciones: ["requisiciones.viewAll"],
  Accesos: ["acess.view"]
} as const;

// ✅ FeatureKey sale automáticamente de FEATURES
export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES][number];

export type ModuleKey = keyof typeof FEATURES;

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  "contrataciones.view": "Ver",
  "contrataciones.add": "Crear",
  "contrataciones.edit": "Editar",
  "contrataciones.delete": "Eliminar",
  "contrataciones.inactivate": "Inactivar",

  "cesaciones.view": "Ver",
  "cesaciones.add": "Crear",
  "cesaciones.edit": "Editar",
  "cesaciones.delete": "Eliminar",
  "cesaciones.inactivate": "Inactivar",

  "documents.view": "Ver",
  "documents.explore": "Explorar",
  "documents.add": "Subir",
  "documents.edit": "Editar",
  "documents.send": "Enviar",
  "documents.retirement": "Retiro",

  "habeas.view": "Ver",
  "habeas.add": "Crear",
  "habeas.edit": "Editar",
  "habeas.delete": "Eliminar",

  "parametros.edit": "Editar parámetros",

  "paz.view": "Ver",
  "paz.viewAll": "Ver todos",
  "paz.send": "Enviar",

  "promociones.view": "Ver",
  "promociones.add": "Crear",
  "promociones.edit": "Editar",
  "promociones.delete": "Eliminar",
  "promociones.inactivate": "Inactivar",

  "retail.view": "Ver",
  "retail.add": "Crear",
  "retail.edit": "Editar",
  "retail.delete": "Eliminar",
  "retail.inactivate": "Inactivar",

  "reports.view": "Ver reportes",

  "requisiciones.viewAll": "Ver todas las requisiciones",
  "acess.view": "Administrar accesos"
};

export type AppPermissionRow = {
  Id: string;
  Title: string;
  GroupId: string;
  GroupKey?: string;
  Enabled: boolean;
  FeatureKey: string;
  Module?: string;
};