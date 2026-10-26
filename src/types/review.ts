import type { ApiResponse } from './api';
import type { Property } from './property';
import type { ReservationStatus } from './reservation';
import type { User } from './user';

export type ReviewType = 'inquilino' | 'propiedad';
export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export type Review = {
  id: number;
  reserva_id: number;
  tipo: ReviewType;
  calificador_id: number;
  calificacion: ReviewRating;
  comentario: string | null;
  fecha_publicacion: string;
};

export type ReviewReservation = {
  id: number;
  propiedad_id: number;
  usuario_id: number;
  fecha_inicio_alquiler: string;
  fecha_fin_alquiler: string;
  estado: ReservationStatus;
  fecha_reserva: string;
  fecha_confirmacion: string | null;
  propiedad?: Property | null;
  usuario?: User | null;
};

export type ReviewWithRelations = Review & {
  reserva?: ReviewReservation | null;
  calificador?: User | null;
};

export type ReviewCollection = {
  items: ReviewWithRelations[];
  total: number;
  promedio?: number;
};

export type CreateReviewRequest = {
  reserva_id: number;
  calificacion: ReviewRating;
  comentario?: string | null;
};

export type UpdateReviewRequest = {
  calificacion?: ReviewRating;
  comentario?: string;
};

export type ReviewListResponse = ApiResponse<ReviewCollection>;
export type ReviewArrayResponse = ApiResponse<ReviewWithRelations[]>;
export type ReviewResponse = ApiResponse<Review>;
export type ReviewUpdateResponse = ApiResponse<null>;