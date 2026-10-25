import type { useRouter } from 'expo-router';
import type { Property } from '../types/property';
import { guardarPropiedadVista } from './recentProperties';

type AppRouter = ReturnType<typeof useRouter>;

export async function abrirPropiedad(
  router: AppRouter,
  propiedad: Pick<Property, 'id'>
): Promise<void> {
  await guardarPropiedadVista(propiedad.id);
  router.push(`/property/${propiedad.id}`);
}