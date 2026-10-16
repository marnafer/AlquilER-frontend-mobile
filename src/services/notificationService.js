
import api from './api';

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
