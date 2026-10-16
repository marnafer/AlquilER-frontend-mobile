import api from './api';

export async function obtenerReservas() {
    try {
        const response = await api.get('/reservas');

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


export async function confirmarReserva(id) {
    try {
        const response = await api.put(`/reservas/${id}/confirmar`);
        return response.data;
    } catch (error) {
        return error.response?.data || {
            success: false,
            message: 'No se pudo confirmar la reserva.',
        };
    }
}

export async function rechazarReserva(id) {
    try {
        const response = await api.put(`/reservas/${id}/rechazar`);
        return response.data;
    } catch (error) {
        return error.response?.data || {
            success: false,
            message: 'No se pudo rechazar la reserva.',
        };
    }
}

export async function crearReserva(
    propiedadId,
    fechaInicio,
    fechaFin
) {
    try {
        const response = await api.post('/reservas', {
            propiedad_id: propiedadId,
            fecha_inicio_alquiler: fechaInicio,
            fecha_fin_alquiler: fechaFin,
        });

        return response.data;
    } catch (error) {
        return error.response?.data || {
            success: false,
            message: 'No se pudo crear la solicitud de reserva.',
        };
    }
}

export async function cancelarReserva(id) {
    try {
        const response = await api.put(`/reservas/${id}/cancelar`);
        return response.data;
    } catch (error) {
        return error.response?.data || {
            success: false,
            message: 'No se pudo cancelar la reserva.',
        };
    }
}

export async function finalizarReserva(id) {
    try {
        const response = await api.put(`/reservas/${id}/finalizar`);
        return response.data;
    } catch (error) {
        return error.response?.data || {
            success: false,
            message: 'No se pudo finalizar la reserva.',
        };
    }
}

