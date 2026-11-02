import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { LINKS_ROL } from '../../../types';
import { LogOut, Menu, X } from 'lucide-react';

interface DBSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

const DBSidebar = ({ isOpen, onToggle }: DBSidebarProps) => {
    const { user, logout } = useAuth();
    const links = user ? LINKS_ROL[user.tipo_usuario] || [] : [];

    return (
        <aside
            className={`fixed left-0 top-0 h-screen flex flex-col overflow-y-auto transition-all duration-300 z-50 rounded-r-[20px]
                ${isOpen
                    ? 'w-64 bg-gradient-to-b from-[var(--cafe)] to-[var(--rojo-oscuro)] text-white '
                    : 'w-20 bg-[var(--bg)] border-r border-[var(--negro)] border-2 text-[var(--rojo-oscuro)]'
                }
            `}
        >
            {/* abrir/cerrar el sidebar (usa la prop onToggle) */}
            <button
                onClick={onToggle}
                className={`p-6 flex items-center justify-center hover:opacity-70 transition-opacity ${isOpen ? 'self-end' : 'self-center mt-4'}`}
            >
                {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <div className={`px-6 items-center gap-3 mb-4 overflow-hidden whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 h-auto' : 'opacity-0 h-0 hidden'}`}>
                <Link to="/" className="font-pixel text-2xl">
                    <h2>
                        <span>Investiga</span>
                        <span className="text-[var(--rojo)]">Tec</span>
                    </h2>
                </Link>
                <p className="text-xs text-white/70">Herramienta de revisión</p>
            </div>

            {/* navegación */}
            <nav className="flex-1 p-3 pr-0 flex flex-col gap-2 text-sm">
                {links.map((link) => {
                    const Icono = link.icon;
                    return (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.to === '/dashboard'}
                            title={!isOpen ? link.label : undefined}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-l-full transition-colors overflow-hidden whitespace-nowrap
                                ${isOpen ? 'justify-start' : 'justify-center'} 
                                ${isActive
                                    ? (isOpen ? 'bg-[var(--bg2)] text-[var(--rojo-oscuro)] font-semibold' : 'bg-[var(--rojo)] text-white')
                                    : (isOpen ? 'text-white/70 hover:bg-[var(--bg)]/25 hover:text-[var(--bg)] hover:mr-0 hover:font-bold'  : 'hover:bg-[var(--rojo)]/10 text-[var(--cafe)] hover:text-[var(--rojo)]')
                                }`
                            }
                        >
                            <Icono className="w-6 h-6 shrink-0" />
                            <span className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                                {link.label}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* cerrar sesión */}
            <div className={`p-4 border-t transition-all duration-300 ${isOpen ? 'border-white/10' : 'border-transparent'}`}>
                <button
                    onClick={logout}
                    title="Cerrar sesión"
                    className={`w-full flex items-center rounded-lg transition-colors overflow-hidden whitespace-nowrap
                        ${isOpen 
                            ? 'gap-3 px-4 py-3 text-white/70 hover:bg-red-500/20 hover:text-white justify-start' 
                            : 'justify-center py-3 text-[var(--cafe)] hover:bg-red-500/10 hover:text-red-600'
                        }`}
                >
                    <LogOut className="w-6 h-6 shrink-0" />
                    <span className={`${isOpen ? 'opacity-100 inline' : 'opacity-0 hidden'}`}>
                        Cerrar sesión
                    </span>
                </button>
            </div>
        </aside>
    );
};

export default DBSidebar;