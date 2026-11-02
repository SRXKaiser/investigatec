import axios from "axios";
import type { Usuario } from "../types";
import api from "./api";

export const usuariosService = {
    //para poder hacer SELECT  de los usuarios
    async selecUsuarios(): Promise<Usuario[]>{
        try{
            const { data } = await api.get<Usuario[]>('/usuarios');
            return data;
        }catch(error){
            if (axios.isAxiosError(error)){
                throw new Error(error.response?.data?.detail || 'Error al cargar usuarios');
      }
      throw error;
            }
        },

    //para poder hacer UPDATE  de los usuarios
     async uptadeUsuario(id: number, payload: Partial<Usuario>): Promise<Usuario> {
    try {
      const { data } = await api.put<Usuario>(`/usuarios/${id}`, payload);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Error al actualizar usuario');
      }
      throw error;
    }
  },

  // Eliminar usuario
  async deleteUsuario(id: number): Promise<void> {
    try {
      await api.delete(`/usuarios/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Error al eliminar usuario');
      }
      throw error;
    }
  },
};



