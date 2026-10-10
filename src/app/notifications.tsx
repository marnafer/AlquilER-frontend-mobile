import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  obtenerNotificaciones,
} from "../services/api";

import ScreenHeader from "../components/ScreenHeader";
import { useLayout } from "../context/LayoutContext";
import { theme } from "../theme/theme";

// ============================================
// TIPOS
// ============================================

type Notificacion = {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  tipo: string;
  fecha_notificacion: string;
};

type RutasPorTipo = Record<string, string>;

// ============================================
// COMPONENTE
// ============================================

export default function NotificacionesScreen() {
  const router = useRouter();
  const { bottomNavigationHeight } = useLayout();

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState<number>(0);

  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const rutasPorTipo: RutasPorTipo = {
    reserva_nueva: "/reservas",
    reserva_confirmada: "/reservas",
    reserva_rechazada: "/reservas",
    consulta_nueva: "/consultas",
    mensaje_nuevo: "/consultas",
  };

  const handleNotificacionPress = async (notificacion: Notificacion) => {
    try {
      if (!notificacion.leida) {
        const response = await marcarNotificacionLeida(notificacion.id);

        if (response?.success) {
          setNotificaciones((actuales) =>
            actuales.map((actual) =>
              actual.id === notificacion.id
                ? { ...actual, leida: true }
                : actual,
            ),
          );

          setNoLeidas((actual) => Math.max(actual - 1, 0));
        }
      }

      const ruta = rutasPorTipo[notificacion.tipo];

      if (ruta) {
        router.push(ruta as never);
      }
    } catch (error) {
      console.error("NOTIFICACIONES: error al abrir notificación", error);
    }
  };

  const cargarNotificaciones = useCallback(async (esRefresh = false) => {
    try {
      if (esRefresh) {
        setRefrescando(true);
      } else {
        setCargando(true);
      }

      setError("");

      const response = await obtenerNotificaciones();

      if (!response?.success) {
        throw new Error(
          response?.error || response?.message || "No se pudieron obtener las notificaciones",
        );
      }

      const items: Notificacion[] = response.data?.items || [];
      const cantidadNoLeidas: number = response.data?.no_leidas || 0;

      setNotificaciones(items);
      setNoLeidas(cantidadNoLeidas);
    } catch (err: any) {
      console.error("NOTIFICACIONES: error al cargar", err);

      setNotificaciones([]);
      setNoLeidas(0);

      setError(err?.message || "No se pudieron cargar las notificaciones");
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarNotificaciones();
    }, [cargarNotificaciones]),
  );

  const marcarTodasComoLeidas = async () => {
    if (noLeidas === 0) {
      return;
    }

    try {
      const response = await marcarTodasNotificacionesLeidas();

      if (!response?.success) {
        throw new Error(
          response?.error || response?.message || "No se pudieron marcar las notificaciones",
        );
      }

      setNotificaciones((actuales) =>
        actuales.map((notificacion) => ({
          ...notificacion,
          leida: true,
        })),
      );

      setNoLeidas(0);
    } catch (err: any) {
      console.error("NOTIFICACIONES: error al marcar todas como leídas", err);

      setError(
        err?.message || "No se pudieron marcar las notificaciones como leídas",
      );
    }
  };

  const renderNotificacion = ({ item }: ListRenderItemInfo<Notificacion>) => {
    const leida = Boolean(item.leida);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.leida && styles.notificationCardUnread,
        ]}
        onPress={() => handleNotificacionPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.notificationIndicator}>
          {!leida ? <View style={styles.unreadDot} /> : null}
        </View>

        <View style={styles.notificationContent}>
          <Text
            style={[
              styles.notificationTitle,
              !leida && styles.notificationTitleUnread,
            ]}
          >
            {item.titulo}
          </Text>

          <Text style={styles.notificationMessage}>{item.mensaje}</Text>

          <Text style={styles.notificationDate}>
            {formatearFecha(item.fecha_notificacion)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />

        <Text style={styles.loadingText}>Cargando notificaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notificaciones"
        subtitle={
          noLeidas === 0
            ? "No tenés notificaciones pendientes"
            : `${noLeidas} ${
                noLeidas === 1
                  ? "notificación sin leer"
                  : "notificaciones sin leer"
              }`
        }
        showBackButton
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>⚠️</Text>

          <Text style={styles.errorTitle}>Ocurrió un problema</Text>

          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {notificaciones.length > 0 ? (
        <FlatList
          data={notificaciones}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotificacion}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomNavigationHeight + 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => cargarNotificaciones(true)}
            />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            noLeidas > 0 ? (
              <TouchableOpacity
                style={styles.markAllButton}
                activeOpacity={0.8}
                onPress={marcarTodasComoLeidas}
              >
                <Text style={styles.markAllText}>Marcar todas como leídas</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      ) : (
        <View
          style={[styles.center, { paddingBottom: bottomNavigationHeight }]}
        >
          <Text style={styles.emptyIcon}>🔔</Text>

          <Text style={styles.emptyTitle}>No tenés notificaciones</Text>

          <Text style={styles.emptyText}>
            Cuando haya novedades sobre tus reservas, consultas o propiedades,
            aparecerán acá.
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================
// HELPERS
// ============================================

function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) {
    return "";
  }

  const fechaObj = new Date(fecha);

  if (Number.isNaN(fechaObj.getTime())) {
    return "";
  }

  return fechaObj.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  list: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },

  markAllButton: {
    alignSelf: "flex-end",
    marginBottom: theme.spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
  },

  markAllText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  notificationCard: {
    flexDirection: "row",
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  notificationCardUnread: {
    backgroundColor: theme.colors.primaryBg,
    borderColor: theme.colors.primary,
  },

  notificationIndicator: {
    width: 10,
    marginRight: theme.spacing.sm,
    alignItems: "center",
  },

  unreadDot: {
    width: 8,
    height: 8,
    marginTop: 5,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },

  notificationContent: {
    flex: 1,
  },

  notificationTitle: {
    color: theme.colors.textDark,
    fontSize: 16,
    fontWeight: "600",
  },

  notificationTitleUnread: {
    fontWeight: "700",
  },

  notificationMessage: {
    marginTop: 5,
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },

  notificationDate: {
    marginTop: 8,
    color: theme.colors.textMuted,
    fontSize: 12,
  },

  errorBox: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.errorBg,
    alignItems: "center",
  },

  errorIcon: {
    fontSize: 30,
  },

  errorTitle: {
    marginTop: 4,
    color: theme.colors.errorText,
    fontSize: 16,
    fontWeight: "700",
  },

  errorText: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },

  loadingText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontSize: 15,
  },

  emptyIcon: {
    fontSize: 56,
  },

  emptyTitle: {
    marginTop: theme.spacing.md,
    color: theme.colors.textDark,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
