import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@alquiler/vistas-recientes';
const MAX_ITEMS = 6;

type PropertyId = number | string;

function esIdPropiedadValido(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export async function guardarPropiedadVista(
  propiedadId: PropertyId
): Promise<void> {
  const id = Number(propiedadId);

  if (!Number.isInteger(id) || id <= 0) {
    console.error('ID de propiedad inválido al guardar vista:', propiedadId);
    return;
  }

  try {
    const contenido = await AsyncStorage.getItem(STORAGE_KEY);
    let propiedades: number[] = [];

    if (contenido) {
      const parsed: unknown = JSON.parse(contenido);

      if (Array.isArray(parsed)) {
        propiedades = parsed.filter(esIdPropiedadValido);
      } else {
        console.error('El almacenamiento de vistas recientes no contiene una lista.');
      }
    }

    const actualizadas = [
      id,
      ...propiedades.filter((propiedad) => propiedad !== id),
    ].slice(0, MAX_ITEMS);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(actualizadas));
  } catch (error) {
    console.error('Error guardando propiedad vista:', error);
  }
}

export async function obtenerPropiedadesVistas(): Promise<number[]> {
  try {
    const contenido = await AsyncStorage.getItem(STORAGE_KEY);

    if (!contenido) {
      return [];
    }

    const parsed: unknown = JSON.parse(contenido);

    if (!Array.isArray(parsed)) {
      console.error('El almacenamiento de vistas recientes no contiene una lista.');
      return [];
    }

    return parsed.filter(esIdPropiedadValido);
  } catch (error) {
    console.error('Error obteniendo propiedades vistas:', error);
    return [];
  }
}

export async function limpiarPropiedadesVistas(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error limpiando propiedades vistas:', error);
  }
}