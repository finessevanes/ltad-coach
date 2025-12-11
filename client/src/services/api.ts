import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - convert camelCase to snake_case
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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

    // Handle 401 - token refresh will be added in FE-002
    if (error.response?.status === 401) {
      // Token refresh logic will be added when Firebase Auth is integrated
      console.warn('Unauthorized request - auth handling to be added in FE-002');
    }

    return Promise.reject(error);
  }
);

export { api };
