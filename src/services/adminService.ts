import axios, { type AxiosResponse } from 'axios';

import type { ApiFailure, ApiResponse } from '../types/api';
import type {
  AdminConsultationListResponse,
  AdminJsonValue,
  AdminListResponse,
  AdminModuleKey,
  AdminMutationResponse,
  AdminRecord,
} from '../types/admin';
import api from './api';

const RECURSOS: Record<Exclude<AdminModuleKey, 'consultas'>, string> = {
  usuarios: '/usuarios',
  categorias: '/categorias',
  provincias: '/provincias',
  localidades: '/localidades',
  roles: '/roles',
  servicios: '/servicios',
  resenas: '/resenas',
  reservas: '/reservas',
  logs: '/logs-actividad',
  propiedades: '/admin/propiedades',
};

function esAdminRecord(value: AdminJsonValue): value is AdminRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorDeApi(error: unknown, fallback: string): ApiFailure {
  if (axios.isAxiosError<ApiFailure>(error)) {
    return error.response?.data ?? {
      success: false,
      message: fallback,
    };
  }

  throw error;
}

async function manejarSolicitud<T>(
  solicitud: Promise<AxiosResponse<ApiResponse<T>>>,
  fallback: string
): Promise<ApiResponse<T>> {
  try {
    const response = await solicitud;
    return response.data;
  } catch (error) {
    return errorDeApi(error, fallback);
  }
}

function normalizarItems(payload: AdminJsonValue): AdminRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(esAdminRecord);
  }

  if (!esAdminRecord(payload)) {
    return [];
  }

  const items = payload.items;
  if (Array.isArray(items)) {
    return items.filter(esAdminRecord);
  }

  const todas = payload.todas;
  if (Array.isArray(todas)) {
    return todas.filter(esAdminRecord);
  }

  return [];
}

export async function listarRecursosAdmin(
  modulo: Exclude<AdminModuleKey, 'consultas'>,
  papelera: boolean,
  filtros: Record<string, string> = {}
): Promise<AdminListResponse<AdminRecord>> {
  const recurso = RECURSOS[modulo];
  const params: Record<string, string | number> = { ...filtros };

  if (modulo !== 'logs') {
    params.solo_eliminados = papelera ? 1 : 0;
  }

  const response = await manejarSolicitud(
    api.get<ApiResponse<AdminJsonValue>>(recurso, { params }),
    `No se pudieron cargar ${modulo}.`
  );

  if (!response.success) {
    return response;
  }

  const items = normalizarItems(response.data);

  return {
    success: true,
    data: {
      items,
      total: items.length,
    },
    message: response.message,
  };
}

export function crearRecursoAdmin(
  modulo: Exclude<AdminModuleKey, 'consultas' | 'logs' | 'propiedades'>,
  datos: AdminRecord
): Promise<AdminMutationResponse> {
  const recurso = modulo === 'usuarios'
    ? '/admin/usuarios'
    : modulo === 'reservas'
      ? '/admin/reservas'
      : modulo === 'resenas'
        ? '/admin/resenas'
        : RECURSOS[modulo];

  return manejarSolicitud(
    api.post<AdminMutationResponse>(recurso, datos),
    `No se pudo crear el recurso de ${modulo}.`
  );
}

export function actualizarRecursoAdmin(
  modulo: Exclude<AdminModuleKey, 'consultas' | 'logs'>,
  id: number,
  datos: AdminRecord
): Promise<AdminMutationResponse> {
  return manejarSolicitud(
    api.put<AdminMutationResponse>(`${RECURSOS[modulo]}/${id}`, datos),
    `No se pudo actualizar el recurso de ${modulo}.`
  );
}

export function eliminarRecursoAdmin(
  modulo: Exclude<AdminModuleKey, 'consultas' | 'logs'>,
  id: number
): Promise<AdminMutationResponse> {
  return manejarSolicitud(
    api.delete<AdminMutationResponse>(`${RECURSOS[modulo]}/${id}`),
    `No se pudo eliminar el recurso de ${modulo}.`
  );
}

export function restaurarRecursoAdmin(
  modulo: Exclude<AdminModuleKey, 'consultas' | 'logs'>,
  id: number
): Promise<AdminMutationResponse> {
  return manejarSolicitud(
    api.post<AdminMutationResponse>(`${RECURSOS[modulo]}/${id}/restaurar`),
    `No se pudo restaurar el recurso de ${modulo}.`
  );
}

export function cambiarEstadoReservaAdmin(
  id: number,
  accion: 'confirmar' | 'rechazar' | 'finalizar' | 'cancelar'
): Promise<AdminMutationResponse> {
  return manejarSolicitud(
    api.put<AdminMutationResponse>(`/reservas/${id}/${accion}`),
    'No se pudo actualizar el estado de la reserva.'
  );
}

export function eliminarConsultaAdmin(
  id: number
): Promise<AdminMutationResponse> {
  return manejarSolicitud(
    api.delete<AdminMutationResponse>(`/consultas/${id}`),
    'No se pudo eliminar la consulta.'
  );
}

export function restaurarConsultaAdmin(
  id: number
): Promise<AdminMutationResponse> {
  return manejarSolicitud(
    api.post<AdminMutationResponse>(`/consultas/${id}/restaurar`),
    'No se pudo restaurar la consulta.'
  );
}

export async function listarConsultasAdmin(
  papelera: boolean,
  filtros: Record<string, string> = {}
): Promise<AdminConsultationListResponse> {
  return manejarSolicitud(
    api.get<AdminConsultationListResponse>('/admin/consultas', {
      params: { ...filtros, solo_eliminados: papelera ? 1 : 0 },
    }),
    'No se pudieron cargar las consultas.'
  );
}
