import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.100.37:8000/api',
});

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
            message: 'Error de conexión'
        };
    }
}


export async function login(userData) {
    try {
        console.log('📤 LOGIN - enviando:', userData);

        const response = await api.post(
            '/autenticador/login',
            userData
        );

        console.log('📥 LOGIN - status:', response.status);
        console.log('📥 LOGIN - respuesta:', response.data);

        return response.data;
    } catch (error) {
        console.error('❌ LOGIN - error:', error);
        console.error('❌ LOGIN - mensaje:', error.message);
        console.error(
            '❌ LOGIN - respuesta backend:',
            error.response?.data
        );

        return error.response?.data || {
            success: false,
            message: 'Error de conexión'
        };
    }
}


export default api;