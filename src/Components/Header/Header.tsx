import React from "react";
import  "./AppHeader.css";
import { useTheme } from "../../Funcionalidades/Theme";
import { logout } from "../../auth/msal";
import { useCurrentUserPhoto } from "../../Funcionalidades/CurrentUserPhoto";
import { DocusignConnectButton } from "../LoginButton/LoginButton";

type AppHeaderProps = {title: string; userName: string; userRole: string; avatarUrl: string; onHomeClick?: () => void; mail: string};

export const AppHeader: React.FC<AppHeaderProps> = ({title, userName, userRole,}) => {
    const { theme, toggle } = useTheme();
    const { photo } = useCurrentUserPhoto();
  return (
    <header className="hd-wrapper" aria-label="Barra superior de la aplicación">
      <div className="hd-inner">
        <button className="btn btn-transparent-final btn-s" onClick={toggle} aria-label={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`} aria-pressed={theme === "dark"} title={theme === "dark" ? "Modo oscuro activado" : "Modo claro activado"}>
            <span className="" aria-hidden="true">
                {theme === "dark" ? "🌙" : "☀️"}
            </span>
        </button>
        <button className="btn btn-transparent-final btn-s" onClick={() => logout()} aria-label="Cerrar sesión">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M10 17l-1.4-1.4 3.6-3.6-3.6-3.6L10 7l5 5-5 5zM4 19h8v2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8v2H4v14z" fill="currentColor"/>
        </svg>
        <span>Salir</span>
        </button>
        <DocusignConnectButton />

        {/* Título centrado */}
        <h1 className="hd-title">{title}</h1>

        {/* Usuario */}
        <div className="hd-user">
          <div className="userInfo">
            <span className="userName">{userName}</span>
            <span className="userRole">{userRole}</span>
          </div>
          <div className="avatarWrapper">
            <img src={photo ?? ""} alt="Foto de usuario" className="avatar"/>
          </div>
        </div>
      </div>
    </header>
  );
};
