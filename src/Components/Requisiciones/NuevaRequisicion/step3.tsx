import { useAnyUserPhoto } from "../../../Funcionalidades/CurrentUserPhoto";
import "./NuevaRequisicion.css";

export type Step3Result = {
  requisicionId: string;
  profesionalNombre: string;
  fechaInicioProceso: string;
  fechaLimiteVinculacion: string;
  correoProfesional: string;
};

type Props = {
  result3: Step3Result | null;
};

function getInitials(name: string) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase() || "—";
}

export function Step3({ result3 }: Props) {
  const mail = (result3?.correoProfesional ?? "").trim();

  // ✅ Hook a nivel superior
  const { photo, loading } = useAnyUserPhoto(mail, "96x96");

  const initials = getInitials(result3?.profesionalNombre ?? "");

  return (
    <>
      <h3 className="full-fila">¡Su requisición fue asignada de forma exitosa!</h3>

      {!result3 ? (
        <div className="ft-field ft-field--full">
          <small>No hay información de confirmación.</small>
        </div>
      ) : (
        <div className="ft-confirm">
          <div className="ft-confirm__left">
            <div className="ft-avatar">
              {loading ? (
                <div className="ft-avatar__placeholder" aria-label="Cargando foto" />
              ) : photo ? (
                <img className="ft-avatar__img" src={photo} alt="Foto profesional" />
              ) : (
                <div className="ft-avatar__initials" aria-label="Sin foto">
                  {initials}
                </div>
              )}
            </div>

            {!!mail && (
              <div className="ft-confirm__mail" title={mail}>
                {mail}
              </div>
            )}
          </div>

          <div className="ft-confirm__right">
            <div className="ft-confirm__item">
              <div className="ft-confirm__label">ID requisición</div>
              <div className="ft-confirm__value">{result3.requisicionId}</div>
            </div>

            <div className="ft-confirm__item">
              <div className="ft-confirm__label">Profesional asignado</div>
              <div className="ft-confirm__value">{result3.profesionalNombre}</div>
            </div>

            <div className="ft-confirm__item">
              <div className="ft-confirm__label">Fecha inicial del proceso</div>
              <div className="ft-confirm__value">{result3.fechaInicioProceso}</div>
            </div>

            <div className="ft-confirm__item">
              <div className="ft-confirm__label">Fecha límite de vinculación</div>
              <div className="ft-confirm__value">{result3.fechaLimiteVinculacion}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
