import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const TOKEN_KEY = "@alquiler_token";
const REFRESH_TOKEN_KEY = "@alquiler_refresh_token";

export async function estaAutenticado() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return !!token;
}

const api = axios.create({
  baseURL: "http://192.168.100.37:8000/api", //192.168.100.37
});

let refreshing = false;
let refreshSubscribers = [];

const subscribeToRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const notifyRefreshSubscribers = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const refreshAccessToken = async () => {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    throw new Error("No hay refresh token");
  }

  const response = await axios.post(
    `${api.defaults.baseURL}/autenticador/refresh`,
    {
      refresh_token: refreshToken,
    },
  );

  const { access_token, refresh_token: newRefreshToken } = response.data.data;

  await AsyncStorage.setItem(TOKEN_KEY, access_token);

  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

  return access_token;
};

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url?.includes("/autenticador/login") ||
      originalRequest?.url?.includes("/autenticador/register") ||
      originalRequest?.url?.includes("/autenticador/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (refreshing) {
      return new Promise((resolve, reject) => {
        subscribeToRefresh((token) => {
          if (!token) {
            reject(error);
            return;
          }

          originalRequest.headers.Authorization = `Bearer ${token}`;

          resolve(api(originalRequest));
        });
      });
    }

    refreshing = true;

    try {
      const newToken = await refreshAccessToken();

      notifyRefreshSubscribers(newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);

      notifyRefreshSubscribers(null);

      if (onSessionExpired) {
        onSessionExpired();
      }

      return Promise.reject(refreshError);
    } finally {
      refreshing = false;
    }
  },
);

