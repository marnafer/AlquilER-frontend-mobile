import type { ApiResponse } from './api';
import type { Consultation } from './conversation';

export type AdminModuleKey =
  | 'usuarios'
  | 'categorias'
  | 'provincias'
  | 'localidades'
  | 'roles'
  | 'servicios'
  | 'resenas'
  | 'reservas'
  | 'consultas'
  | 'logs'
  | 'propiedades';

export type AdminJsonValue =
  | string
  | number
  | boolean
  | null
  | AdminJsonValue[]
  | { [key: string]: AdminJsonValue };

export type AdminRecord = { [key: string]: AdminJsonValue };
export type AdminConsultation = Consultation & {
  eliminado?: boolean;
  deleted_at?: string | null;
};

export type AdminConsultationCollection = {
  items: AdminConsultation[];
  total: number;
};

export type AdminConsultationListResponse =
  ApiResponse<AdminConsultationCollection>;

export type AdminCollection<T> = {
  items: T[];
  total: number;
};

export type AdminListResponse<T> = ApiResponse<AdminCollection<T>>;
export type AdminMutationResponse = ApiResponse<AdminJsonValue>;

export type AdminModuleLink = {
  clave: AdminModuleKey;
  emoji: string;
  titulo: string;
  desc: string;
};

export type AdminOption = {
  id: number | string;
  nombre: string;
};

export type AdminField = {
  name: string;
  label: string;
  tipo: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select';
  requerido?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  ayuda?: string;
  soloCrear?: boolean;
  soloEditar?: boolean;
  opciones?: readonly AdminOption[] | AdminModuleKey;
};

export type AdminColumn = {
  key: string;
  label: string;
  render?: (item: AdminRecord) => string;
};

export type AdminAction = {
  label: string;
  accion: 'confirmar' | 'rechazar' | 'finalizar' | 'cancelar';
  estadosPermitidos: string[];
  color: string;
};

export type AdminModuleConfig = {
  clave: AdminModuleKey;
  titulo: string;
  descripcion: string;
  recurso: string;
  papelera?: boolean;
  soloLectura?: boolean;
  permiteCrear?: boolean;
  rutaCrear?: string;
  campos: AdminField[];
  columnas: AdminColumn[];
  filtros?: AdminField[];
  acciones?: AdminAction[];
};

export type AdminMessage = {
  tipo: 'exito' | 'error';
  texto: string;
};
