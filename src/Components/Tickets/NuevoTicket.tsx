import * as React from "react";
import Select, { type SingleValue } from "react-select";
import "./NuevoTicketForm.css";
import "../../App.css";
import { useNuevoTicketForm } from "../../Funcionalidades/Tickets";
import { norm } from "../../utils/text";
import RichTextBase64 from "../RichText/RichText";
import { useGestorServices } from "../../graph/graphContext";
import { CATALOGO_ARTS, CATALOGO_CATS, CATALOGO_SUBS } from "../../consts/Tickets";

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

export default function NuevoTicketForm() {
  const { Tickets: TicketsSvc, log: LogsSvc } = useGestorServices();
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
