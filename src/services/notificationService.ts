import axios, { type AxiosResponse } from 'axios';

import type { ApiFailure, ApiResponse } from '../types/api';
import type {
    MarkNotificationsReadResponse,
    NotificationId,
    NotificationsResponse,
    UnreadNotificationsResponse,
} from '../types/notification';
import api from './api';

async function manejarSolicitud<T>(
  solicitud: Promise<AxiosResponse<ApiResponse<T>>>,
  mensajeError: string
): Promise<ApiResponse<T>> {
  try {
    const response = await solicitud;
    return response.data;
  } catch (error) {
    if (axios.isAxiosError<ApiFailure>(error)) {
      return (
        error.response?.data ?? {
          success: false,
          message: mensajeError,
        }
      );
    }

    throw error;
  }
}

export function obtenerNotificaciones(): Promise<NotificationsResponse> {
  return manejarSolicitud(
    api.get<NotificationsResponse>('/notificaciones'),
    'Error de conexión'
  );
}

export function marcarNotificacionLeida(
  id: NotificationId
): Promise<MarkNotificationsReadResponse> {
  return manejarSolicitud(
    api.put<MarkNotificationsReadResponse>(
      `/notificaciones/${id}/leer`
    ),
    'Error de conexión'
  );
}

export function marcarTodasNotificacionesLeidas():
  Promise<MarkNotificationsReadResponse> {
  return manejarSolicitud(
    api.put<MarkNotificationsReadResponse>(
      '/notificaciones/leer-todas'
    ),
    'Error de conexión'
  );
}

export function obtenerCantidadNotificacionesNoLeidas():
  Promise<UnreadNotificationsResponse> {
  return manejarSolicitud(
    api.get<UnreadNotificationsResponse>(
      '/notificaciones/no-leidas'
    ),
    'Error de conexión'
  );
}