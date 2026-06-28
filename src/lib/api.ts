import { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://omniflow-ai.onrender.com';

/**
 * Maximum number of retries for failed requests (handles Render cold starts).
 * Only retries on network errors and timeouts, not on 4xx/5xx responses.
 */
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2_000;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL + '/api',
      timeout: 60_000, // 60s to accommodate Render free-tier cold starts
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('omniflow_token') || 'demo-token-123';
      if (token) {
        config.headers.Authorization = 'Bearer ' + token;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('omniflow_auth');
          localStorage.removeItem('omniflow_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Wraps an Axios request with automatic retry logic for network errors
   * and timeouts (common with Render free-tier cold starts).
   */
  private async withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      const isNetworkError = !err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error');
      const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ERR_CANCELED';

      if (retries > 0 && (isNetworkError || isTimeout)) {
        console.warn(`[API] Request failed (${err.code || err.message}), retrying in ${RETRY_DELAY_MS}ms... (${retries} left)`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return this.withRetry(fn, retries - 1);
      }
      throw err;
    }
  }

  async put<T = any>(url: string, body?: unknown): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.client.put(url, body);
      return (response.data.data ?? response.data);
    });
  }

  async get<T = any>(url: string, params?: Record<string, string | number>): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.client.get(url, { params });
      return (response.data.data ?? response.data);
    });
  }

  async post<T = any>(url: string, body?: unknown): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.client.post(url, body);
      return (response.data.data ?? response.data);
    });
  }

  async patch<T = any>(url: string, body?: unknown): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.client.patch(url, body);
      return (response.data.data ?? response.data);
    });
  }

  async del<T = any>(url: string): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.client.delete(url);
      return (response.data.data ?? response.data);
    });
  }
}

export const api = new ApiClient();
export default api;
