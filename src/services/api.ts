import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

type RefreshTokenData = {
  access_token: string;
  refresh_token: string;
  rol_id: number;
};

type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

type ApiError = {
  success: false;
  error: string;
  validation_errors?: Record<string, string[]>;
};

type SessionExpiredHandler = () => void | Promise<void>;
type RefreshSubscriber = (token: string | null) => void;

const TOKEN_KEY = '@alquiler_token';
const REFRESH_TOKEN_KEY = '@alquiler_refresh_token';

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ||
  'http://192.168.100.37:8000/api';

const api = axios.create({ baseURL });

let refreshing = false;
let refreshSubscribers: RefreshSubscriber[] = [];
let onSessionExpired: SessionExpiredHandler | null = null;

const subscribeToRefresh = (callback: RefreshSubscriber): void => {
  refreshSubscribers.push(callback);
};

const notifyRefreshSubscribers = (token: string | null): void => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    throw new Error('No hay refresh token');
  }

  const response = await axios.post<ApiSuccess<RefreshTokenData>>(
    `${baseURL}/autenticador/refresh`,
    { refresh_token: refreshToken }
  );

  const {
    access_token: accessToken,
    refresh_token: newRefreshToken,
  } = response.data.data;

  await AsyncStorage.setItem(TOKEN_KEY, accessToken);
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

  return accessToken;
};

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }

    return config;
  },
  (error: AxiosError<ApiError>) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/autenticador/login') ||
      originalRequest.url?.includes('/autenticador/register') ||
      originalRequest.url?.includes('/autenticador/refresh')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (refreshing) {
      return new Promise((resolve, reject) => {
        subscribeToRefresh((token) => {
          if (!token) {
            reject(error);
            return;
          }

          originalRequest.headers.Authorization = 'Bearer ' + token;
          resolve(api(originalRequest));
        });
      });
    }

    refreshing = true;

    try {
      const newToken = await refreshAccessToken();

      notifyRefreshSubscribers(newToken);
      originalRequest.headers.Authorization = 'Bearer ' + newToken;

      return api(originalRequest);
    } catch (refreshError) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);

      notifyRefreshSubscribers(null);

      if (onSessionExpired) {
        void onSessionExpired();
      }

      return Promise.reject(refreshError);
    } finally {
      refreshing = false;
    }
  }
);

export const setSessionExpiredHandler = (
  handler: SessionExpiredHandler | null
): void => {
  onSessionExpired = handler;
};

export default api;