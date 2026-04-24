import * as React from "react";
import "./SettingsPage.css";
import type { TablaParametrosProps } from "../../../models/Props";
import { useNavigate } from "react-router-dom";

export const ParamTabs: React.FC<TablaParametrosProps> = ({ tabs, value, onChange }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({});
  const navigate = useNavigate();

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeIndex = tabs.findIndex((t) => t.id === value);
    if (activeIndex === -1) {
      setIndicatorStyle({ opacity: 0 });
      return;
    }

    const buttons = container.querySelectorAll<HTMLButtonElement>(".ptabs__tab");
    const btn = buttons[activeIndex];
    if (!btn) return;

    const { offsetLeft, offsetWidth } = btn;
    setIndicatorStyle({
      opacity: 1,
      transform: `translateX(${offsetLeft}px)`,
      width: offsetWidth,
    });
  }, [tabs, value]);


  return (
    <div className="ptabs">
      <div className="ptabs__track" ref={containerRef}>
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <button 
              key={tab.id} 
              type="button" 
              className={`ptabs__tab ${active ? "ptabs__tab--active" : ""}`} 
              onClick={() => {
                if (tab.to) {
                  navigate(tab.to);
                  return;
                }
                onChange?.(tab.id);
              }}>
              {tab.label}
            </button>
          );
        })}
        <span className="ptabs__indicator" style={indicatorStyle} />
      </div>
    </div>
  );
};



