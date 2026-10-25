import axios, {
    type AxiosResponse
} from 'axios';

import type { ApiFailure, ApiResponse } from '../types/api';
import type {
    CreateReviewRequest,
    ReviewArrayResponse,
    ReviewListResponse,
    ReviewRating,
    ReviewResponse,
    ReviewUpdateResponse,
    UpdateReviewRequest,
} from '../types/review';
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

export function obtenerResenasRealizadas(
  calificadorId: number | string
): Promise<ReviewArrayResponse> {
  return manejarSolicitud(
    api.get<ReviewArrayResponse>(
      `/resenas/calificador/${calificadorId}`
    ),
    'No se pudieron cargar las reseñas realizadas.'
  );
}

export function obtenerResenasRecibidas(
  usuarioId: number | string
): Promise<ReviewListResponse> {
  return manejarSolicitud(
    api.get<ReviewListResponse>(`/resenas/usuario/${usuarioId}`),
    'No se pudieron cargar las reseñas recibidas.'
  );
}

export function obtenerResenasPropiedad(
  propiedadId: number | string
): Promise<ReviewListResponse> {
  return manejarSolicitud(
    api.get<ReviewListResponse>(`/resenas/propiedad/${propiedadId}`),
    'No se pudieron cargar las reseñas de la propiedad.'
  );
}

export function obtenerResenasReserva(
  reservaId: number | string
): Promise<ReviewArrayResponse> {
  return manejarSolicitud(
    api.get<ReviewArrayResponse>(`/resenas/reserva/${reservaId}`),
    'No se pudieron cargar las reseñas de la reserva.'
  );
}

export function obtenerMisResenasComoInquilino(): Promise<ReviewListResponse> {
  return manejarSolicitud(
    api.get<ReviewListResponse>('/resenas/como-inquilino'),
    'No se pudieron cargar las reseñas que realizaste.'
  );
}

export function obtenerResenasDeMisPropiedades(): Promise<ReviewListResponse> {
  return manejarSolicitud(
    api.get<ReviewListResponse>('/resenas/mis-propiedades'),
    'No se pudieron cargar las reseñas de tus propiedades.'
  );
}

export function obtenerResenasDeMisEstadias(
  usuarioId: number | string
): Promise<ReviewListResponse> {
  return manejarSolicitud(
    api.get<ReviewListResponse>(`/resenas/usuario/${usuarioId}`),
    'No se pudieron cargar las reseñas de tus estadías.'
  );
}

export function crearResena(
  reservaId: number | string,
  calificacion: ReviewRating,
  comentario: string | null = null
): Promise<ReviewResponse> {
  const datos: CreateReviewRequest = {
    reserva_id: Number(reservaId),
    calificacion,
  };

  if (comentario !== null && comentario.trim() !== '') {
    datos.comentario = comentario.trim();
  }

  return manejarSolicitud(
    api.post<ReviewResponse>('/resenas', datos),
    'No se pudo crear la reseña.'
  );
}

export function actualizarResena(
  resenaId: number | string,
  cambios: UpdateReviewRequest
): Promise<ReviewUpdateResponse> {
  return manejarSolicitud(
    api.put<ReviewUpdateResponse>(`/resenas/${resenaId}`, cambios),
    'No se pudo actualizar la reseña.'
  );
}