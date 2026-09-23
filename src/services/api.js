import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.100.37:8000/api',
});

export default api; 

export async function register(userData) {
    try {
        const response = await api.post('/autenticador/register', userData);

        return response.data;
    } catch (error) {
        return error.response?.data || {
            success: false,
            message: 'Error de conexión'
        };
    }
}