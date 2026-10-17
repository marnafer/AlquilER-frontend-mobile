import api from './api';

import AsyncStorage from '@react-native-async-storage/async-storage';

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
