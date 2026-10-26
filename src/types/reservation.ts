import type { ApiResponse } from './api';
import type { Property } from './property';
import type { Review } from './review';
import type { User } from './user';

export type ReservationReview = Review;
export type ReservationId = number | string;

export type ReservationStatus =
  | 'pendiente'
  | 'confirmada'
  | 'rechazada'
  | 'cancelada'
  | 'finalizada';


export type Reservation = {
  id: number;
  propiedad_id: number;
  usuario_id: number;
  fecha_inicio_alquiler: string;
  fecha_fin_alquiler: string;
  estado: ReservationStatus;
  fecha_reserva: string;
  fecha_confirmacion: string | null;
  propiedad: Property;
  usuario: User;
};

export type ReservationDetail = Reservation & {
  resenas: ReservationReview[];
};

export type ReservationLists = {
  mis_reservas: Reservation[];
  reservas_de_mis_propiedades: Reservation[];
  todas?: Reservation[];
};

export type CreateReservationRequest = {
  propiedad_id: number;
  fecha_inicio_alquiler: string;
  fecha_fin_alquiler: string;
};

export type ReservationsResponse = ApiResponse<ReservationLists>;
export type ReservationDetailResponse = ApiResponse<ReservationDetail>;
export type ReservationCreatedResponse = ApiResponse<{ id: number }>;
export type ReservationActionResponse = ApiResponse<[]>;