import edmLogo from "../../assets/Logo EDM.png"; // cambia la ruta si es distinta
import "./Home.css"

export default function EdmBrand() {
  return (
    <section className="edm-brand" aria-label="Estudio de Moda">
      <img src={edmLogo} alt="Estudio de Moda" className="edm-brand__logo"/>
    </section>
  );
}
