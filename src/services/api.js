import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const TOKEN_KEY = '@alquiler_token';
const REFRESH_TOKEN_KEY = '@alquiler_refresh_token';

export async function estaAutenticado() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
}

const api = axios.create({
    baseURL: 'http://192.168.100.37:8000/api', //192.168.100.37
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

    export async function obtenerReservas() {
        try {
            const response = await api.get('/reservations');

            return response.data;
        } catch (error) {
            return error.response?.data || {
                success: false,
                message: 'Error de conexión',
            };
        }
    }
    
    export async function obtenerReserva(id) {
        try {
            const response = await api.get(`/reservas/${id}`);
            return response.data;
        } catch (error) {
            return error.response?.data || {
                success: false,
                message: 'Error de conexión',
            };
        }
    }

    export async function obtenerNotificaciones() {
        try {
            const response = await api.get('/notificaciones');  
            return response.data;
        } catch (error) {
            return error.response?.data || {
                success: false,
                message: 'Error de conexión',
            };
        }
    }

    export async function marcarNotificacionLeida(id) {
        try {
            const response = await api.put(
                `/notificaciones/${id}/leer`
            );

            return response.data;
        } catch (error) {
            return error.response?.data || {
                success: false,
                message: 'Error de conexión',
            };
        }
    }

    export async function marcarTodasNotificacionesLeidas() {
        try {
            const response = await api.put(
                '/notificaciones/leer-todas'
            );

            return response.data;
        } catch (error) {
            return error.response?.data || {
                success: false,
                message: 'Error de conexión',
            };
        }
    }

    export async function obtenerCantidadNotificacionesNoLeidas() {
        try {
            const response = await api.get(
                '/notificaciones/no-leidas'
            );

            return response.data;
        } catch (error) {
            return error.response?.data || {
                success: false,
                message: 'Error de conexión',
            };
        }
    }

    
    export async function obtenerConsultas() {
        try {
            const response = await api.get('/consultas');
            return response.data;
        } catch (error) {
            return error.response?.data || {
                success: false,
                message: 'Error de conexión',
            };
        }
    }

    export async function obtenerConsulta(id) {
        try {
            const response = await api.get(`/consultas/${id}`);
            return response.data;
        } catch (error) {
            return error.response?.data || {
                success: false,
                message: 'Error de conexión',
            };
        }
    }

    export async function obtenerMensajes(consultaId, parametros = {}) {
        try {
            const response = await api.get(
                `/consultas/${consultaId}/mensajes`,
                { params: parametros }
            );

            return response.data;
        } catch (error) {
            return error.response?.data || {
                success: false,
                message: 'Error de conexión',
            };
        }
    }

    export const enviarMensaje = async (consultaId, mensaje) => {
        const response = await api.post(
            `/consultas/${consultaId}/mensajes`,
            { mensaje },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    };

    
    export async function obtenerTodasLasConsultas() {
        try {
            const [iniciadasResponse, recibidasResponse] =
                await Promise.all([
                    api.get('/consultas'),
                    api.get('/consultas/recibidas'),
                ]);

            const consultasIniciadas =
                iniciadasResponse.data?.data?.items || [];

            const consultasRecibidas =
                recibidasResponse.data?.data?.items || [];

            const consultasUnicas = [
                ...new Map(
                    [...consultasIniciadas, ...consultasRecibidas]
                        .map((consulta) => [consulta.id, consulta])
                ).values(),
            ];

            consultasUnicas.sort((a, b) => {
                const fechaA = new Date(
                    a.ultima_actividad || a.fecha_consulta || 0
                ).getTime();

                const fechaB = new Date(
                    b.ultima_actividad || b.fecha_consulta || 0
                ).getTime();

                return fechaB - fechaA;
            });

            return {
                success: true,
                data: {
                    items: consultasUnicas,
                    total: consultasUnicas.length,
                },
            };
        } catch (error) {
            console.error(
                'Error al cargar todas las consultas:',
                error.response?.data || error.message
            );

            return error.response?.data || {
                success: false,
                message: 'No se pudieron cargar las conversaciones',
            };
        }
    }

    export async function crearConsulta(propiedadId, perfilInteresado) {
    try {
        const payload = {
            propiedad_id: propiedadId,
        };

        if (perfilInteresado) {
            payload.perfil_interesado = perfilInteresado;
        }

        const response = await api.post('/consultas', payload);
        return response.data;
    } catch (error) {
        console.log('ENTRÓ AL CATCH DE crearConsulta');

        console.log(
            'RESPUESTA DEL BACKEND:',
            error?.response?.data
        );

        return error?.response?.data || {
            success: false,
            message: 'No se pudo iniciar la consulta.',
        };
    }
}

export default api;