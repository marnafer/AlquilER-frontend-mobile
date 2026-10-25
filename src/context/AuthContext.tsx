import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import api, { setSessionExpiredHandler } from '../services/api';
import type { UserResponse } from '../types/user';
import type { User } from '../types/user';

const TOKEN_KEY = '@alquiler_token';
const REFRESH_TOKEN_KEY = '@alquiler_refresh_token';

type AuthContextValue = {
  token: string | null;
  refreshToken: string | null;
  usuario: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, refreshToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  refrescarUsuario: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarUsuario = useCallback(async (): Promise<User | null> => {
    try {
      const response = await api.get<UserResponse>('/usuarios/me');

      if (response.data.success) {
        setUsuario(response.data.data);
        return response.data.data;
      }

      setUsuario(null);
      return null;
    } catch {
      setUsuario(null);
      return null;
    }
  }, []);

  const refrescarUsuario = useCallback(
    (): Promise<User | null> => cargarUsuario(),
    [cargarUsuario]
  );

  const logout = useCallback(async (): Promise<void> => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);

    setToken(null);
    setRefreshToken(null);
    setUsuario(null);
  }, []);

  const cargarSesion = useCallback(async (): Promise<void> => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedRefreshToken =
        await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

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
  }, [cargarUsuario]);

  const login = useCallback(
    async (
      newToken: string,
      newRefreshToken: string | null = null
    ): Promise<void> => {
      await AsyncStorage.setItem(TOKEN_KEY, newToken);

      if (newRefreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      } else {
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      }

      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setUsuario(null);

      await cargarUsuario();
    },
    [cargarUsuario]
  );

  useEffect(() => {
    void cargarSesion();
  }, [cargarSesion]);

  useEffect(() => {
    setSessionExpiredHandler(logout);

    return () => {
      setSessionExpiredHandler(null);
    };
  }, [logout]);

  const value: AuthContextValue = {
    token,
    refreshToken,
    usuario,
    loading,
    isAuthenticated: Boolean(token),
    login,
    logout,
    refrescarUsuario,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }

  return context;
}