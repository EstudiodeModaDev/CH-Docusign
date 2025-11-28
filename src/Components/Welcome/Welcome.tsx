import * as React from "react";
import "./Welcome.css";

export type LandingPage = {
  onLogin: () => void;                  // handler del botón
  productName?: string;                 // texto grande (por defecto SOLVI)
  footer?: React.ReactNode;             // pie de página del panel derecho
};

export default function Welcome({onLogin, productName = "Gestión Documental", footer,}: LandingPage) {

  return (
    <section className="solvi-auth" aria-label="Página de inicio de sesión">
      {/* Panel izquierdo: branding + avisos */}
      <aside className="solvi-left" aria-label="Información de la plataforma">
        <div className="solvi-left__inner">
          <h1 className="brand" aria-label={productName}>{productName}</h1>
          <p className="tagline">Plataforma de gestion documental EDM.</p>

          <div className="cards">
          </div>
        </div>
      </aside>

      {/* Panel derecho: CTA de login */}
      <main className="solvi-right">
        <div className="solvi-right__inner">
          <div className="welcome">
            <span className="kicker">Bienvenido</span>
            <h2 className="title">Iniciar sesión</h2>
            <p className="subtitle">Usa tus credenciales corporativas</p>
          </div>

          <button className="btn-primary" onClick={onLogin} aria-label="Iniciar sesión">
            Iniciar sesión
          </button>

          <div className="footer">{footer ?? <>© {new Date().getFullYear()} {productName}</>}</div>
        </div>
      </main>
    </section>
  );
}

