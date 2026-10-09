import api from '../services/api';

export const soloDia = (f) =>
    f ? String(f).slice(0, 10) : '—';

export const formatearFechaHora = (f) => {
    if (!f) return '—';

    const d = new Date(f);

    return d.toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
};

// toISOString() devuelve la fecha en UTC. Argentina es UTC-3, así que después
// de las 21:00 marcaría el día siguiente como mínimo y no dejaría reservar
// para hoy. Armamos el string con la fecha local.
export const fechaLocalHoy = () => {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
};

// Extrae la lista de items de una respuesta de la API, tolerando los
// distintos formatos que usa el backend ({data: {items}}, {data: [...]}, [...]).
export const extraerItems = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (res?.success === false) return [];
    return [];
};

// Convierte una ruta de imagen guardada (relativa al backend) en una URL
// completa usando la baseURL configurada en el cliente HTTP.
export const construirUrlImagen = (ruta) => {
    if (!ruta) return null;

    const baseUrl = (api.defaults.baseURL ?? '').replace(
        /\/api\/?$/,
        ''
    );

    return `${baseUrl}${
        ruta.startsWith('/') ? ruta : `/${ruta}`
    }`;
};