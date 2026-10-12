import api from './api';

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
        const response = await api.post('/favoritos', {
            propiedad_id: propiedadId,
        });

        return response.data;
    } catch (error) {
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