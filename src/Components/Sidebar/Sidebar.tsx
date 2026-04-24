import type { Section } from "../../App";

type SidebarProps = {
  sections: Section[];
  activeId: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
};

export function SidebarSimple({sections, activeId, onSelect, collapsed, onToggle,}: SidebarProps) {
  return (
    <aside className={`gd-sidebar ${collapsed ? "gd-sidebar--collapsed" : ""}`}>
      <div className="gd-sidebar__header"> 
        <button type="button" className="gd-sidebar__toggle" onClick={onToggle} aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}>
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="gd-sidebar__nav">
        {sections.map((s) => {
          const active = s.id === activeId;
          return (
            <button key={s.id} className={`gd-sidebar__item ${active ? "is-active" : ""} ${collapsed ? "is-compact" : ""}`} onClick={() => onSelect(s.id)}>
              <span className="gd-sidebar__icon" aria-hidden="true">
                {s.icon ?? "•"}
              </span>
              {/* podrías meter un icono aquí si quieres */}
              <span className="gd-sidebar__label">{s.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}