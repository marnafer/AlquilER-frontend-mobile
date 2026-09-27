import { usePathname, useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { theme } from '../theme/theme';

const opcionesAutenticado = [
  {
    ruta: '/home',
    icono: '⌂',
    etiqueta: 'Inicio',
  },
  {
    ruta: '/favorites',
    icono: '♡',
    etiqueta: 'Favoritos',
  },
  {
    ruta: '/notifications',
    icono: '♧',
    etiqueta: 'Notificaciones',
  },
  {
    ruta: '/account',
    icono: '♙',
    etiqueta: 'Cuenta',
  },
] as const;

const opcionesNoAutenticado = [
  {
    ruta: '/home',
    icono: '⌂',
    etiqueta: 'Inicio',
  },
  {
    ruta: '/register',
    icono: '♙',
    etiqueta: 'Registrate',
  },
  {
    ruta: '/login',
    icono: '→',
    etiqueta: 'Iniciar sesión',
  },
] as const;

export default function AppTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isAuthenticated, loading } = useAuth();
  const { setBottomNavigationHeight } = useLayout();

  if (loading) {
    return null;
  }

  const opciones = isAuthenticated
    ? opcionesAutenticado
    : opcionesNoAutenticado;

  const horizontalMargin = Math.max(12, Math.min(24, width * 0.04));

  const bottomSpacing = Math.max(12, insets.bottom + 8);

  return (
    <View
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;

          setBottomNavigationHeight(height + bottomSpacing);
        }}
        style={[
          styles.container,
          {
            left: horizontalMargin,
            right: horizontalMargin,
            bottom: bottomSpacing,
          },
        ]}
      >
      <View style={styles.bar}>
        {opciones.map((opcion) => {
          const activo = pathname === opcion.ruta;

          return (
            <TouchableOpacity
              key={opcion.ruta}
              style={styles.item}
              onPress={() => router.push(opcion.ruta)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.iconContainer,
                  activo && styles.iconContainerActivo,
                ]}
              >
                <Text
                  style={[
                    styles.icon,
                    activo && styles.iconActivo,
                  ]}
                >
                  {opcion.icono}
                </Text>
              </View>

              <Text
                style={[
                  styles.label,
                  activo && styles.labelActivo,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {opcion.etiqueta}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },

  bar: {
    minHeight: 68,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 6,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },

  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    minWidth: 0,
    paddingHorizontal: 2,
  },

  iconContainer: {
    width: 34,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  iconContainerActivo: {
    backgroundColor: theme.colors.primary,
  },

  icon: {
    color: theme.colors.textDark,
    fontSize: 22,
    lineHeight: 24,
  },

  iconActivo: {
    color: '#ffffff',
  },

  label: {
    color: theme.colors.textDark,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },

  labelActivo: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});