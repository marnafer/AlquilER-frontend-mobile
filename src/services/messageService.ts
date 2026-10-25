import axios, {
    type AxiosResponse
} from 'axios';

import type { ApiFailure, ApiResponse } from '../types/api';
import type {
    Consultation,
    ConsultationCollection,
    ConsultationCreatedResponse,
    ConsultationDetailResponse,
    ConsultationListResponse,
    CreateConsultationRequest,
    MessageCreatedResponse,
    MessageHistoryParams,
    MessageHistoryResponse,
    SendMessageRequest,
} from '../types/conversation';
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

export function obtenerConsultas(): Promise<ConsultationListResponse> {
  return manejarSolicitud(
    api.get<ConsultationListResponse>('/consultas'),
    'No se pudieron cargar las consultas.'
  );
}

export function obtenerConsulta(
  id: number | string
): Promise<ConsultationDetailResponse> {
  return manejarSolicitud(
    api.get<ConsultationDetailResponse>(`/consultas/${id}`),
    'No se pudo cargar la consulta.'
  );
}

export function obtenerMensajes(
  consultaId: number | string,
  parametros: MessageHistoryParams = {}
): Promise<MessageHistoryResponse> {
  return manejarSolicitud(
    api.get<MessageHistoryResponse>(
      `/consultas/${consultaId}/mensajes`,
      { params: parametros }
    ),
    'No se pudieron cargar los mensajes.'
  );
}

export function enviarMensaje(
  consultaId: number | string,
  mensaje: string
): Promise<MessageCreatedResponse> {
  const datos: SendMessageRequest = { mensaje };

  return manejarSolicitud(
    api.post<MessageCreatedResponse>(
      `/consultas/${consultaId}/mensajes`,
      datos
    ),
    'No se pudo enviar el mensaje.'
  );
}

export async function obtenerTodasLasConsultas(): Promise<ConsultationListResponse> {
  const [iniciadas, recibidas] = await Promise.all([
    obtenerConsultas(),
    manejarSolicitud(
      api.get<ConsultationListResponse>('/consultas/recibidas'),
      'No se pudieron cargar las conversaciones.'
    ),
  ]);

  if (!iniciadas.success) {
    return iniciadas;
  }

  if (!recibidas.success) {
    return recibidas;
  }

  const unicas = new Map<number, Consultation>();

  for (const consulta of [
    ...iniciadas.data.items,
    ...recibidas.data.items,
  ]) {
    unicas.set(consulta.id, consulta);
  }

  const items = [...unicas.values()].sort((a, b) => {
    const fechaA = new Date(
      a.ultima_actividad ?? a.fecha_consulta
    ).getTime();
    const fechaB = new Date(
      b.ultima_actividad ?? b.fecha_consulta
    ).getTime();

    return fechaB - fechaA;
  });

  const data: ConsultationCollection = {
    items,
    total: items.length,
  };

  return {
    success: true,
    data,
  };
}

export function crearConsulta(
  propiedadId: number
): Promise<ConsultationCreatedResponse> {
  const datos: CreateConsultationRequest = {
    propiedad_id: propiedadId,
  };

  return manejarSolicitud(
    api.post<ConsultationCreatedResponse>('/consultas', datos),
    'No se pudo iniciar la consulta.'
  );
}