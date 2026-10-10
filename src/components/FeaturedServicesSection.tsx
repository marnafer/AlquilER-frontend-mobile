import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import ServiceIcon from './ServiceIcon';
import { obtenerServicios, Servicio } from '../utils/servicios';
import { theme } from '../theme/theme';

export default function FeaturedServicesSection() {
    const router = useRouter();
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const cargarServicios = useCallback(() => {
        obtenerServicios()
            .then((items) => {
                setServicios(items);
                setError('');
            })
            .catch((error) => {
                console.error(
                    'HOME: error al cargar servicios destacados',
                    error
                );
                setError('No se pudieron cargar los servicios.');
            })
            .finally(() => setCargando(false));
    }, []);

    const reintentar = useCallback(() => {
        setCargando(true);
        cargarServicios();
    }, [cargarServicios]);

    useEffect(() => {
        let activo = true;

        obtenerServicios()
            .then((items) => {
                if (activo) {
                    setServicios(items);
                }
            })
            .catch((error) => {
                console.error(
                    'HOME: error al cargar servicios destacados',
                    error
                );
                if (activo) {
                    setError('No se pudieron cargar los servicios.');
                }
            })
            .finally(() => {
                if (activo) {
                    setCargando(false);
                }
            });

        return () => {
            activo = false;
        };
    }, []);

    if (cargando) {
        return (
            <View style={styles.section}>
                <ActivityIndicator
                    color={theme.colors.primary}
                    accessibilityLabel="Cargando servicios"
                />
            </View>
        );
    }

    return (
        <View style={styles.section}>
            <Text style={styles.eyebrow}>SERVICIOS</Text>
            <Text style={styles.title}>Comodidades para tu alquiler</Text>
            <Text style={styles.description}>
                Conocé los servicios que ofrecen nuestras propiedades.
            </Text>

            {error ? (
                <View style={styles.messageBox}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        onPress={reintentar}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.retryText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : servicios.length === 0 ? (
                <Text style={styles.emptyText}>
                    Todavía no hay servicios cargados.
                </Text>
            ) : (
                <View style={styles.grid}>
                    {servicios.slice(0, 8).map((servicio) => (
                        <View key={servicio.id} style={styles.card}>
                            <ServiceIcon nombre={servicio.nombre} />
                            <Text
                                style={styles.serviceName}
                                numberOfLines={2}
                            >
                                {servicio.nombre}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {!error && servicios.length > 0 ? (
                <TouchableOpacity
                    style={styles.catalogButton}
                    onPress={() => router.push('/servicios')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.catalogButtonText}>
                        Ver todos los servicios
                    </Text>
                    <Text style={styles.catalogArrow}>›</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        padding: theme.spacing.md,
        borderRadius: 16,
        backgroundColor: theme.colors.primaryBg,
    },
    eyebrow: {
        marginBottom: 5,
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    title: {
        color: theme.colors.textDark,
        fontSize: 21,
        fontWeight: '700',
    },
    description: {
        marginTop: 5,
        marginBottom: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 13,
        lineHeight: 19,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    card: {
        width: '46%',
        minHeight: 90,
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        backgroundColor: theme.colors.white,
    },
    serviceName: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        color: theme.colors.textDark,
        fontSize: 12,
        fontWeight: '600',
    },
    emptyText: {
        color: theme.colors.textMuted,
        fontSize: 14,
    },
    messageBox: {
        gap: theme.spacing.sm,
    },
    errorText: {
        color: theme.colors.errorText,
        fontSize: 13,
    },
    retryText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    catalogButton: {
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
    },
    catalogButtonText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    catalogArrow: {
        marginLeft: 6,
        color: theme.colors.white,
        fontSize: 21,
    },
});
