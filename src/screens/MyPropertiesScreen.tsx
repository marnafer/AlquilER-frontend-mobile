import {
    useFocusEffect,
    useRouter,
} from 'expo-router';

import {
    useCallback,
    useRef,
    useState,
} from 'react';

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import PropertyCard from '../components/PropertyCard';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';
import { theme } from '../theme/theme';

import { abrirPropiedad } from '../services/propertyNavigation';

import axios from 'axios';
import type { ApiFailure, ApiResponse } from '../types/api';
import type { Property } from '../types/property';


type MyPropertiesData = {
  items: Property[];
  total: number;
};

type MyPropertiesResponse = ApiResponse<MyPropertiesData>;

export default function MyPropertiesScreen() {
    const router = useRouter();

    const [propiedades, setPropiedades] = useState<Property[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const cargaEnCursoRef = useRef(false);
    const ultimaCargaRef = useRef(0);
    const cargaEjecutadaEnFocoRef = useRef(false);

    const cargarPropiedades = useCallback(async () => {
        const ahora = Date.now();
        if (
            cargaEnCursoRef.current ||
            ahora - ultimaCargaRef.current < 1000
        ) {
            return;
        }

        cargaEnCursoRef.current = true;
        ultimaCargaRef.current = ahora;

        try {
            setLoading(true);
            setError('');

            const response = await api.get<MyPropertiesResponse>(
                '/propiedades/mis-propiedades'
            );

            if (!response.data.success) {
                setPropiedades([]);
                setError(
                    response.data.message ||
                    response.data.error ||
                    'No se pudieron cargar tus propiedades'
                );
                return;
            }

            setPropiedades(response.data.data.items);
        } catch (error) {
            const apiError = axios.isAxiosError<ApiFailure>(error)
                ? error.response?.data
                : undefined;

            console.error(
                'MY PROPERTIES: error al cargar propiedades',
                apiError ?? error
            );

            setPropiedades([]);
            setError(
                apiError?.error ||
                'No se pudieron cargar tus propiedades'
            );
        } finally {
            cargaEnCursoRef.current = false;
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (!cargaEjecutadaEnFocoRef.current) {
                cargaEjecutadaEnFocoRef.current = true;
                void cargarPropiedades();
            }

            return () => {
                cargaEjecutadaEnFocoRef.current = false;
            };
        }, [cargarPropiedades])
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Cargando tus propiedades...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <ScreenHeader
                title="Mis propiedades"
                subtitle="Administrá las propiedades que publicaste"   
            />

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                </View>
            ) : null}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Tus propiedades
                </Text>

                <Text style={styles.sectionDescription}>
                    {propiedades.length === 0
                        ? 'Todavía no publicaste ninguna propiedad.'
                        : `${propiedades.length} ${
                            propiedades.length === 1
                                ? 'propiedad publicada'
                                : 'propiedades publicadas'
                        }`}
                </Text>
            </View>

            {propiedades.length > 0 ? (
                <View style={styles.propertiesGrid}>
                    {propiedades.map((propiedad) => (
                        <PropertyCard
                            key={propiedad.id}
                            propiedad={propiedad}
                            onPress={() =>
                                abrirPropiedad(
                                    router,
                                    propiedad
                                )
                            }
                        />
                    ))}
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>
                        🏠
                    </Text>

                    <Text style={styles.emptyTitle}>
                        No tenés propiedades
                    </Text>

                    <Text style={styles.emptyText}>
                        Cuando publiques una propiedad,
                        aparecerá acá.
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:
            theme.colors.background,
    },

    content: {
        paddingBottom:
            theme.spacing.xl + 90,
    },

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
            theme.colors.background,
    },

    loadingText: {
        marginTop:
            theme.spacing.md,
        color:
            theme.colors.textMuted,
        fontSize: 14,
    },

    errorBox: {
        marginHorizontal:
            theme.spacing.md,
        marginTop:
            theme.spacing.md,
        padding:
            theme.spacing.md,
        borderRadius: 10,
        backgroundColor:
            theme.colors.errorBg,
    },

    errorText: {
        color:
            theme.colors.errorText,
        fontSize: 14,
        textAlign: 'center',
    },

    section: {
        marginTop:
            theme.spacing.lg,
        paddingHorizontal:
            theme.spacing.md,
    },

    sectionTitle: {
        color:
            theme.colors.textDark,
        fontSize: 22,
        fontWeight: '700',
    },

    sectionDescription: {
        marginTop: 4,
        color:
            theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 20,
    },

    propertiesGrid: {
        marginTop:
            theme.spacing.md,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal:
            theme.spacing.md,
        rowGap:
            theme.spacing.md,
    },

    emptyContainer: {
        marginHorizontal:
            theme.spacing.md,
        marginTop:
            theme.spacing.lg,
        paddingVertical:
            theme.spacing.xl,
        paddingHorizontal:
            theme.spacing.lg,
        borderRadius: 16,
        backgroundColor:
            theme.colors.inputBg,
        borderWidth: 1,
        borderColor:
            theme.colors.border,
        alignItems: 'center',
    },

    emptyIcon: {
        fontSize: 36,
        marginBottom:
            theme.spacing.sm,
    },

    emptyTitle: {
        color:
            theme.colors.textDark,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },

    emptyText: {
        marginTop:
            theme.spacing.sm,
        color:
            theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
});