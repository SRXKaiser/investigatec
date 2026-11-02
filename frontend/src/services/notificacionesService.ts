import api from './api';
import type { NotificacionApi } from '../types';

export const notificacionesService = {
  async listar() {
    const { data } = await api.get<NotificacionApi[]>('/notificaciones/');
    return data;
  },
  async marcarLeida(id: number) {
    const { data } = await api.patch<NotificacionApi>(`/notificaciones/${id}/leer`);
    return data;
  },
};
