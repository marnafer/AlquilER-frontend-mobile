import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = '@alquiler_token';
const REFRESH_TOKEN_KEY = '@alquiler_refresh_token';

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarSesion();
    }, []);

    const cargarSesion = async () => {
        try {
            const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
            const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

            setToken(storedToken);
            setRefreshToken(storedRefreshToken);
        } catch (error) {
            console.error('Error al cargar la sesión:', error);
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
    };

    const logout = async () => {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);

        setToken(null);
        setRefreshToken(null);
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                refreshToken,
                loading,
                isAuthenticated: !!token,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth debe utilizarse dentro de AuthProvider');
    }

    return context;
}