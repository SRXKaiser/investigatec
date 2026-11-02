import { NavLink } from 'react-router-dom';
import { useAuth } from "../../../context/AuthContext";
import { LINKS_DIRECTOS_ROL } from "../../../types";

const AccesosDirectos = () => {
    const { user } = useAuth();
    const dir_acces = user ? LINKS_DIRECTOS_ROL[user.tipo_usuario] || [] : [];
    return (
        
        <div className="mb-5 ml-5 flex flex-col">
            <p className='font-cuerpo flex items-start font-bold mb-2 text-[var(--rojo-oscuro)]'>Accesos Directos</p>
             {dir_acces.map((link) => {
                return(
                <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/dashboard'}
                    type="button"
                    className="btn mb-3 "
                >
                    <span className="btn-tapa hover:bg-[var(--rojo)]">{link.label}</span>
                </NavLink>
                );
            })}
        </div>

    );
};

export default AccesosDirectos