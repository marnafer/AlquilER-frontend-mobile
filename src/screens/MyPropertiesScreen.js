import {
    useFocusEffect,
    useRouter,
} from 'expo-router';

import {
    useCallback,
    useState,
} from 'react';

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import PropertyCard from '../components/PropertyCard';
import ScreenHeader from '../components/ScreenHeader';
import api, {
    eliminarPropiedad,
} from '../services/api';
import { theme } from '../theme/theme';

import { abrirPropiedad } from '../services/propertyNavigation';

export default function MyPropertiesScreen() {
    const router = useRouter();

    const [propiedades, setPropiedades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [eliminandoId, setEliminandoId] = useState(null);
    const [mensaje, setMensaje] = useState('');

    const cargarPropiedades = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get(
                '/propiedades/mis-propiedades'
            );

            const propiedadesData =
                response.data?.data?.items ||
                response.data?.data ||
                [];

            setPropiedades(propiedadesData);
        } catch (error) {
            console.error(
                'MY PROPERTIES: error al cargar propiedades',
                error.response?.data
            );

            setPropiedades([]);

            setError(
                error.response?.data?.error ||
                'No se pudieron cargar tus propiedades'
            );
        } finally {
            setLoading(false);
        }
    };

    const manejarEliminar = async (propiedad) => {
        if (
            typeof window !== 'undefined' &&
            window.confirm &&
            !window.confirm(
                `¿Eliminar la propiedad "${propiedad.titulo}"? Esta acción se podrá revertir desde el administrador.`
            )
        ) {
            return;
        }

        setEliminandoId(propiedad.id);
        setMensaje('');

        const result = await eliminarPropiedad(propiedad.id);

        if (result.success) {
            setMensaje(
                result.message ||
                    'Propiedad eliminada correctamente'
            );

            setPropiedades((prev) =>
                prev.filter(
                    (p) => p.id !== propiedad.id
                )
            );
        } else {
            setMensaje(
                result.message ||
                    result.error ||
                    'No se pudo eliminar la propiedad'
            );
        }

        setEliminandoId(null);
    };

    useFocusEffect(
        useCallback(() => {
            cargarPropiedades();
        }, [])
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

            {mensaje ? (
                <View
                    style={[
                        styles.messageBox,
                        mensaje.toLowerCase().includes('eliminada') ||
                        mensaje.toLowerCase().includes('correctamente')
                            ? styles.messageExito
                            : styles.messageError,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            mensaje.toLowerCase().includes('eliminada') ||
                            mensaje.toLowerCase().includes('correctamente')
                                ? styles.messageTextExito
                                : styles.messageTextError,
                        ]}
                    >
                        {mensaje}
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
                        <View key={propiedad.id} style={styles.cardWrapper}>
                            <PropertyCard
                                propiedad={propiedad}
                                onPress={() =>
                                    abrirPropiedad(
                                        router,
                                        propiedad
                                    )
                                }
                            />

                            <View style={styles.cardActions}>
                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        styles.editButton,
                                    ]}
                                    onPress={() =>
                                        router.push(
                                            `/editar-propiedad/${propiedad.id}`
                                        )
                                    }
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={
                                            styles.editButtonText
                                        }
                                    >
                                        Editar
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        styles.deleteButton,
                                    ]}
                                    onPress={() =>
                                        manejarEliminar(
                                            propiedad
                                        )
                                    }
                                    disabled={
                                        eliminandoId ===
                                        propiedad.id
                                    }
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={
                                            styles.deleteButtonText
                                        }
                                    >
                                        {eliminandoId ===
                                        propiedad.id
                                            ? 'Eliminando...'
                                            : 'Eliminar'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
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

    messageBox: {
        marginHorizontal:
            theme.spacing.md,
        marginTop:
            theme.spacing.md,
        padding:
            theme.spacing.md,
        borderRadius: 10,
    },

    messageExito: {
        backgroundColor: '#dcfce7',
    },

    messageError: {
        backgroundColor:
            theme.colors.errorBg,
    },

    messageText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '600',
    },

    messageTextExito: {
        color: '#16a34a',
    },

    messageTextError: {
        color: theme.colors.errorText,
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

    cardWrapper: {
        width: '48%',
        marginBottom: theme.spacing.sm,
    },

    cardActions: {
        flexDirection: 'row',
        gap: theme.spacing.xs ?? 6,
        marginTop: theme.spacing.xs ?? 6,
    },

    actionButton: {
        flex: 1,
        minHeight: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    editButton: {
        backgroundColor:
            theme.colors.primary,
    },

    editButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
    },

    deleteButton: {
        borderWidth: 1,
        borderColor:
            theme.colors.errorText,
        backgroundColor:
            theme.colors.background,
    },

    deleteButtonText: {
        color: theme.colors.errorText,
        fontSize: 13,
        fontWeight: '700',
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