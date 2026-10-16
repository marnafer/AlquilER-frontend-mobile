import api from './api';

async function manejarSolicitud(solicitud, mensajeError) {
    try {
        const response = await solicitud;
        return response.data;
    } catch (error) {
        return error.response?.data || {
            success: false,
            message: mensajeError,
        };
    }
}

/**
 * Obtiene las reseñas realizadas por un usuario.
 */
export async function obtenerResenasRealizadas(calificadorId) {
    return manejarSolicitud(
        api.get(`/resenas/calificador/${calificadorId}`),
        'No se pudieron cargar las reseñas realizadas.'
    );
}

/**
 * Obtiene las reseñas recibidas por un usuario.
 */
export async function obtenerResenasRecibidas(usuarioId) {
    return manejarSolicitud(
        api.get(`/resenas/usuario/${usuarioId}`),
        'No se pudieron cargar las reseñas recibidas.'
    );
}

/**
 * Obtiene las reseñas asociadas a una propiedad.
 */
export async function obtenerResenasPropiedad(propiedadId) {
    return manejarSolicitud(
        api.get(`/resenas/propiedad/${propiedadId}`),
        'No se pudieron cargar las reseñas de la propiedad.'
    );
}

/**
 * Obtiene las reseñas asociadas a una reserva.
 */
export async function obtenerResenasReserva(reservaId) {
    return manejarSolicitud(
        api.get(`/resenas/reserva/${reservaId}`),
        'No se pudieron cargar las reseñas de la reserva.'
    );
}

/**
 * Obtiene las reseñas que realizó el usuario autenticado
 * como inquilino sobre propiedades.
 */
export async function obtenerMisResenasComoInquilino() {
    return manejarSolicitud(
        api.get('/resenas/como-inquilino'),
        'No se pudieron cargar las reseñas que realizaste.'
    );
}

/**
 * Obtiene las reseñas de las propiedades del usuario autenticado.
 */
export async function obtenerResenasDeMisPropiedades() {
    return manejarSolicitud(
        api.get('/resenas/mis-propiedades'),
        'No se pudieron cargar las reseñas de tus propiedades.'
    );
}


/**
 * Obtiene las reseñas recibidas por el usuario como inquilino.
 */
export async function obtenerResenasDeMisEstadias(usuarioId) {
    return manejarSolicitud(
        api.get(`/resenas/usuario/${usuarioId}`),
        'No se pudieron cargar las reseñas de tus estadías.'
    );
}


/**
 * Crea una reseña para una reserva finalizada.
 * El backend determina el tipo y el calificador.
 */
export async function crearResena(reservaId, calificacion, comentario = null) {
    const datos = {
        reserva_id: reservaId,
        calificacion,
    };

    if (comentario !== null && comentario.trim() !== '') {
        datos.comentario = comentario.trim();
    }

    return manejarSolicitud(
        api.post('/resenas', datos),
        'No se pudo crear la reseña.'
    );
}

/**
 * Actualiza la calificación o el comentario de una reseña propia.
 */
export async function actualizarResena(resenaId, cambios) {
    return manejarSolicitud(
        api.put(`/resenas/${resenaId}`, cambios),
        'No se pudo actualizar la reseña.'
    );
}