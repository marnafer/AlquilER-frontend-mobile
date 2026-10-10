import api from '../services/api';
import { extraerItems } from './formato';

export interface Servicio {
    id: number | string;
    nombre: string;
}

export async function obtenerServicios(): Promise<Servicio[]> {
    const response = await api.get('/servicios');

    if (response.data?.success === false) {
        throw new Error(
            response.data?.message || 'No se pudieron cargar los servicios.'
        );
    }

    return extraerItems(response.data) as Servicio[];
}

export const iconoServicio = (nombre: string): string => {
    const texto = nombre
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    if (texto.includes('wifi') || texto.includes('internet')) return '📶';
    if (texto.includes('aire acondicionado')) return '❄️';
    if (texto.includes('calefaccion')) return '🌡️';
    if (texto.includes('piscina')) return '🏊';
    if (texto.includes('estacionamiento') || texto.includes('cochera')) {
        return '🚗';
    }
    if (texto.includes('tv')) return '📺';
    if (texto.includes('cocina')) return '🍳';
    if (texto.includes('seguridad')) return '🛡️';
    if (texto.includes('limpieza')) return '🧹';
    if (texto.includes('amueblado')) return '🛋️';
    if (texto.includes('balcon')) return '🌇';
    if (texto.includes('mascota')) return '🐾';
    if (texto.includes('gas')) return '🔥';
    if (texto.includes('hijo')) return '👶';
    if (texto.includes('agua')) return '🚿';
    if (texto.includes('luz')) return '💡';
    if (texto.includes('heladera')) return '🧊';
    if (texto.includes('lavadero')) return '🧺';
    if (texto.includes('patio') || texto.includes('cesped')) return '🌿';
    if (texto.includes('gimnasio')) return '🏋️';
    if (texto.includes('ascensor')) return '🛗';
    if (texto.includes('escritorio')) return '💻';
    if (texto.includes('calle')) return '🛣️';

    return '✓';
};
