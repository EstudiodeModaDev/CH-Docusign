import * as React from "react";
import Select, { type SingleValue } from "react-select";
import "./NuevoTicketForm.css";
import "../../App.css";
import { useGraphServices } from "../../graph/graphContext";
import { useNuevoTicketForm } from "../../Funcionalidades/Tickets";
import { norm } from "../../utils/text";
import RichTextBase64 from "../RichText/RichText";

export type TreeOption = {
  value: string; // Artículo ID
  label: string; // Cat > Sub > Art
  meta: {
    catId: string;
    subId: string;
    artId: string;
    catTitle: string;
    subTitle: string;
    artTitle: string;
  };
};


type Cat = { ID: string; Title: string };
type Sub = { ID: string; Title: string; Id_categoria: string };
type Art = { ID: string; Title: string; Id_subCategoria: string };

const CATALOGO_CATS: Cat[] = [
  { ID: "C1", Title: "Registro y gestión de datos" },
  { ID: "C2", Title: "Envío de documentos" },
  { ID: "C3", Title: "Consulta de documentos" },
  { ID: "C4", Title: "Reportes y exportaciones" },
  { ID: "C5", Title: "Nuevos modulos" },
  { ID: "C6", Title: "Parámetros y desplegables" },
  { ID: "C7", Title: "Explorador de documentos" },
  { ID: "C8", Title: "Paz y salvo" },
];

// Subcategorías: IDs únicos (S###)
const CATALOGO_SUBS: Sub[] = [
  // C1 - Registro y gestión de datos
  { ID: "S101", Title: "Contrataciones", Id_categoria: "C1" },
  { ID: "S102", Title: "Cesaciones", Id_categoria: "C1" },
  { ID: "S103", Title: "Habeas Data", Id_categoria: "C1" },
  { ID: "S104", Title: "Promociones", Id_categoria: "C1" },
  { ID: "S105", Title: "Retail", Id_categoria: "C1" },

  // C2 - Envío de documentos
  { ID: "S201", Title: "Plantillas (no aparecen o no cargan)", Id_categoria: "C2" },
  { ID: "S202", Title: "Envío fallido (no se completa el envío)", Id_categoria: "C2" },
  { ID: "S203", Title: "Problemas con plantilla", Id_categoria: "C2" },
  { ID: "S204", Title: "Carpetas automáticas (no se crean o quedan mal)", Id_categoria: "C2" },
  { ID: "S205", Title: "Otro", Id_categoria: "C2" },

  // C3 - Consulta de documentos
  { ID: "S301", Title: "No se muestra información o resultados", Id_categoria: "C3" },
  { ID: "S302", Title: "Otro", Id_categoria: "C3" },

  // C4 - Reportes y exportaciones
  { ID: "S401", Title: "Exportación (no descarga / falla)", Id_categoria: "C4" },
  { ID: "S402", Title: "Solicitud de incluir un módulo en reportes", Id_categoria: "C4" },
  { ID: "S403", Title: "Otro", Id_categoria: "C4" },

  // C5 - Solicitudes y mejoras
  { ID: "S501", Title: "Mejoras sobre funcionalidad existente", Id_categoria: "C5" },
  { ID: "S502", Title: "Nueva funcionalidad (no existe actualmente)", Id_categoria: "C5" },
  { ID: "S503", Title: "Otro", Id_categoria: "C5" },

  // C6 - Parámetros y desplegables
  { ID: "S601", Title: "Solicitud de nuevo desplegable", Id_categoria: "C6" },
  { ID: "S602", Title: "Error al administrar opciones de un desplegable", Id_categoria: "C6" },
  { ID: "S603", Title: "Otro", Id_categoria: "C6" },

  // C7 - Explorador de documentos
  { ID: "S701", Title: "No carga documentos / error al listar", Id_categoria: "C7" },
  { ID: "S702", Title: "Otro", Id_categoria: "C7" },

  // C8 - Paz y salvo
  { ID: "S801", Title: "Generación del paz y salvo (no crea)", Id_categoria: "C8" },
  { ID: "S802", Title: "Respuesta del paz y salvo (no permite responder)", Id_categoria: "C8" },
  { ID: "S803", Title: "Flujo del proceso (no sigue el orden esperado)", Id_categoria: "C8" },
  { ID: "S804", Title: "Documento final (no se guarda en la carpeta)", Id_categoria: "C8" },
  { ID: "S805", Title: "Envio de notificaciones", Id_categoria: "C8" },
  { ID: "S806", Title: "Otro", Id_categoria: "C8" },
];

