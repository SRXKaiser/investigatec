import api from './api';
import type { Carreras } from '../types';

export const carrerasService = {
  async listar(): Promise<Carreras[]> {
    const { data } = await api.get<Carreras[]>('/carreras');
    return data;
  },
};