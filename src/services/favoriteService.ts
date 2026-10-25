import axios, { type AxiosResponse } from 'axios';

import type { ApiFailure, ApiResponse } from '../types/api';
import type {
    AddFavoriteRequest,
    AddFavoriteResponse,
    FavoritesResponse,
    RemoveFavoriteResponse,
} from '../types/favorite';
import api from './api';

async function ejecutarSolicitud<T>(
  operacion: () => Promise<AxiosResponse<ApiResponse<T>>>,
  mensajeFallback: string
): Promise<ApiResponse<T>> {
  try {
    const response = await operacion();
    return response.data;
  } catch (error) {
    if (axios.isAxiosError<ApiFailure>(error)) {
      return (
        error.response?.data ?? {
          success: false,
          message: mensajeFallback,
        }
      );
    }

    throw error;
  }
}

export function obtenerFavoritos(): Promise<FavoritesResponse> {
  return ejecutarSolicitud(
    () => api.get<FavoritesResponse>('/favoritos'),
    'Error de conexión'
  );
}

export function agregarFavorito(
  propiedadId: number
): Promise<AddFavoriteResponse> {
  const datos: AddFavoriteRequest = {
    propiedad_id: propiedadId,
  };

  return ejecutarSolicitud(
    () => api.post<AddFavoriteResponse>('/favoritos', datos),
    'Error de conexión'
  );
}

export function eliminarFavorito(
  propiedadId: number
): Promise<RemoveFavoriteResponse> {
  return ejecutarSolicitud(
    () => api.delete<RemoveFavoriteResponse>(
      `/favoritos/propiedad/${propiedadId}`
    ),
    'Error de conexión'
  );
}