export async function register(userData) {
  try {
    const response = await api.post("/autenticador/register", userData);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function login(userData) {
  try {
    console.log("📤 LOGIN - enviando:", userData);

    const response = await api.post("/autenticador/login", userData);

    console.log("📥 LOGIN - status:", response.status);
    console.log("📥 LOGIN - respuesta:", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ LOGIN - error:", error);
    console.error("❌ LOGIN - mensaje:", error.message);
    console.error("❌ LOGIN - respuesta backend:", error.response?.data);

    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function obtenerFavoritos() {
  try {
    const response = await api.get("/favoritos");
    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function agregarFavorito(propiedadId) {
  try {
    console.log("FAVORITO propiedadId:", propiedadId);

    const response = await api.post("/favoritos", {
      propiedad_id: propiedadId,
    });

    console.log("FAVORITO status:", response.status);
    console.log("FAVORITO response:", response.data);

    return response.data;
  } catch (error) {
    console.log("FAVORITO error status:", error.response?.status);

    console.log("FAVORITO error data:", error.response?.data);

    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function eliminarFavorito(propiedadId) {
  try {
    const response = await api.delete(`/favoritos/propiedad/${propiedadId}`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function obtenerPerfil() {
  try {
    const response = await api.get("/usuarios/me");

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function actualizarPerfil(id, userData) {
  try {
    const response = await api.put(`/usuarios/${id}`, userData);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

let onSessionExpired = null;

export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler;
};

export async function obtenerReservas() {
  try {
    const response = await api.get("/reservas");

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function obtenerNotificaciones() {
  try {
    const response = await api.get("/notificaciones");
    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function marcarNotificacionLeida(id) {
  try {
    const response = await api.put(`/notificaciones/${id}/leer`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function marcarTodasNotificacionesLeidas() {
  try {
    const response = await api.put("/notificaciones/leer-todas");

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function obtenerCantidadNotificacionesNoLeidas() {
  try {
    const response = await api.get("/notificaciones/no-leidas");

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}
// ============================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================

export async function recuperarContrasena(email) {
  try {
    const response = await api.post("/autenticador/recuperar", {
      email,
    });

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function restablecerContrasena(data) {
  try {
    const response = await api.post("/autenticador/restablecer", data);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

// ============================================
// PROPIEDADES (gestión del usuario)
// ============================================

export async function obtenerMisPropiedades() {
  try {
    const response = await api.get("/propiedades/mis-propiedades");

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function actualizarPropiedad(id, data) {
  try {
    const response = await api.put(`/propiedades/${id}`, data);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function eliminarPropiedad(id) {
  try {
    const response = await api.delete(`/propiedades/${id}`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

// ============================================
// RESERVAS
// ============================================

// GET /api/reservas devuelve las reservas del usuario autenticado ya
// clasificadas por el backend en mis_reservas y
// reservas_de_mis_propiedades (los admins además reciben "todas").
export async function obtenerReservas() {
  try {
    const response = await api.get("/reservas");

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

// Normaliza la respuesta clasificada de /api/reservas. Devuelve siempre las
// tres listas, con "todas" como concatenación de las otras dos cuando el
// backend no la manda (usuarios comunes).
export function separarReservas(res) {
  const data = res?.data ?? {};

  const misReservas = Array.isArray(data.mis_reservas) ? data.mis_reservas : [];

  const reservasDeMisPropiedades = Array.isArray(
    data.reservas_de_mis_propiedades,
  )
    ? data.reservas_de_mis_propiedades
    : [];

  const todas = Array.isArray(data.todas)
    ? data.todas
    : [...misReservas, ...reservasDeMisPropiedades];

  return {
    misReservas,
    reservasDeMisPropiedades,
    todas,
  };
}

export async function obtenerReserva(id) {
  try {
    const response = await api.get(`/reservas/${id}`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function crearReserva(data) {
  try {
    const response = await api.post("/reservas", data);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function aprobarReserva(id) {
  // En el backend "aprobar" equivale a confirmar
  try {
    const response = await api.put(`/reservas/${id}/confirmar`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function rechazarReserva(id) {
  try {
    const response = await api.put(`/reservas/${id}/rechazar`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function finalizarReserva(id) {
  try {
    const response = await api.put(`/reservas/${id}/finalizar`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function cancelarReserva(id) {
  try {
    const response = await api.put(`/reservas/${id}/cancelar`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

// ============================================
// CONSULTAS
// ============================================

export async function crearConsulta(data) {
  try {
    const response = await api.post("/consultas", data);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function obtenerConsultas() {
  try {
    const response = await api.get("/consultas");

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function obtenerConsultasByPropiedad(propiedadId) {
  try {
    const response = await api.get(`/consultas/propiedad/${propiedadId}`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function obtenerMensajesConsulta(consultaId) {
  try {
    const response = await api.get(`/consultas/${consultaId}/mensajes`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function enviarMensajeConsulta(consultaId, mensaje) {
  try {
    const response = await api.post(`/consultas/${consultaId}/mensajes`, {
      mensaje,
    });

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

// ============================================
// RESEÑAS
// ============================================

export async function crearResena(data) {
  try {
    const response = await api.post("/resenas", data);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function obtenerResenasByPropiedad(propiedadId) {
  try {
    const response = await api.get(`/resenas/propiedad/${propiedadId}`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function obtenerResenasByReserva(reservaId) {
  try {
    const response = await api.get(`/resenas/reserva/${reservaId}`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function obtenerResenasByUsuario(usuarioId) {
  try {
    const response = await api.get(`/resenas/usuario/${usuarioId}`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

// ============================================
// NOTIFICACIONES
// ============================================

export async function obtenerNotificaciones() {
  try {
    const response = await api.get("/notificaciones");

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function obtenerNotificacionesNoLeidas() {
  try {
    const response = await api.get("/notificaciones/no-leidas");

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function marcarNotificacionLeida(id) {
  try {
    const response = await api.put(`/notificaciones/${id}/leer`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function marcarTodasNotificacionesLeidas() {
  try {
    const response = await api.put("/notificaciones/leer-todas");

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

// ============================================
// ADMIN - CRUD GENÉRICO
// ============================================

export async function obtenerRecurso(ruta, params = {}) {
  try {
    const response = await api.get(ruta, { params });

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function crearRecurso(ruta, data) {
  try {
    const response = await api.post(ruta, data);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function actualizarRecurso(ruta, id, data) {
  try {
    const response = await api.put(`${ruta}/${id}`, data);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function eliminarRecurso(ruta, id) {
  try {
    const response = await api.delete(`${ruta}/${id}`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function restaurarRecurso(ruta, id) {
  try {
    const response = await api.post(`${ruta}/${id}/restaurar`);

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export async function obtenerLogsActividad() {
  try {
    const response = await api.get("/logs-actividad");

    return response.data;
  } catch (error) {
    return (
      error.response?.data || {
        success: false,
        message: "Error de conexión",
      }
    );
  }
}

export default api;
