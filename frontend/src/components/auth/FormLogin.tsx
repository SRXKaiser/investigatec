import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthHeader from './AuthHeader';
import AuthFooter from './AuthFooter';
import Input from '../shared/Input';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const FormLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();


  const correoInicial = (location.state as { correo?: string })?.correo || '';
  const [correo, setCorreo] = useState(correoInicial);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const mensajeExito = (location.state as { mensaje?: string })?.mensaje;
  const from = (location.state as { from?: string })?.from;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!correo || !password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setCargando(true);
    setError('');

    try {
      // 1. Login: obtiene el usuario (y guarda token + user en localStorage)
      const usuario = await authService.login(correo, password);

      // 2. Guardar en el contexto
      const token = localStorage.getItem('token') || '';
      login(usuario, token);

      // 3. Redirección inteligente:
      //    Si venía de una página protegida se volverla ahí
      //    Si no, se ira al dashboard según su rol
      const destino = from || '/dashboard';
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 items-center"
    >
      <AuthHeader
        titulo="Inicia Sesión"
        subtitulo="¡Bienvenido! Ingresa tus datos para continuar"
      />

      {/* Mensaje de éxito (viene del registro) */}
      {mensajeExito && (
        <p className="text-xs text-green-600 text-center w-72
                      bg-green-500/10 px-3 py-2 rounded-lg">
          {mensajeExito}
        </p>
      )}

      <Input
        id="correo"
        label="Correo"
        type="email"
        value={correo}
        onChange={setCorreo}
        placeholder="tu@correo.com"
        autoComplete="email"
        required
      />

      <Input
        id="password"
        label="Contraseña"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="•••••••••••"
        autoComplete="current-password"
        required
      />

      {error && (
        <p className="text-xs text-[var(--rosita)] text-right w-72 mt-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="btn btn-ng mt-8 disabled:opacity-50"
      >
        <span className="btn-tapa">
          {cargando ? 'INGRESANDO...' : 'INICIAR SESIÓN'}
        </span>
      </button>

      <AuthFooter
        texto="¿No tienes cuenta?"
        linkTexto="Regístrate"
        linkTo="/register"
      />
    </form>
  );
};

export default FormLogin;