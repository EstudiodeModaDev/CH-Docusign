import type { GroupOption } from "../../utils/security";
import type { FeatureKey } from "../../models/security";
import { useGroupPermissionsAdmin } from "../../Funcionalidades/MatrizPermisos";

type Props = {
  selectedGroup: GroupOption | null;
};

function prettyModuleName(module: string) {
  return module
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function prettyFeatureName(featureKey: string) {
  return featureKey
    .replace(".", " · ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function GroupPermissionsManager({ selectedGroup }: Props) {
  const { loading, error, modules, reload, togglePermission } = useGroupPermissionsAdmin(selectedGroup);

  return (
    <section className="gumPerm">
      <div className="gumPerm__header">
        <div>
          <h3 className="gumPerm__title">Funcionalidades del grupo</h3>
          <p className="gumPerm__subtitle">Activa o desactiva permisos para <strong>{selectedGroup?.label ?? "—"}</strong></p>
        </div>

        <button className="gum__btn gum__btn--ghost" onClick={reload} disabled={loading}>
          {loading ? "Cargando..." : "Refrescar permisos"}
        </button>
      </div>

      {error ? <div className="gum__error">{error}</div> : null}

      <div className="gumPerm__modules">
        {modules.map((mod) => (
          <div key={mod.module} className="gumPerm__card">
            <div className="gumPerm__cardHead">
              <h4 className="gumPerm__moduleTitle">{prettyModuleName(mod.module)}</h4>
              <span className="gumPerm__count">{mod.items.length} permisos</span>
            </div>

            <div className="gumPerm__list">
              {mod.items.map((item) => (
                <label key={item.FeatureKey} className="gumPerm__row">
                  <div className="gumPerm__rowInfo">
                    <span className="gumPerm__featureName">{prettyFeatureName(item.FeatureKey)}</span>
                    <span className={`gumPerm__badge ${item.Enabled ? "is-on" : "is-off"}`}>
                      {item.Enabled ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <input type="checkbox" checked={item.Enabled} disabled={item.saving} onChange={(e) => void togglePermission(item.FeatureKey as FeatureKey, e.target.checked)}/>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}