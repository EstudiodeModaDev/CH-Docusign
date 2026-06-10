import * as React from "react";
import "./ViewerDocument.css";
import { EMPRESAS } from "./utils/Constants";
import type { EmpresaKey } from "../../../models/DocumentViewer";

type SearchFolderResult = {
  onSelect: (key: EmpresaKey) => void;
  empresa : string;
};

export const ColaboradoresExplorerSidebar: React.FC<SearchFolderResult> = ({ onSelect, empresa }) => {

  return (
    <aside className="ce2-sb" aria-label="Empresas">
      <div className="ce2-sb__brand">
        <div className="ce2-sb__kicker">Expedientes</div>
      </div>

      <div className="ce2-sb__seg" role="tablist" aria-label="Selector de empresa">
        {EMPRESAS.map((e) => (
          <button key={e.key} role="tab" aria-selected={empresa === e.key} type="button" className={"ce2-sb__segBtn" + (empresa === e.key ? " is-active" : "")} onClick={() => onSelect(e.key)}>
            {e.label}
          </button>
        ))}
      </div>
    </aside>
  );
};
