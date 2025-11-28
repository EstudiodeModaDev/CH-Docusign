import * as React from "react";
import { useDocusignAuth } from "../../auth/authDocusign";

export const DocusignConnectButton: React.FC = () => {
  const { isConnected, login, logout } = useDocusignAuth();

  if (isConnected) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button type="button" className= "btn btn-transparent-final btn-xs" onClick={logout}>
          Desconectar docusign
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={login} className="btn btn-transparent-final btn-xs">
      Conectar con DocuSign
    </button>
  );
};
