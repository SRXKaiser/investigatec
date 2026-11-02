import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

//Interceptor de request: agrega el token JWT si existe
api.interceptors.request.use( (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

// interceptor de response: maneja errores globales 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // si el token expiró, se cierra sesion
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // lo redigirira al login para volver a acceder a su cuenta
    }
    return Promise.reject(error);
  }
);

export default api;