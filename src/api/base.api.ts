import axios, { AxiosInstance } from 'axios';
import customStorage from '../utils/customStorage';

class BaseApi {
  private api: AxiosInstance;

  constructor(baseURL: string, options = {}) {
    this.api = axios.create({
      baseURL,
      ...options,
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = customStorage.getItem('authToken');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        if (error.response && error.response.status === 401) {
          console.error('Unauthorized! Redirect to login.');
        }
        return Promise.reject(error);
      }
    );
  }

  get<T, R>(url: string, config = {}) {
    return this.api.get<R>(url, { ...config });
  }

  post<T, R>(url: string, data: Partial<T> = {}, config = {}) {
    return this.api.post<R>(url, data, { ...config });
  }

  put<T, R>(url: string, data: Partial<T> = {}, config = {}) {
    return this.api.put<R>(url, data, { ...config });
  }

  delete(url: string, config = {}) {
    return this.api.delete(url, { ...config });
  }
}

export default BaseApi;