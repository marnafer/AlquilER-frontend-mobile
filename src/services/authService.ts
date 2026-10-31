import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { type AxiosError } from 'axios';

import type { ApiFailure, ApiResponse } from '../types/api';
import type {
    LoginRequest,
    LoginResponse,
    PasswordRecoveryRequest,
    PasswordRecoveryResponse,
    PasswordResetRequest,
    PasswordResetResponse,
    RegisterRequest,
    RegisterResponse,
} from '../types/auth';
import api from './api';

const TOKEN_KEY = '@alquiler_token';

type AuthRequest =
  | LoginRequest
  | RegisterRequest
  | PasswordRecoveryRequest
  | PasswordResetRequest;

function obtenerErrorApi(error: AxiosError<ApiFailure>): ApiFailure {
  if (error.response?.data) {
    return error.response.data;
  }

  return {
    success: false,
    message: 'Error de conexión',
  };
}

async function enviarSolicitud<T>(
  ruta: string,
  datos: AuthRequest
): Promise<ApiResponse<T>> {
  try {
    const response = await api.post<ApiResponse<T>>(ruta, datos);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError<ApiFailure>(error)) {
      return obtenerErrorApi(error);
    }

    return {
      success: false,
      message: 'Error de conexión',
    };
  }
}

export async function estaAutenticado(): Promise<boolean> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return Boolean(token);
}

export function register(
  userData: RegisterRequest
): Promise<RegisterResponse> {
  return enviarSolicitud<[]>('/autenticador/register', userData);
}

export function login(userData: LoginRequest): Promise<LoginResponse> {
  return enviarSolicitud('/autenticador/login', userData);
}

export function solicitarRecuperacion(
  email: string
): Promise<PasswordRecoveryResponse> {
  const datos: PasswordRecoveryRequest = { email: email.trim() };
  return enviarSolicitud<[]>('/autenticador/recuperar', datos);
}

export function restablecerContrasena(
  datos: PasswordResetRequest
): Promise<PasswordResetResponse> {
  return enviarSolicitud<[]>('/autenticador/restablecer', {
    ...datos,
    email: datos.email.trim(),
    token: datos.token.trim(),
  });
}