// Helpers para reusar “artículos estándar” por módulo (sin repetir IDs)
const ART_STD = (subId: string, prefix: string): Art[] => [
  { ID: `${prefix}-01`, Title: "No permite registrar (guardar)", Id_subCategoria: subId },
  { ID: `${prefix}-02`, Title: "No permite editar", Id_subCategoria: subId },
  { ID: `${prefix}-03`, Title: "No permite visualizar / cargar información", Id_subCategoria: subId },
  { ID: `${prefix}-04`, Title: "Error desconocido (mensaje inesperado)", Id_subCategoria: subId },
  { ID: `${prefix}-05`, Title: "Solicitud de nuevo campo o ajuste de formulario", Id_subCategoria: subId },
  { ID: `${prefix}-06`, Title: "Otro", Id_subCategoria: subId },
];

const CATALOGO_ARTS: Art[] = [
  // C1 - módulos de registro (artículos estándar por módulo)
  ...ART_STD("S101", "A101"),
  ...ART_STD("S102", "A102"),
  ...ART_STD("S103", "A103"),
  ...ART_STD("S104", "A104"),
  ...ART_STD("S105", "A105"),

  // C2 - Envío de documentos
  { ID: "A201-01", Title: "No aparece una plantilla", Id_subCategoria: "S201" },
  { ID: "A201-02", Title: "Plantilla no carga / se queda en blanco", Id_subCategoria: "S201" },

  { ID: "A202-01", Title: "El envío falla (error al enviar)", Id_subCategoria: "S202" },
  { ID: "A202-02", Title: "El envío queda en proceso y no termina", Id_subCategoria: "S202" },
  { ID: "A202-03", Title: "No llega correo de notificación / confirmación", Id_subCategoria: "S202" },

  { ID: "A203-01", Title: "Campos faltantes en la plantilla", Id_subCategoria: "S203" },
  { ID: "A203-02", Title: "Datos no se rellenan automáticamente", Id_subCategoria: "S203" },
  { ID: "A203-03", Title: "Documento generado incompleto", Id_subCategoria: "S203" },

  { ID: "A204-01", Title: "No se crean carpetas automáticamente", Id_subCategoria: "S204" },
  { ID: "A204-02", Title: "Carpetas se crean en ruta equivocada", Id_subCategoria: "S204" },
  { ID: "A204-03", Title: "Permisos incorrectos en carpetas", Id_subCategoria: "S204" },

  { ID: "A205-01", Title: "Otro problema con el envío de documentos", Id_subCategoria: "S205" },

  // C3 - Consulta de documentos
  { ID: "A301-01", Title: "No muestra información", Id_subCategoria: "S301" },
  { ID: "A301-02", Title: "Filtros no funcionan / resultados incorrectos", Id_subCategoria: "S301" },
  { ID: "A301-03", Title: "Error al abrir un documento", Id_subCategoria: "S301" },

  // C4 - Reportes
  { ID: "A401-01", Title: "No exporta (Excel/PDF) o descarga corrupta", Id_subCategoria: "S401" },
  { ID: "A401-02", Title: "Exporta pero con datos incompletos", Id_subCategoria: "S401" },
  { ID: "A401-03", Title: "Error al generar reporte", Id_subCategoria: "S401" },

  { ID: "A402-01", Title: "Incluir un nuevo módulo en reportes", Id_subCategoria: "S402" },
  { ID: "A402-02", Title: "Agregar nuevo campo/columna a un reporte", Id_subCategoria: "S402" },

  // C5 - Solicitudes y mejoras
  { ID: "A501-01", Title: "Mejorar interfaz o experiencia de usuario", Id_subCategoria: "S501" },
  { ID: "A501-02", Title: "Optimizar flujo / reducir pasos", Id_subCategoria: "S501" },
  { ID: "A501-03", Title: "Mejorar rendimiento", Id_subCategoria: "S501" },

  // C6 - Parámetros y desplegables
  { ID: "A601-01", Title: "Crear un nuevo desplegable (lista)", Id_subCategoria: "S601" },
  { ID: "A601-02", Title: "Agregar nuevos valores al desplegable", Id_subCategoria: "S601" },

  { ID: "A602-01", Title: "No deja agregar opción", Id_subCategoria: "S602" },
  { ID: "A602-02", Title: "No deja editar/eliminar opción", Id_subCategoria: "S602" },
  { ID: "A602-03", Title: "Opciones duplicadas o desordenadas", Id_subCategoria: "S602" },

  // C7 - Explorador
  { ID: "A701-01", Title: "No carga documentos", Id_subCategoria: "S701" },
  { ID: "A701-02", Title: "Carga parcial / faltan documentos", Id_subCategoria: "S701" },
  { ID: "A701-03", Title: "Error al descargar", Id_subCategoria: "S701" },

  // C8 - Paz y salvo
  { ID: "A801-01", Title: "No genera paz y salvo", Id_subCategoria: "S801" },
  { ID: "A801-02", Title: "Genera pero con datos incorrectos", Id_subCategoria: "S801" },

  { ID: "A802-01", Title: "No permite responder", Id_subCategoria: "S802" },
  { ID: "A802-02", Title: "No registra la respuesta", Id_subCategoria: "S802" },

  { ID: "A803-01", Title: "No sigue el proceso indicado", Id_subCategoria: "S803" },
  { ID: "A803-02", Title: "Paso queda bloqueado / no avanza", Id_subCategoria: "S803" },

  { ID: "A804-01", Title: "No guarda el documento en la carpeta", Id_subCategoria: "S804" },
  { ID: "A804-02", Title: "Guarda en carpeta equivocada", Id_subCategoria: "S804" },

  { ID: "A805-01", Title: "No envía la encuesta", Id_subCategoria: "S805" },
  { ID: "A805-02", Title: "Envía encuesta a destinatario incorrecto", Id_subCategoria: "S805" },
  { ID: "A805-02", Title: "Envía notificaciones indebidamente", Id_subCategoria: "S805" },
];

