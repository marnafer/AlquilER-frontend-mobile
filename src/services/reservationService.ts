import axios, { type AxiosResponse } from 'axios';

import type { ApiFailure } from '../types/api';
import type {
    CreateReservationRequest,
    ReservationActionResponse,
    ReservationCreatedResponse,
    ReservationDetailResponse,
    ReservationId,
    ReservationsResponse,
} from '../types/reservation';
import api from './api';

async function ejecutarSolicitud<T>(
  operacion: () => Promise<AxiosResponse<T>>,
  mensajeFallback: string
): Promise<T | ApiFailure> {
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

export function obtenerReservas(): Promise<ReservationsResponse | ApiFailure> {
  return ejecutarSolicitud(
    () => api.get<ReservationsResponse>('/reservas'),
    'Error de conexión'
  );
}

export function obtenerReserva(
  id: ReservationId
): Promise<ReservationDetailResponse | ApiFailure> {
  return ejecutarSolicitud(
    () => api.get<ReservationDetailResponse>(`/reservas/${id}`),
    'Error de conexión'
  );
}

export function confirmarReserva(
  id: ReservationId
): Promise<ReservationActionResponse | ApiFailure> {
  return ejecutarSolicitud(
    () => api.put<ReservationActionResponse>(`/reservas/${id}/confirmar`),
    'No se pudo confirmar la reserva.'
  );
}

export function rechazarReserva(
  id: ReservationId
): Promise<ReservationActionResponse | ApiFailure> {
  return ejecutarSolicitud(
    () => api.put<ReservationActionResponse>(`/reservas/${id}/rechazar`),
    'No se pudo rechazar la reserva.'
  );
}

export function crearReserva(
  propiedadId: ReservationId,
  fechaInicio: string,
  fechaFin: string
): Promise<ReservationCreatedResponse | ApiFailure> {
  const datos: CreateReservationRequest = {
    propiedad_id: Number(propiedadId),
    fecha_inicio_alquiler: fechaInicio,
    fecha_fin_alquiler: fechaFin,
  };

  return ejecutarSolicitud(
    () => api.post<ReservationCreatedResponse>('/reservas', datos),
    'No se pudo crear la solicitud de reserva.'
  );
}

export function cancelarReserva(
  id: ReservationId
): Promise<ReservationActionResponse | ApiFailure> {
  return ejecutarSolicitud(
    () => api.put<ReservationActionResponse>(`/reservas/${id}/cancelar`),
    'No se pudo cancelar la reserva.'
  );
}

export function finalizarReserva(
  id: ReservationId
): Promise<ReservationActionResponse | ApiFailure> {
  return ejecutarSolicitud(
    () => api.put<ReservationActionResponse>(`/reservas/${id}/finalizar`),
    'No se pudo finalizar la reserva.'
  );
}