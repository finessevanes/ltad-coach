import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import { auth } from '../firebase/config';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token and convert camelCase to snake_case
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Add Bearer token if user is authenticated
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Convert camelCase to snake_case
    if (config.data && typeof config.data === 'object') {
      config.data = snakecaseKeys(config.data, { deep: true });
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - convert snake_case to camelCase
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      response.data = camelcaseKeys(response.data, { deep: true });
    }
    return response;
  },
  async (error: AxiosError) => {
    // Transform error response data as well
    if (error.response?.data && typeof error.response.data === 'object') {
      error.response.data = camelcaseKeys(
        error.response.data as Record<string, unknown>,
        { deep: true }
      );
    }

    // Handle 401 - sign out user
    if (error.response?.status === 401) {
      await auth.signOut();
    }

    return Promise.reject(error);
  }
);

export { api };
