import type { ApiResponse } from './api';
import type { Property } from './property';
import type { Review } from './review';

export type UserResponse = ApiResponse<User>;
export type PublicUserProfileResponse = ApiResponse<PublicUserProfile>;

export type PublicProfileReview = Review & {
  calificador: User | null;
  reserva: {
    id: number;
    propiedad_id: number;
    usuario_id: number;
    fecha_inicio_alquiler: string;
    fecha_fin_alquiler: string;
    estado:
      | 'pendiente'
      | 'confirmada'
      | 'rechazada'
      | 'cancelada'
      | 'finalizada';
    fecha_reserva: string;
    fecha_confirmacion: string | null;
    propiedad?: Property;
    usuario?: User;
  };
};

export type PublicUserProfile = {
  id: number;
  nombre: string;
  apellido: string;
  calificaciones: {
    inquilino: number;
    propiedades: number | null;
  };
  resenas: {
    inquilino: PublicProfileReview[];
    propiedades: PublicProfileReview[];
  };
};

export type UserRole = {
  id: number;
  nombre: string;
};

export type User = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  email_verified_at: string | null;
  email_verification_expires_at: string | null;
  telefono: string | null;
  domicilio: string | null;
  rol_id: number;
  rol?: UserRole | null;
};