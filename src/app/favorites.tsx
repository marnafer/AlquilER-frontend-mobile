import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import PropertyCard from '../components/PropertyCard';
import ScreenHeader from '../components/ScreenHeader';
import { useLayout } from '../context/LayoutContext';
import { obtenerFavoritos } from '../services/api';
import { abrirPropiedad } from '../services/propertyNavigation';
import { theme } from '../theme/theme';

export default function FavoritesScreen() {
    const router = useRouter();
    const { bottomNavigationHeight } = useLayout();

    const [favoritos, setFavoritos] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarFavoritos = useCallback(async (esRefresh = false) => {
        try {
            if (esRefresh) {
                setRefrescando(true);
            } else {
                setCargando(true);
            }

            setError(null);

            const response = await obtenerFavoritos();

            if (!response?.success) {
                throw new Error(
                    response?.error ||
                        response?.message ||
                        'No se pudieron obtener los favoritos'
                );
            }

            setFavoritos(response.data || []);
        } catch (err: any) {
            setError(
                err?.message ||
                    'No se pudieron cargar los favoritos'
            );
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            cargarFavoritos();
        }, [cargarFavoritos])
    );

    const renderFavorito = ({ item }: { item: any }) => {
        const propiedad = item?.propiedad;

        if (!propiedad) {
            return null;
        }

        return (
            <PropertyCard
                propiedad={propiedad}
                onPress={() =>
                    abrirPropiedad(router, propiedad)
                }
            />
        );
    };

    if (cargando) {
        return (
            <View style={styles.center}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />
                <Text style={styles.loadingText}>
                    Cargando favoritos...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View
                style={[
                    styles.center,
                    {
                        paddingBottom:
                            bottomNavigationHeight,
                    },
                ]}
            >
                <Text style={styles.errorIcon}>⚠️</Text>

                <Text style={styles.errorTitle}>
                    No se pudieron cargar los favoritos
                </Text>

                <Text style={styles.errorText}>
                    {error}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
           <ScreenHeader
                title="Mis favoritos"
                subtitle={
                    favoritos.length === 0
                        ? 'Todavía no tienes propiedades favoritas'
                        : `${favoritos.length} ${
                            favoritos.length === 1
                                ? 'propiedad guardada'
                                : 'propiedades guardadas'
                        }`
                }
            />

            {favoritos.length === 0 ? (
                <View
                    style={[
                        styles.center,
                        {
                            paddingBottom:
                                bottomNavigationHeight,
                        },
                    ]}
                >
                    <Text style={styles.emptyIcon}>♡</Text>

                    <Text style={styles.emptyTitle}>
                        No tienes favoritos
                    </Text>

                    <Text style={styles.emptyText}>
                        Cuando encuentres una propiedad que te
                        guste, podrás guardarla aquí.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={favoritos}
                    keyExtractor={(item) =>
                        String(item.id)
                    }
                    renderItem={renderFavorito}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={[
                        styles.list,
                        {
                            paddingBottom:
                                bottomNavigationHeight + 20,
                        },
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refrescando}
                            onRefresh={() =>
                                cargarFavoritos(true)
                            }
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
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

    row: {
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
    },

    loadingText: {
        marginTop: theme.spacing.sm,
        fontSize: 15,
        color: theme.colors.textMuted,
    },

    emptyIcon: {
        fontSize: 64,
        color: theme.colors.textMuted,
    },

    emptyTitle: {
        marginTop: theme.spacing.md,
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.textMuted,
        textAlign: 'center',
    },

    emptyText: {
        marginTop: theme.spacing.sm,
        fontSize: 15,
        color: theme.colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
    },

    errorIcon: {
        fontSize: 48,
    },

    errorTitle: {
        marginTop: theme.spacing.sm,
        fontSize: 19,
        fontWeight: '700',
        color: theme.colors.errorText,
        textAlign: 'center',
    },

    errorText: {
        marginTop: theme.spacing.sm,
        fontSize: 14,
        color: theme.colors.textMuted,
        textAlign: 'center',
    },
});