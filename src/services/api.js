import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const TOKEN_KEY = '@alquiler_token';
const REFRESH_TOKEN_KEY = '@alquiler_refresh_token';

export async function estaAutenticado() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
}

const api = axios.create({
    baseURL: 'http://192.168.100.37:8000/api',
});

let refreshing = false;
let refreshSubscribers = [];

const subscribeToRefresh = (callback) => {
    refreshSubscribers.push(callback);
};

const notifyRefreshSubscribers = (token) => {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
};

const refreshAccessToken = async () => {
    const refreshToken = await AsyncStorage.getItem(
        REFRESH_TOKEN_KEY
    );

    if (!refreshToken) {
        throw new Error('No hay refresh token');
    }

    const response = await axios.post(
        `${api.defaults.baseURL}/autenticador/refresh`,
        {
            refresh_token: refreshToken,
        }
    );

    const {
        access_token,
        refresh_token: newRefreshToken,
    } = response.data.data;

    await AsyncStorage.setItem(
        TOKEN_KEY,
        access_token
    );

    await AsyncStorage.setItem(
        REFRESH_TOKEN_KEY,
        newRefreshToken
    );

    return access_token;
};

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem(
            TOKEN_KEY
        );

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status !== 401 ||
            originalRequest?._retry ||
            originalRequest?.url?.includes('/autenticador/login') ||
            originalRequest?.url?.includes('/autenticador/register') ||
            originalRequest?.url?.includes('/autenticador/refresh')
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

                    originalRequest.headers.Authorization =
                        `Bearer ${token}`;

                    resolve(api(originalRequest));
                });
            });
        }

        refreshing = true;

        try {
            const newToken = await refreshAccessToken();

            notifyRefreshSubscribers(newToken);

            originalRequest.headers.Authorization =
                `Bearer ${newToken}`;

            return api(originalRequest);
        } catch (refreshError) {
           await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);

            notifyRefreshSubscribers(null);

            if (onSessionExpired) {
                onSessionExpired();
            }

            return Promise.reject(refreshError);
        } finally {
            refreshing = false;
        }
    }
);

export async function register(userData) {
    try {
        const response = await api.post(
            '/autenticador/register',
            userData
        );

        return response.data;
    } catch (error) {
        return error.response?.data || {
            success: false,
            message: 'Error de conexión',
        };
    }
}

export async function login(userData) {
    try {
        console.log('📤 LOGIN - enviando:', userData);

        const response = await api.post(
            '/autenticador/login',
            userData
        );

        console.log('📥 LOGIN - status:', response.status);
        console.log('📥 LOGIN - respuesta:', response.data);

        return response.data;
    } catch (error) {
        console.error('❌ LOGIN - error:', error);
        console.error('❌ LOGIN - mensaje:', error.message);
        console.error(
            '❌ LOGIN - respuesta backend:',
            error.response?.data
        );

        return error.response?.data || {
            success: false,
            message: 'Error de conexión',
        };
    }
    
}

export async function obtenerFavoritos() {
        try {
            const response = await api.get('/favoritos');
            return response.data;
        } catch (error) {
            return error.response?.data || {
                success: false,
                message: 'Error de conexión',
            };
        }
    }

    export async function agregarFavorito(propiedadId) {
        try {
            console.log('FAVORITO propiedadId:', propiedadId);

            const response = await api.post('/favoritos', {
                propiedad_id: propiedadId,
            });

            console.log('FAVORITO status:', response.status);
            console.log('FAVORITO response:', response.data);

            return response.data;
        } catch (error) {
            console.log(
                'FAVORITO error status:',
                error.response?.status
            );

            console.log(
                'FAVORITO error data:',
                error.response?.data
            );

            return error.response?.data || {
                success: false,
                message: 'Error de conexión',
            };
        }
    }

    export async function eliminarFavorito(propiedadId) {
        try {
            const response = await api.delete(
                `/favoritos/propiedad/${propiedadId}`
            );

            return response.data;
        } catch (error) {
            return error.response?.data || {
                success: false,
                message: 'Error de conexión',
            };
        }
    }

    export async function obtenerPerfil() {
        try {
            const response = await api.get('/usuarios/me');

            return response.data;
        } catch (error) {
            return error.response?.data || {
                success: false,
                message: 'Error de conexión',
            };
        }
    }
    
    let onSessionExpired = null;

    export const setSessionExpiredHandler = (handler) => {
        onSessionExpired = handler;
    };


export default api;