export default function NuevoTicketForm() {
  const { Tickets: TicketsSvc, log: LogsSvc } = useGraphServices();
  const { state, errors, submitting, setField, handleSubmit } = useNuevoTicketForm({Tickets: TicketsSvc, Logs: LogsSvc,});

  // ====== Catálogo integrado (estático por ahora) ======
  const loadingCatalogos = false;

  // Nombres esperados por tu lógica actual
  const categorias = React.useMemo(() => CATALOGO_CATS, []);
  const subcategoriasAll = React.useMemo(() => CATALOGO_SUBS, []);
  const articulosAll = React.useMemo(() => CATALOGO_ARTS, []);

  // ====== TreeOptions (Cat > Sub > Art) ======
  const treeOptions: TreeOption[] = React.useMemo(() => {
    if (!categorias.length || !subcategoriasAll.length || !articulosAll.length) return [];

    const subById = new Map(subcategoriasAll.map((s) => [String(s.ID), s]));
    const catById = new Map(categorias.map((c) => [String(c.ID), c]));

    return articulosAll
      .map((a) => {
        const sub = subById.get(String(a.Id_subCategoria));
        const cat = sub ? catById.get(String(sub.Id_categoria)) : undefined;

        const catTitle = cat?.Title ?? "(Sin categoría)";
        const subTitle = sub?.Title ?? "(Sin subcategoría)";
        const artTitle = a.Title ?? "(Artículo)";

        return {
          value: String(a.ID),
          label: `${catTitle} > ${subTitle} > ${artTitle}`,
          meta: {
            catId: String(sub?.Id_categoria ?? ""),
            subId: String(a.Id_subCategoria ?? ""),
            artId: String(a.ID),
            catTitle,
            subTitle,
            artTitle,
          },
        } as TreeOption;
      })
      .sort((x, y) => x.label.localeCompare(y.label));
  }, [categorias, subcategoriasAll, articulosAll]);

  const treeValue: TreeOption | null = React.useMemo(() => {
    if (!state.articulo) return null;

    const normArt = norm(state.articulo || "");
    const normCat = norm(state.categoria || "");
    const normSub = norm(state.subcategoria || "");

    return (
      treeOptions.find(
        (o) =>
          norm(o.meta.artTitle) === normArt &&
          norm(o.meta.catTitle) === normCat &&
          norm(o.meta.subTitle) === normSub
      ) ?? null
    );
  }, [state.articulo, state.categoria, state.subcategoria, treeOptions]);

  // ====== Handler (guarda SOLO títulos en state) ======
  const onTreeChange = (opt: SingleValue<TreeOption>) => {
    if (!opt) {
      setField("categoria", "");
      setField("subcategoria", "");
      setField("articulo", "");
      return;
    }

    const { catTitle, subTitle, artTitle } = opt.meta;
    setField("categoria", catTitle);
    setField("subcategoria", subTitle);
    setField("articulo", artTitle);
  };

  const disabledCats = submitting;

  return (
    <div className="ticket-form">
      <>
        <div className="form-header">
          <h2 className="tf-title">Nuevo Ticket</h2>
        </div>

        <form onSubmit={(e) => {e.preventDefault(); handleSubmit(e);}} noValidate className="tf-grid" >
          {/* Asunto */}
          <div className="tf-field">
            <label className="tf-label" htmlFor="motivo">
              Asunto
            </label>
            <input id="motivo" type="text" placeholder="Ingresa el asunto del ticket" value={state.motivo} onChange={(e) => setField("motivo", e.target.value)} disabled={submitting} className="tf-input" maxLength={300}/>
            {errors.motivo && <small className="error">{errors.motivo}</small>}
          </div>

          {/* Descripción */}
          <div className={`tf-field tf-col-2 ${errors.descripcion ? "has-error" : ""}`}>
            <label className="tf-label">Descripción</label>

            <div className="rtb-box">
              <RichTextBase64
                value={state.descripcion}
                onChange={(html) => setField("descripcion", html)}
                placeholder="Describe el problema y pega capturas (Ctrl+V)..."
              />
            </div>

            {errors.descripcion && <small className="error">{errors.descripcion}</small>}
          </div>

          {/* Catálogo */}
          <div className="tf-row tf-row--cats tf-col-2">
            <div className="tf-field">
              <label className="tf-label">Categoría</label>
              <Select<TreeOption, false>
                classNamePrefix="rs"
                placeholder={loadingCatalogos ? "Cargando catálogo..." : "Buscar categoría / subcategoría / artículo…"}
                options={treeOptions}
                value={treeValue}
                onChange={onTreeChange}
                isDisabled={disabledCats}
                isClearable
              />
              {errors.categoria && <small className="error">{errors.categoria}</small>}
            </div>
          </div>

          {/* Archivo */}
          <div className="tf-field tf-col-2">
            <label className="tf-label" htmlFor="archivo">
              Adjuntar archivo
            </label>
            <input
              id="archivo"
              type="file"
              onChange={(e) => setField("archivo", e.target.files?.[0] ?? null)}
              disabled={submitting}
              className="tf-input"
            />
          </div>

          {/* Enviar */}
          <div className="tf-actions tf-col-2">
            <button type="submit" disabled={submitting || loadingCatalogos} className="btn btn-primary-final">
              {submitting ? "Enviando..." : "Enviar Ticket"}
            </button>
          </div>
        </form>
      </>
    </div>
  );
}
