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

export async function obtenerConsultas() {
    return manejarSolicitud(
        api.get('/consultas'),
        'No se pudieron cargar las consultas.'
    );
}

export async function obtenerConsulta(id) {
    return manejarSolicitud(
        api.get(`/consultas/${id}`),
        'No se pudo cargar la consulta.'
    );
}

export async function obtenerMensajes(
    consultaId,
    parametros = {}
) {
    return manejarSolicitud(
        api.get(`/consultas/${consultaId}/mensajes`, {
            params: parametros,
        }),
        'No se pudieron cargar los mensajes.'
    );
}

export async function enviarMensaje(consultaId, mensaje) {
    return manejarSolicitud(
        api.post(
            `/consultas/${consultaId}/mensajes`,
            { mensaje }
        ),
        'No se pudo enviar el mensaje.'
    );
}

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
        return error.response?.data || {
            success: false,
            message: 'No se pudieron cargar las conversaciones.',
        };
    }
}

export async function crearConsulta(
    propiedadId,
    perfilInteresado
) {
    const payload = {
        propiedad_id: propiedadId,
    };

    if (perfilInteresado) {
        payload.perfil_interesado = perfilInteresado;
    }

    return manejarSolicitud(
        api.post('/consultas', payload),
        'No se pudo iniciar la consulta.'
    );
}
