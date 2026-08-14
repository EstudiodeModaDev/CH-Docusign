import { useSecurity } from "../../Funcionalidades/security";
import "./Securiity.css";
import { SECURITY_GROUPS } from "../../utils/security";
import GroupPermissionsManager from "./PermisosGrupo";

export default function GroupUsersManager() {
  const {selectedKey, search, loading, error, selectedGroup, filteredUsers, users, addBusy, nextLink, isAddOpen, addEmail,
    setSelectedKey, setSearch, loadFirstPage, setIsAddOpen, handleRemove, loadMore, handleAdd, setAddEmail,
    syncing, syncProgress, syncSummary, syncActiveUsers,} = useSecurity(SECURITY_GROUPS);

  const canSyncActiveUsers = selectedGroup?.key === "app_ch_requisiciones_usuarios";

  const handleSyncActiveUsers = () => {
    const ok = window.confirm(
      `Se agregarán al grupo "${selectedGroup?.label}" todos los usuarios activos de la compañía que aún no sean miembros. ¿Continuar?`
    );
    if (!ok) return;
    void syncActiveUsers();
  };

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

          {canSyncActiveUsers && (
            <button
              className="gum__btn gum__btn--ghost"
              onClick={handleSyncActiveUsers}
              disabled={syncing || loading}
            >
              {syncing ? "Sincronizando..." : "Sincronizar usuarios activos"}
            </button>
          )}
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

      {canSyncActiveUsers && syncing && syncProgress && (
        <div className="gum__syncPanel" role="status" aria-live="polite">
          <div className="gum__syncSkeletonRow">
            <span className="gum__skeletonBar" />
            <span className="gum__skeletonBar" />
            <span className="gum__skeletonBar" />
          </div>

          <div className="gum__syncProgressBar">
            <div
              className="gum__syncProgressFill"
              style={{
                width: `${syncProgress.total ? Math.round((syncProgress.processed / syncProgress.total) * 100) : 0}%`,
              }}
            />
          </div>

          <div className="gum__syncStats">
            <span>
              Procesados: <strong>{syncProgress.processed}</strong> / {syncProgress.total}
            </span>
            <span>
              Nuevos agregados: <strong>{syncProgress.added}</strong>
            </span>
            <span>
              Total usuarios activos: <strong>{syncProgress.total}</strong>
            </span>
            {syncProgress.failed > 0 && (
              <span className="gum__syncErrorInline">Con error: {syncProgress.failed}</span>
            )}
          </div>
        </div>
      )}

      {canSyncActiveUsers && !syncing && syncSummary && (
        <div className="gum__syncSummary">
          Sincronización completa: se agregaron <strong>{syncSummary.added}</strong> usuarios nuevos de un
          total de <strong>{syncSummary.total}</strong> usuarios activos
          {syncSummary.failed > 0 ? ` (${syncSummary.failed} con error)` : ""}.
        </div>
      )}

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
                      {loading ? "Cargando" : "Quitar"}
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
            La búsqueda consulta directamente el grupo en Azure AD (no solo lo ya cargado).
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