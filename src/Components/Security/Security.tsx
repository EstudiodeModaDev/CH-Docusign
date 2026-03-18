import { useSecurity } from "../../Funcionalidades/security";
import "./Securiity.css";
import { SECURITY_GROUPS } from "../../utils/security";
import GroupPermissionsManager from "./PermisosGrupo";

export default function GroupUsersManager() {
  const {selectedKey, search, loading, error, selectedGroup, filteredUsers, users, addBusy, nextLink, isAddOpen, addEmail,
    setSelectedKey, setSearch, loadFirstPage, setIsAddOpen, handleRemove, loadMore, handleAdd, setAddEmail,} = useSecurity(SECURITY_GROUPS);

  if (!SECURITY_GROUPS.length) {
    return (
      <div className="gum">
        <div className="gum__empty">No hay grupos configurados.</div>
      </div>
    );
  }

  return (
    <div className="gum">
      <div className="gum__hero">
        <div className="gum__heroCopy">
          <h2 className="gum__heading">Usuarios por grupo</h2>
          <p className="gum__subheading">Selecciona un grupo y administra sus miembros desde una sola vista.</p>
        </div>

        <div className="gum__heroActions">
          <button className="gum__btn gum__btn--ghost" onClick={loadFirstPage} disabled={loading}>
            {loading ? "Cargando..." : "Refrescar"}
          </button>

          <button className="gum__btn gum__btn--primary" onClick={() => setIsAddOpen(true)}>
            + Añadir
          </button>
        </div>
      </div>

      <div className="gum__toolbar">
        <div className="gum__field">
          <label className="gum__label">Grupo</label>
          <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)} className="gum__select">
            {SECURITY_GROUPS.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="gum__field gum__field--search">
          <label className="gum__label">Buscar</label>
          <input className="gum__input" placeholder="Nombre o correo..." value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>

      {error ? <div className="gum__error">{error}</div> : null}

      <div className="gum__stats">
        <div className="gum__stat">
          <span className="gum__statLabel">Grupo actual</span>
          <strong className="gum__statValue">{selectedGroup?.label ?? "—"}</strong>
        </div>

        <div className="gum__stat">
          <span className="gum__statLabel">Usuarios mostrados</span>
          <strong className="gum__statValue">
            {filteredUsers.length} / {users.length}
          </strong>
        </div>
      </div>

      <div className="gum__tableWrap">
        <table className="gum__table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>UPN</th>
              <th className="gum__th--actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="gum__tdEmpty">
                  No hay usuarios para mostrar.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.displayName ?? "—"}</td>
                  <td>{u.mail ?? "—"}</td>
                  <td>{u.userPrincipalName ?? "—"}</td>
                  <td className="gum__tdActions">
                    <button className="gum__dangerLink"  onClick={() => handleRemove(u)} disabled={loading}>
                      Quitar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="gum__footer">
        <div className="gum__footerLeft">
          {nextLink ? (
            <button className="gum__btn gum__btn--ghost" onClick={loadMore} disabled={loading}>
              {loading ? "Cargando..." : "Cargar más"}
            </button>
          ) : (
            <span className="gum__muted">No hay más páginas.</span>
          )}
        </div>

        <div className="gum__footerRight">
          <span className="gum__muted">
            Para grupos grandes, carga más páginas antes de filtrar.
          </span>
        </div>
      </div>

      <GroupPermissionsManager selectedGroup={selectedGroup} />

      {isAddOpen && (
        <div className="gum__modalBackdrop" role="dialog" aria-modal="true">
          <div className="gum__modal">
            <div className="gum__modalHeader">
              <div>
                <h3 className="gum__modalTitle">Añadir usuario</h3>
                <p className="gum__modalSubtitle">
                  Se agregará al grupo <strong>{selectedGroup?.label}</strong>
                </p>
              </div>

              <button
                className="gum__iconBtn"
                onClick={() => setIsAddOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="gum__modalBody">
              <div className="gum__field">
                <label className="gum__label">Correo / UPN</label>
                <input
                  className="gum__input"
                  placeholder="usuario@empresa.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleAdd();
                  }}
                />
              </div>
            </div>

            <div className="gum__modalFooter">
              <button
                className="gum__btn gum__btn--ghost"
                onClick={() => setIsAddOpen(false)}
                disabled={addBusy}
              >
                Cancelar
              </button>

              <button
                className="gum__btn gum__btn--primary"
                onClick={handleAdd}
                disabled={addBusy || !addEmail.trim()}
              >
                {addBusy ? "Añadiendo..." : "Añadir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}