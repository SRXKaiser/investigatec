import api from './api';
import type { Departamentos } from '../types';

export const departamentosService = {
  async listar(): Promise<Departamentos[]> {
    const { data } = await api.get<Departamentos[]>('/departamentos');
    return data;
  },
};