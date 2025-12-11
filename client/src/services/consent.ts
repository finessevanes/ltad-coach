import axios from 'axios';
import camelcaseKeys from 'camelcase-keys';
import { ConsentFormData } from '../types/consent';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export const consentService = {
  async getForm(token: string): Promise<ConsentFormData> {
    const response = await api.get(`/consent/${token}`);
    return camelcaseKeys(response.data, { deep: true });
  },

  async sign(token: string): Promise<void> {
    await api.post(`/consent/${token}/sign`, { acknowledged: true });
  },

  async decline(token: string): Promise<void> {
    await api.post(`/consent/${token}/decline`);
  },
};
