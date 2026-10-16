import api from './api';

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

export async function obtenerPerfilPublico(usuarioId) {
    try {
        const response = await api.get(
            `/usuarios/${usuarioId}/perfil-publico`
        );

        return response.data;
    } catch (error) {
        return error.response?.data || {
            success: false,
            message: 'No se pudo cargar el perfil público.',
        };
    }
}
