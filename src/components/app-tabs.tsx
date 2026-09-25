import { usePathname, useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { theme } from '../theme/theme';

const opciones = [
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

export default function AppTabs() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
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
    left: 16,
    right: 16,
    bottom: 22,
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
  },

  labelActivo: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});