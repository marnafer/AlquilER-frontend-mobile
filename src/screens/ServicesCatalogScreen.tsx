import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import ServiceIcon from '../components/ServiceIcon';
import { theme } from '../theme/theme';
import { obtenerServicios, Servicio } from '../utils/servicios';

export default function ServicesCatalogScreen() {
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
                console.error('SERVICIOS: error al cargar catálogo', error);
                setError(
                    'No pudimos cargar los servicios. Revisá tu conexión e intentá de nuevo.'
                );
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
                console.error('SERVICIOS: error al cargar catálogo', error);
                if (activo) {
                    setError(
                        'No pudimos cargar los servicios. Revisá tu conexión e intentá de nuevo.'
                    );
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

    const verPropiedades = (servicio: Servicio) => {
        router.push({
            pathname: '/propiedades',
            params: { servicio_id: String(servicio.id) },
        });
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <ScreenHeader
                title="Todos los servicios"
                subtitle="Conocé las comodidades disponibles en las propiedades."
                showBackButton
            />

            <View style={styles.body}>
                <Text style={styles.intro}>
                    Hay {servicios.length} servicios disponibles. Elegí uno para
                    encontrar propiedades que lo ofrecen.
                </Text>

                {cargando ? (
                    <View style={styles.stateContainer}>
                        <ActivityIndicator
                            size="large"
                            color={theme.colors.primary}
                        />
                        <Text style={styles.stateText}>
                            Cargando servicios...
                        </Text>
                    </View>
                ) : error ? (
                    <View style={styles.stateCard}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={reintentar}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.retryButtonText}>
                                Reintentar
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : servicios.length === 0 ? (
                    <View style={styles.stateCard}>
                        <Text style={styles.emptyIcon}>🔧</Text>
                        <Text style={styles.emptyTitle}>
                            Todavía no hay servicios cargados
                        </Text>
                        <Text style={styles.stateText}>
                            Los servicios son las comodidades que se pueden
                            indicar al publicar una propiedad.
                        </Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => router.push('/publicar-propiedad')}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.retryButtonText}>
                                Publicar una propiedad
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {servicios.map((servicio) => (
                            <View key={servicio.id} style={styles.serviceCard}>
                                <ServiceIcon nombre={servicio.nombre} />
                                <Text style={styles.serviceName}>
                                    {servicio.nombre}
                                </Text>
                                <TouchableOpacity
                                    style={styles.filterButton}
                                    onPress={() => verPropiedades(servicio)}
                                    activeOpacity={0.8}
                                    accessibilityLabel={`Ver propiedades con ${servicio.nombre}`}
                                >
                                    <Text style={styles.filterButtonText}>
                                        Ver propiedades
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        paddingBottom: 100,
    },
    body: {
        padding: theme.spacing.md,
    },
    intro: {
        marginBottom: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 21,
    },
    list: {
        gap: theme.spacing.sm,
    },
    serviceCard: {
        minHeight: 82,
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 14,
        backgroundColor: theme.colors.white,
    },
    serviceName: {
        flex: 1,
        marginHorizontal: theme.spacing.sm,
        color: theme.colors.textDark,
        fontSize: 14,
        fontWeight: '700',
    },
    filterButton: {
        minHeight: 40,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.sm,
        borderRadius: 10,
        backgroundColor: theme.colors.primaryBg,
    },
    filterButtonText: {
        color: theme.colors.primaryDark,
        fontSize: 12,
        fontWeight: '700',
    },
    stateContainer: {
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    stateCard: {
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 14,
        backgroundColor: theme.colors.white,
    },
    stateText: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    errorText: {
        color: theme.colors.errorText,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    emptyIcon: {
        fontSize: 32,
    },
    emptyTitle: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textDark,
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    retryButton: {
        minHeight: 42,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
    },
    retryButtonText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
});
