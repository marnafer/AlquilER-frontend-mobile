export const GARANTIAS = [
    { valor: 'recibo_sueldo', etiqueta: 'Recibo de sueldo' },
    { valor: 'garantia_propietaria', etiqueta: 'Garantía propietaria' },
    { valor: 'seguro_caucion', etiqueta: 'Seguro de caución' },
    { valor: 'garante', etiqueta: 'Garante' },
];

export const ETIQUETAS_GARANTIAS = Object.fromEntries(
    GARANTIAS.map(({ valor, etiqueta }) => [valor, etiqueta])
);

export const ETIQUETAS_PRECALIFICACION = {
    coincide: 'Coincide',
    revisar: 'Revisar requisitos',
    sin_criterios: 'Sin criterios',
    sin_datos: 'Sin datos',
};

export function esFechaISO(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return false;
    }

    const valor = new Date(`${fecha}T00:00:00`);
    return (
        !Number.isNaN(valor.getTime()) &&
        valor.toISOString().slice(0, 10) === fecha
    );
}

function esVerdadero(valor) {
    return valor === true || valor === 1 || valor === '1' || valor === 'true';
}

export function evaluarPrecalificacion(consulta, propiedad) {
    const perfil = consulta?.perfil_interesado;

    if (!perfil) {
        return { estado: 'sin_datos', motivos: [] };
    }

    const requisitos = propiedad?.requisitos_interesados || {};
    const maxOcupantes = Number(requisitos.max_ocupantes) || null;
    const fechaDisponible = requisitos.fecha_disponible_desde || '';
    const garantiasAceptadas = Array.isArray(requisitos.garantias_aceptadas)
        ? requisitos.garantias_aceptadas
        : [];
    const noAceptaMascotas =
        propiedad?.acepta_mascotas === false ||
        Number(propiedad?.acepta_mascotas) === 0 ||
        propiedad?.acepta_mascotas === 'false';
    const hayCriterios = Boolean(
        maxOcupantes ||
        fechaDisponible ||
        garantiasAceptadas.length ||
        noAceptaMascotas
    );

    if (!hayCriterios) {
        return { estado: 'sin_criterios', motivos: [] };
    }

    const motivos = [];

    if (
        maxOcupantes &&
        Number(perfil.cantidad_ocupantes) > maxOcupantes
    ) {
        motivos.push(`Supera el máximo de ${maxOcupantes} ocupantes`);
    }

    if (
        fechaDisponible &&
        perfil.fecha_mudanza < fechaDisponible
    ) {
        motivos.push(
            `La mudanza es anterior al ${fechaDisponible}`
        );
    }

    if (
        garantiasAceptadas.length &&
        !garantiasAceptadas.some((garantia) =>
            (perfil.garantias || []).includes(garantia)
        )
    ) {
        motivos.push('No indicó una de las garantías aceptadas');
    }

    if (noAceptaMascotas && esVerdadero(perfil.tiene_mascotas)) {
        motivos.push('La propiedad no acepta mascotas');
    }

    return {
        estado: motivos.length ? 'revisar' : 'coincide',
        motivos,
    };
}
