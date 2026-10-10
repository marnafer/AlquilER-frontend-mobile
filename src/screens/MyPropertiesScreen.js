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
    actualizarPropiedad,
} from '../services/api';
import { theme } from '../theme/theme';

import { abrirPropiedad } from '../services/propertyNavigation';

const esDisponible = (valor) =>
    valor === true ||
    valor === 1 ||
    valor === '1' ||
    valor === 'true';

export default function MyPropertiesScreen() {
    const router = useRouter();

    const [propiedades, setPropiedades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [eliminandoId, setEliminandoId] = useState(null);
    const [actualizandoId, setActualizandoId] = useState(null);
    const [serviciosExpandidos, setServiciosExpandidos] = useState({});
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

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
        setMensaje({ tipo: '', texto: '' });

        const result = await eliminarPropiedad(propiedad.id);

        if (result.success) {
            setMensaje({
                tipo: 'exito',
                texto: result.message || 'Propiedad eliminada correctamente',
            });

            setPropiedades((prev) =>
                prev.filter(
                    (p) => p.id !== propiedad.id
                )
            );
        } else {
            setMensaje({
                tipo: 'error',
                texto:
                    result.error ||
                    result.message ||
                    'No se pudo eliminar la propiedad',
            });
        }

        setEliminandoId(null);
    };

    const toggleDisponible = async (propiedad) => {
        const nuevoEstado = !esDisponible(propiedad.disponible);
        setActualizandoId(propiedad.id);
        setMensaje({ tipo: '', texto: '' });

        try {
            const result = await actualizarPropiedad(propiedad.id, {
                disponible: nuevoEstado ? 1 : 0,
            });

            if (!result?.success) {
                setMensaje({
                    tipo: 'error',
                    texto:
                        result?.error ||
                        result?.message ||
                        'No se pudo actualizar la disponibilidad.',
                });
                return;
            }

            setPropiedades((actuales) =>
                actuales.map((actual) =>
                    Number(actual.id) === Number(propiedad.id)
                        ? { ...actual, disponible: nuevoEstado ? 1 : 0 }
                        : actual
                )
            );
            setMensaje({
                tipo: 'exito',
                texto:
                    result.message ||
                    `La propiedad ahora está ${
                        nuevoEstado ? 'disponible' : 'no disponible'
                    }.`,
            });
        } catch (error) {
            console.error(
                'MY PROPERTIES: error al actualizar disponibilidad',
                error
            );
            setMensaje({
                tipo: 'error',
                texto:
                    error.response?.data?.error ||
                    'No se pudo actualizar la disponibilidad.',
            });
        } finally {
            setActualizandoId(null);
        }
    };

    const toggleServicios = (propiedadId) => {
        setServiciosExpandidos((actuales) => ({
            ...actuales,
            [propiedadId]: !actuales[propiedadId],
        }));
    };

    const obtenerServicios = (propiedad) =>
        (Array.isArray(propiedad.servicios) ? propiedad.servicios : [])
            .map((fila) => ({
                id: fila.id ?? fila.servicio_id ?? fila.servicio?.id,
                nombre: fila.nombre ?? fila.servicio?.nombre,
            }))
            .filter((servicio) => servicio.nombre);

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

            {mensaje.texto ? (
                <View
                    style={[
                        styles.messageBox,
                        mensaje.tipo === 'exito'
                            ? styles.messageExito
                            : styles.messageError,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            mensaje.tipo === 'exito'
                                ? styles.messageTextExito
                                : styles.messageTextError,
                        ]}
                    >
                        {mensaje.texto}
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
                        : `${propiedades.length} en total · ${
                              propiedades.filter((p) =>
                                  esDisponible(p.disponible)
                              ).length
                          } disponibles · ${
                              propiedades.filter(
                                  (p) => !esDisponible(p.disponible)
                              ).length
                          } no disponibles`}
                </Text>
            </View>

            {propiedades.length > 0 ? (
                <View style={styles.propertiesGrid}>
                    {propiedades.map((propiedad) => {
                        const servicios = obtenerServicios(propiedad);
                        const expandido = Boolean(
                            serviciosExpandidos[propiedad.id]
                        );
                        const serviciosVisibles = expandido
                            ? servicios
                            : servicios.slice(0, 4);
                        const disponibles = esDisponible(
                            propiedad.disponible
                        );

                        return (
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

                            <View
                                style={[
                                    styles.availabilityBadge,
                                    disponibles
                                        ? styles.availableBadge
                                        : styles.unavailableBadge,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.availabilityText,
                                        disponibles
                                            ? styles.availableText
                                            : styles.unavailableText,
                                    ]}
                                >
                                    {disponibles ? 'Disponible' : 'No disponible'}
                                </Text>
                            </View>

                            <View style={styles.servicesSection}>
                                <Text style={styles.servicesTitle}>
                                    Servicios
                                </Text>
                                {servicios.length > 0 ? (
                                    <>
                                        <View style={styles.servicesList}>
                                            {serviciosVisibles.map(
                                                (servicio, index) => (
                                                    <View
                                                        key={
                                                            servicio.id ??
                                                            `${servicio.nombre}-${index}`
                                                        }
                                                        style={styles.serviceBadge}
                                                    >
                                                        <Text
                                                            style={styles.serviceText}
                                                        >
                                                            {servicio.nombre}
                                                        </Text>
                                                    </View>
                                                )
                                            )}
                                        </View>
                                        {servicios.length > 4 ? (
                                            <TouchableOpacity
                                                onPress={() =>
                                                    toggleServicios(propiedad.id)
                                                }
                                                activeOpacity={0.8}
                                                accessibilityRole="button"
                                            >
                                                <Text style={styles.servicesToggle}>
                                                    {expandido
                                                        ? 'Ver menos'
                                                        : `+${servicios.length - 4} más`}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </>
                                ) : (
                                    <Text style={styles.noServices}>
                                        Sin servicios cargados
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    styles.availabilityButton,
                                    actualizandoId === propiedad.id &&
                                        styles.disabledButton,
                                ]}
                                onPress={() => toggleDisponible(propiedad)}
                                disabled={actualizandoId === propiedad.id}
                                activeOpacity={0.85}
                                accessibilityRole="button"
                                accessibilityLabel={
                                    disponibles
                                        ? 'Marcar como no disponible'
                                        : 'Marcar como disponible'
                                }
                            >
                                {actualizandoId === propiedad.id ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={theme.colors.primary}
                                    />
                                ) : (
                                    <Text style={styles.availabilityButtonText}>
                                        {disponibles
                                            ? 'Poner no disponible'
                                            : 'Poner disponible'}
                                    </Text>
                                )}
                            </TouchableOpacity>

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
                        );
                    })}
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
        backgroundColor: theme.colors.successBg,
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
        color: theme.colors.successText,
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

    availabilityBadge: {
        alignSelf: 'flex-start',
        marginTop: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: 999,
    },

    availableBadge: {
        backgroundColor: theme.colors.successBg,
    },

    unavailableBadge: {
        backgroundColor: theme.colors.neutralBg,
    },

    availabilityText: {
        fontSize: 11,
        fontWeight: '700',
    },

    availableText: {
        color: theme.colors.successText,
    },

    unavailableText: {
        color: theme.colors.neutralText,
    },

    servicesSection: {
        marginTop: theme.spacing.sm,
        gap: theme.spacing.xs,
    },

    servicesTitle: {
        color: theme.colors.textDark,
        fontSize: 12,
        fontWeight: '700',
    },

    servicesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },

    serviceBadge: {
        maxWidth: '100%',
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: theme.colors.neutralBg,
    },

    serviceText: {
        color: theme.colors.neutralText,
        fontSize: 10,
    },

    noServices: {
        color: theme.colors.textMuted,
        fontSize: 11,
    },

    servicesToggle: {
        color: theme.colors.primary,
        fontSize: 11,
        fontWeight: '700',
    },

    availabilityButton: {
        minHeight: 36,
        marginTop: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },

    availabilityButtonText: {
        color: theme.colors.textDark,
        fontSize: 12,
        fontWeight: '600',
    },

    disabledButton: {
        opacity: 0.6,
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
        color: theme.colors.white,
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