import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const TOKEN_KEY = '@alquiler_token';

export async function estaAutenticado() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
}

export async function register(userData) {
    try {
        const response = await api.post(
            '/autenticador/register',
            userData
        );

        return response.data;
    } catch (error) {
        return error.response?.data || {
            success: false,
            message: 'Error de conexión',
        };
    }
}

export async function login(userData) {
    try {
        const response = await api.post(
            '/autenticador/login',
            userData
        );

        return response.data;
    } catch (error) {
        return error.response?.data || {
            success: false,
            message: 'Error de conexión',
        };
    }
}

export async function solicitarRecuperacion(email) {
    try {
        const response = await api.post(
            '/autenticador/recuperar',
            { email: email.trim() }
        );

        return response.data;
    } catch (error) {
        return error.response?.data || {
            success: false,
            message: 'Error de conexión',
        };
    }
}

export async function restablecerContrasena({
    email,
    token,
    contrasena,
}) {
    try {
        const response = await api.post(
            '/autenticador/restablecer',
            {
                email: email.trim(),
                token: token.trim(),
                contrasena,
            }
        );

        return response.data;
    } catch (error) {
        return error.response?.data || {
            success: false,
            message: 'Error de conexión',
        };
    }
}
