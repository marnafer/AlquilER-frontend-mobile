import type { ApiResponse } from './api';

export type NotificationId = number | string;

export type NotificationType =
  | 'reserva_nueva'
  | 'reserva_confirmada'
  | 'reserva_rechazada'
  | 'reserva_finalizada'
  | 'reserva_cancelada'
  | 'consulta_nueva'
  | 'mensaje_nuevo'
  | 'resena_nueva';

export type Notification = {
  id: number;
  usuario_id: number;
  tipo: NotificationType;
  titulo: string;
  mensaje: string | null;
  referencia_id: number | null;
  leida: boolean;
  fecha_notificacion: string;
};

export type NotificationsData = {
  items: Notification[];
  no_leidas: number;
};

export type UnreadNotificationsData = {
  no_leidas: number;
};

export type NotificationsResponse = ApiResponse<NotificationsData>;
export type UnreadNotificationsResponse =
  ApiResponse<UnreadNotificationsData>;
export type MarkNotificationsReadResponse = ApiResponse<[]>;