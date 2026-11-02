import { useState } from 'react';
import type { FormEvent } from 'react';
import AuthLayout from './AuthLayout';
import AuthHeader from './AuthHeader';
import Input from '../shared/Input';
import AuthFooter from './AuthFooter';
import IndicadorPasos from './IndicadorPasos';
import BtnNavegar from './BtnNavegar';
import AnimacionParte from './AnimacionParte';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import type { RegistroPayload } from '../../types';

const FormRegister = () => {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [direccion, setDireccion] = useState<'adelante' | 'atras'>('adelante');
  const navigate = useNavigate();

  // 1. Datos digitales
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2. Nombre
  const [nombre, setNombre] = useState('');
  const [apellido_paterno, setApellidoPaterno] = useState('');
  const [apellido_materno, setApellidoMaterno] = useState('');

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Navegación
  const irAdelante = () => {
    setDireccion('adelante');
    setPaso((p) => (p < 2 ? ((p + 1) as 1 | 2) : p));
  };

  const irAtras = () => {
    setDireccion('atras');
    setPaso((p) => (p > 1 ? ((p - 1) as 1 | 2) : p));
  };

  // Validaciones
  const validarPaso1 = (): boolean => {
    if (!correo || !password || !confirmPassword) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    if (password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    setError('');
    return true;
  };

  const validarPaso2 = (): boolean => {
    if (!nombre || !apellido_paterno || !apellido_materno) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    setError('');
    return true;
  };

  const handleSiguiente = () => {
    if (paso === 1 && validarPaso1()) irAdelante();
  };

  // Submit final
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validarPaso2()) return;

    setCargando(true);
    setError('');

    // Payload simplificado: solo los datos básicos
    const payload: RegistroPayload = {
      nombre,
      apellido_paterno,
      apellido_materno,
      correo,
      password,
    };

    try {
      const respuesta = await authService.registrarUsuario(payload);
      console.log('Registro exitoso:', respuesta);

      alert(
        `¡Cuenta creada exitosamente!\n\n` +
        `Bienvenido, ${respuesta.nombre}.\n\n` +
        `Serás redirigido al inicio de sesión.`
      );

      navigate('/login', {
        state: { mensaje: 'Cuenta creada. Ya puedes iniciar sesión.' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 items-center">
        <AuthHeader
          titulo="Crea tu cuenta"
          subtitulo="Únete a la comunidad de investigación del ITCJ"
        />

        <IndicadorPasos pasos={2} pasoActual={paso} />

        <AnimacionParte paso={paso} direccion={direccion}>
          {/* PASO 1: Datos digitales */}
          {paso === 1 && (
            <>
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
                placeholder="Mínimo 12 caracteres"
                autoComplete="new-password"
                required
              />
              <Input
                id="confirmPassword"
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                required
              />
            </>
          )}

          {/* PASO 2: Nombre completo */}
          {paso === 2 && (
            <>
              <Input
                id="nombre"
                label="Nombre"
                type="text"
                value={nombre}
                onChange={setNombre}
                placeholder="Juan"
                autoComplete="given-name"
                required
              />
              <Input
                id="apellido_paterno"
                label="Apellido paterno"
                type="text"
                value={apellido_paterno}
                onChange={setApellidoPaterno}
                placeholder="Martínez"
                autoComplete="family-name"
                required
              />
              <Input
                id="apellido_materno"
                label="Apellido materno"
                type="text"
                value={apellido_materno}
                onChange={setApellidoMaterno}
                placeholder="Guzmán"
                autoComplete="additional-name"
                required
              />
            </>
          )}
        </AnimacionParte>

        {error && (
          <p className="text-xs text-[var(--rosita)] text-center w-72 mt-1">
            {error}
          </p>
        )}

        <BtnNavegar
          pasoActual={paso}
          pasoTotal={2}
          onAtras={irAtras}
          onSiguiente={handleSiguiente}
          cargando={cargando}
        />

        {paso === 1 && (
          <AuthFooter
            texto="¿Ya tienes cuenta?"
            linkTexto="Inicia sesión"
            linkTo="/login"
          />
        )}
      </form>
    </AuthLayout>
  );
};

export default FormRegister;