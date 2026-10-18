import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

import api, {
    setSessionExpiredHandler,
} from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = '@alquiler_token';
const REFRESH_TOKEN_KEY = '@alquiler_refresh_token';

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    const cargarUsuario = useCallback(async () => {
        try {
            const response = await api.get('/usuarios/me');

            if (response.data?.success) {
                setUsuario(response.data.data);
                return response.data.data;
            }

            setUsuario(null);
            return null;
        } catch (error) {
            setUsuario(null);
            return null;
        }
    }, []);

    const refrescarUsuario = useCallback(async () => {
        return await cargarUsuario();
    }, [cargarUsuario]);

    const logout = async () => {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);

        setToken(null);
        setRefreshToken(null);
        setUsuario(null);
    };

    const cargarSesion = async () => {
        try {
            const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
            const storedRefreshToken = await AsyncStorage.getItem(
                REFRESH_TOKEN_KEY
            );

            setToken(storedToken);
            setRefreshToken(storedRefreshToken);

            if (storedToken) {
                await cargarUsuario();
            } else {
                setUsuario(null);
            }
        } catch (error) {
            console.error('Error al cargar la sesión:', error);
            setUsuario(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (newToken, newRefreshToken = null) => {
        await AsyncStorage.setItem(TOKEN_KEY, newToken);

        if (newRefreshToken) {
            await AsyncStorage.setItem(
                REFRESH_TOKEN_KEY,
                newRefreshToken
            );
        } else {
            await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
        }

        setToken(newToken);
        setRefreshToken(newRefreshToken);
        setUsuario(null);

        // El interceptor de Axios debe utilizar el token nuevo.
        await cargarUsuario();
    };

    useEffect(() => {
        cargarSesion();
    }, []);

    useEffect(() => {
        setSessionExpiredHandler(logout);

        return () => {
            setSessionExpiredHandler(null);
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                token,
                refreshToken,
                usuario,
                loading,
                isAuthenticated: !!token,
                login,
                logout,
                refrescarUsuario,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth debe utilizarse dentro de AuthProvider'
        );
    }

    return context;
}