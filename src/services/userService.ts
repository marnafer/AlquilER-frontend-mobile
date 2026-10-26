import axios, { type AxiosError } from 'axios';

import type { ApiFailure } from '../types/api';
import type {
    PublicUserProfileResponse,
    UserResponse,
} from '../types/user';
import api from './api';

function obtenerErrorApi(
  error: AxiosError<ApiFailure>,
  mensajeFallback: string
): ApiFailure {
  return (
    error.response?.data ?? {
      success: false,
      message: mensajeFallback,
    }
  );
}

export async function obtenerPerfil(): Promise<UserResponse> {
  try {
    const response = await api.get<UserResponse>('/usuarios/me');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError<ApiFailure>(error)) {
      return obtenerErrorApi(error, 'Error de conexión');
    }

    throw error;
  }
}

export async function obtenerPerfilPublico(
  usuarioId: number | string
): Promise<PublicUserProfileResponse> {
  try {
    const response = await api.get<PublicUserProfileResponse>(
      `/usuarios/${usuarioId}/perfil-publico`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError<ApiFailure>(error)) {
      return obtenerErrorApi(
        error,
        'No se pudo cargar el perfil público.'
      );
    }

    throw error;
  }
}