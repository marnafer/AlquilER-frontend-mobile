import type { ApiResponse } from './api';
import type { Property } from './property';
import type { User } from './user';

export type InterestedProfile = {
  fecha_mudanza: string;
  cantidad_ocupantes: number | string;
  tiene_mascotas: boolean | 'true' | 'false' | '1' | '0';
  cantidad_mascotas: number | string;
  garantias: (
    | 'recibo_sueldo'
    | 'garantia_propietaria'
    | 'seguro_caucion'
    | 'garante'
  )[];
};

export type ConversationProperty = Property & {
  usuario?: User | null;
};

export type Consultation = {
  id: number;
  propiedad_id: number;
  usuario_id: number;
  fecha_consulta: string;
  perfil_interesado?: InterestedProfile | null;
  propiedad?: ConversationProperty | null;
  usuario?: User | null;
  ultimo_mensaje?: string | null;
  ultima_actividad?: string | null;
};

export type ConversationMessage = {
  id: number;
  consulta_id: number;
  usuario_id: number;
  mensaje: string;
  fecha_mensaje: string;
  usuario?: User | null;
};

export type ConsultationCollection = {
  items: Consultation[];
  total: number;
};

export type MessageHistory = {
  items: ConversationMessage[];
  total: number;
  hay_anteriores: boolean;
  hay_mas_nuevos: boolean;
};

export type MessageHistoryParams = {
  limite?: number;
  antes_de_id?: number;
  despues_de_id?: number;
};

export type CreateConsultationRequest = {
  propiedad_id: number;
};

export type SendMessageRequest = {
  mensaje: string;
};

export type ConsultationListResponse =
  ApiResponse<ConsultationCollection>;
export type ConsultationDetailResponse = ApiResponse<Consultation>;
export type ConsultationCreatedResponse = ApiResponse<{ id: number }>;
export type MessageHistoryResponse = ApiResponse<MessageHistory>;
export type MessageCreatedResponse = ApiResponse<ConversationMessage>;