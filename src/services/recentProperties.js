import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@alquiler/vistas-recientes';
const MAX_ITEMS = 6;

export async function guardarPropiedadVista(propiedadId) {
    try {
        const contenido = await AsyncStorage.getItem(STORAGE_KEY);

        const propiedades = contenido
            ? JSON.parse(contenido)
            : [];

        const id = Number(propiedadId);

        if (!Number.isInteger(id) || id <= 0) {
            return;
        }

        const actualizadas = [
            id,
            ...propiedades.filter(
                (propiedad) => propiedad !== id
            ),
        ].slice(0, MAX_ITEMS);

        await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(actualizadas)
        );
    } catch (error) {
        console.error(
            'Error guardando propiedad vista:',
            error
        );
    }
}

export async function obtenerPropiedadesVistas() {
    try {
        const contenido = await AsyncStorage.getItem(STORAGE_KEY);

        if (!contenido) {
            return [];
        }

        const propiedades = JSON.parse(contenido);

        if (!Array.isArray(propiedades)) {
            return [];
        }

        return propiedades;
    } catch (error) {
        console.error(
            'Error obteniendo propiedades vistas:',
            error
        );

        return [];
    }
}

export async function limpiarPropiedadesVistas() {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error(
            'Error limpiando propiedades vistas:',
            error
        );
    }
}