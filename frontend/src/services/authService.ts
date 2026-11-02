import axios from 'axios';
import api from './api';
import type {
  LoginResponse,
  RegistroPayload,
  RegistroResponse,
  TipoUsuario,
  Usuario,
} from '../types';

interface RolResponse {
  nombre: string;
}

export const authService = {
  
// REGISTEO DE USUARIO
// POST/auth/register
  async registrarUsuario(payload: RegistroPayload): Promise<RegistroResponse> {
    try {
      const { data } = await api.post<RegistroResponse>('/auth/register', {
        ...payload,
        correo: payload.correo.trim().toLowerCase(),
      });
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === 'string') throw new Error(detail);
        if (Array.isArray(detail)) {
          throw new Error(detail.map((d: any) => d.msg).join(', '));
        }
        throw new Error(`Error ${error.response?.status}: ${error.message}`);
      }
      throw error;
    }
  },
  
  /**
   * Login completo YA AHORA SI DE VERDAD ES EL ULTIMO
   * 1. POST /auth/login obtener el token
   * 2. GET /auth/me  usuario usuario
   * 3. Guardar ambos en localStorage
   * 4. Devolver el usuario
   */
  async login(correo: string, password: string): Promise<Usuario> {
    try {
      // toke
      const { data: loginData } = await api.post<LoginResponse>('/auth/login', {
        correo: correo.trim().toLowerCase(),
        password,
      });

      // guardar token temporalmente 
      localStorage.setItem('token', loginData.access_token);

      //obtener usuario con el token
      const { data: datosUsuario } = await api.get<Omit<Usuario, 'tipo_usuario'>>('/auth/me');

      const { data: roles } = await api.get<RolResponse[]>('/roles/me');
      const prioridadRoles: TipoUsuario[] = ['ADMIN', 'REVISOR', 'MIEMBRO'];
      const tipoUsuario = prioridadRoles.find((rol) =>
        roles.some((rolUsuario) => rolUsuario.nombre === rol)
      );

      if (!tipoUsuario) {
        throw new Error('La cuenta no tiene un rol válido asignado');
      }

      const usuario: Usuario = { ...datosUsuario, tipo_usuario: tipoUsuario };

      //guardar el usuario
      localStorage.setItem('user', JSON.stringify(usuario));

      return usuario;
    } catch (err) {
      // limpiar si algo falla
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') throw new Error(detail);
        if (Array.isArray(detail)) {
          throw new Error(detail.map((d: any) => d.msg).join(', '));
        }
        throw new Error(`Error ${err.response?.status}: ${err.message}`);
      }
      throw err;
    }
  },
};