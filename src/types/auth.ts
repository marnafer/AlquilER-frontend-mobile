import type { ApiResponse } from './api';

export type LoginRequest = {
  email: string;
  contrasena: string;
};

export type RegisterRequest = {
  nombre: string;
  apellido: string;
  email: string;
  contrasena: string;
  telefono: string;
  domicilio: string;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  rol_id: number;
};

export type PasswordRecoveryRequest = {
  email: string;
};

export type PasswordResetRequest = {
  email: string;
  token: string;
  contrasena: string;
};

export type LoginResponse = ApiResponse<AuthTokens>;
export type RegisterResponse = ApiResponse<[]>;
export type EmptyAuthResponse = ApiResponse<[]>;
export type PasswordRecoveryResponse = EmptyAuthResponse;
export type PasswordResetResponse = EmptyAuthResponse;