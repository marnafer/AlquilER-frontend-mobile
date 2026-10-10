import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import {
    obtenerConsultas,
    obtenerFavoritos,
    obtenerMisPropiedades,
    obtenerNotificaciones,
    obtenerPerfil,
    obtenerReservas,
    separarReservas,
} from '../services/api';
import { theme } from '../theme/theme';
import { extraerItems, soloDia } from '../utils/formato';

const extraerLista = (respuesta, nombre) => {
    if (respuesta?.success === false) {
        throw new Error(
            respuesta.error ||
                respuesta.message ||
                `No se pudieron cargar ${nombre}.`
        );
    }

    return extraerItems(respuesta);
};

const formatearEstado = (estado) => {
    const valor = String(estado || 'pendiente').toLowerCase();
    const etiquetas = {
        pendiente: 'Pendiente',
        confirmada: 'Confirmada',
        rechazada: 'Rechazada',
        cancelada: 'Cancelada',
        finalizada: 'Finalizada',
    };
    const estilos = {
        pendiente: styles.estadoPendiente,
        confirmada: styles.estadoConfirmada,
        rechazada: styles.estadoRechazada,
        cancelada: styles.estadoCancelada,
        finalizada: styles.estadoFinalizada,
    };

    return {
        etiqueta: etiquetas[valor] || valor,
        estilo: estilos[valor] || styles.estadoPendiente,
    };
};

export default function PersonalDashboardScreen() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [usuario, setUsuario] = useState(null);
    const [estadisticas, setEstadisticas] = useState({
        propiedades: 0,
        reservas: 0,
        favoritos: 0,
        consultas: 0,
    });
    const [reservasRecientes, setReservasRecientes] = useState([]);
    const [reservasPendientes, setReservasPendientes] = useState([]);
    const [notificaciones, setNotificaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const perfilResponse = await obtenerPerfil();

            if (perfilResponse?.success === false || !perfilResponse?.data) {
                throw new Error(
                    perfilResponse?.error ||
                        perfilResponse?.message ||
                        'No se pudo cargar tu perfil.'
                );
            }

            const perfil = perfilResponse.data;
            const esUsuario = Number(perfil.rol_id) === 1;
            const [
                propiedadesResponse,
                reservasResponse,
                favoritosResponse,
                consultasResponse,
                notificacionesResponse,
            ] = await Promise.all([
                obtenerMisPropiedades(),
                obtenerReservas(),
                obtenerFavoritos(),
                obtenerConsultas(),
                esUsuario ? obtenerNotificaciones() : Promise.resolve(null),
            ]);

            const propiedades = extraerLista(
                propiedadesResponse,
                'tus propiedades'
            );
            const favoritos = extraerLista(favoritosResponse, 'tus favoritos');
            const consultas = extraerLista(consultasResponse, 'tus consultas');

            if (reservasResponse?.success === false) {
                throw new Error(
                    reservasResponse.error ||
                        reservasResponse.message ||
                        'No se pudieron cargar tus reservas.'
                );
            }

            const reservas = separarReservas(reservasResponse);
            const pendientes = reservas.reservasDeMisPropiedades
                .filter(
                    (reserva) =>
                        String(reserva.usuario_id) !== String(perfil.id) &&
                        String(reserva.estado || '').toLowerCase() ===
                            'pendiente'
                )
                .slice(0, 4);

            let recientes = [...reservas.todas];
            recientes.sort((a, b) =>
                String(b.id || 0).localeCompare(
                    String(a.id || 0),
                    undefined,
                    { numeric: true }
                )
            );

            let avisos = [];
            if (esUsuario && notificacionesResponse) {
                avisos = extraerLista(
                    notificacionesResponse,
                    'tus notificaciones'
                ).slice(0, 4);
            }

            setUsuario(perfil);
            setEstadisticas({
                propiedades: propiedades.length,
                reservas: reservas.todas.length,
                favoritos: favoritos.length,
                consultas: consultas.length,
            });
            setReservasRecientes(recientes.slice(0, 4));
            setReservasPendientes(pendientes);
            setNotificaciones(avisos);
        } catch (cargaError) {
            console.error('PERSONAL DASHBOARD: error al cargar datos', cargaError);
            setError(
                cargaError.message ||
                    'No pudimos cargar tu panel. Probá de nuevo en unos momentos.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated) {
                cargarDatos();
            }
        }, [cargarDatos, isAuthenticated])
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Cargando tu panel...</Text>
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
                title="Mi panel"
                subtitle="Tu resumen de actividad en AlquilER"
            />

            {error ? (
                <View style={styles.errorCard}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        onPress={cargarDatos}
                        accessibilityRole="button"
                    >
                        <Text style={styles.retryText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <View style={styles.welcomeCard}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {usuario?.nombre?.charAt(0)?.toUpperCase() ||
                                    'U'}
                            </Text>
                        </View>
                        <View style={styles.welcomeContent}>
                            <Text style={styles.welcomeEyebrow}>
                                PANEL PERSONAL
                            </Text>
                            <Text style={styles.welcomeTitle}>
                                Hola, {usuario?.nombre || 'Usuario'}
                            </Text>
                            <Text style={styles.welcomeDescription}>
                                Gestioná tus propiedades, reservas y actividad.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <StatCard
                            icon="🏠"
                            label="Propiedades"
                            value={estadisticas.propiedades}
                            onPress={() => router.push('/my-properties')}
                        />
                        <StatCard
                            icon="📅"
                            label="Reservas"
                            value={estadisticas.reservas}
                            onPress={() => router.push('/reservas')}
                        />
                        <StatCard
                            icon="❤️"
                            label="Favoritos"
                            value={estadisticas.favoritos}
                            onPress={() => router.push('/favorites')}
                        />
                        <StatCard
                            icon="💬"
                            label="Consultas"
                            value={estadisticas.consultas}
                            onPress={() => router.push('/consultas')}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
                        <View style={styles.quickActions}>
                            <QuickAction
                                icon="＋"
                                title="Publicar propiedad"
                                description="Sumá un nuevo alquiler"
                                onPress={() =>
                                    router.push('/publicar-propiedad')
                                }
                                primary
                            />
                            <QuickAction
                                icon="🔎"
                                title="Explorar propiedades"
                                description="Encontrá tu próximo hogar"
                                onPress={() => router.push('/propiedades')}
                            />
                            <QuickAction
                                icon="👤"
                                title="Mi perfil"
                                description="Actualizá tus datos"
                                onPress={() => router.push('/profile')}
                            />
                            <QuickAction
                                icon="⚙️"
                                title="Mi información"
                                description="Cuenta y ayuda"
                                onPress={() => router.push('/my-information')}
                            />
                        </View>
                    </View>

                    <DashboardList
                        title="Últimas reservas"
                        items={reservasRecientes}
                        emptyText="No tenés reservas aún."
                        actionLabel="Ver todas"
                        onAction={() => router.push('/reservas')}
                        onEmptyAction={() => router.push('/propiedades')}
                        emptyActionLabel="Explorar propiedades"
                        renderItem={(reserva) => {
                            const estado = formatearEstado(reserva.estado);

                            return (
                                <View style={styles.listItem} key={reserva.id}>
                                    <View style={styles.listIcon}>
                                        <Text style={styles.listIconText}>
                                            🏠
                                        </Text>
                                    </View>
                                    <View style={styles.listContent}>
                                        <Text
                                            style={styles.listTitle}
                                            numberOfLines={1}
                                        >
                                            {reserva.propiedad?.titulo ||
                                                'Propiedad'}
                                        </Text>
                                        <Text style={styles.listDescription}>
                                            {soloDia(
                                                reserva.fecha_inicio_alquiler
                                            )}{' '}
                                            →{' '}
                                            {soloDia(
                                                reserva.fecha_fin_alquiler
                                            )}
                                        </Text>
                                    </View>
                                    <Text
                                        style={[styles.statusBadge, estado.estilo]}
                                    >
                                        {estado.etiqueta}
                                    </Text>
                                </View>
                            );
                        }}
                    />

                    {reservasPendientes.length > 0 ? (
                        <DashboardList
                            title="Reservas por aprobar"
                            items={reservasPendientes}
                            actionLabel="Gestionar"
                            onAction={() => router.push('/reservas')}
                            renderItem={(reserva) => (
                                <View style={styles.listItem} key={reserva.id}>
                                    <View
                                        style={[
                                            styles.listIcon,
                                            styles.warningIcon,
                                        ]}
                                    >
                                        <Text style={styles.listIconText}>
                                            ⏳
                                        </Text>
                                    </View>
                                    <View style={styles.listContent}>
                                        <Text
                                            style={styles.listTitle}
                                            numberOfLines={1}
                                        >
                                            {reserva.propiedad?.titulo ||
                                                'Propiedad'}
                                        </Text>
                                        <Text style={styles.listDescription}>
                                            {soloDia(
                                                reserva.fecha_inicio_alquiler
                                            )}{' '}
                                            →{' '}
                                            {soloDia(
                                                reserva.fecha_fin_alquiler
                                            )}
                                        </Text>
                                    </View>
                                    <Text
                                        style={[
                                            styles.statusBadge,
                                            styles.estadoPendiente,
                                        ]}
                                    >
                                        Por aprobar
                                    </Text>
                                </View>
                            )}
                        />
                    ) : null}

                    {Number(usuario?.rol_id) === 1 ? (
                        <DashboardList
                            title="Notificaciones recientes"
                            items={notificaciones}
                            emptyText="No tenés notificaciones."
                            actionLabel="Ver todas"
                            onAction={() => router.push('/notifications')}
                            onEmptyAction={() =>
                                router.push('/notifications')
                            }
                            emptyActionLabel="Ir a notificaciones"
                            renderItem={(notificacion) => (
                                <View
                                    style={styles.listItem}
                                    key={notificacion.id}
                                >
                                    <View
                                        style={[
                                            styles.listIcon,
                                            !notificacion.leida &&
                                                styles.notificationUnread,
                                        ]}
                                    >
                                        <Text style={styles.listIconText}>
                                            {ICONOS_NOTIFICACION[
                                                notificacion.tipo
                                            ] || '🔔'}
                                        </Text>
                                    </View>
                                    <View style={styles.listContent}>
                                        <Text
                                            style={styles.listTitle}
                                            numberOfLines={1}
                                        >
                                            {notificacion.titulo ||
                                                'Notificación'}
                                        </Text>
                                        <Text style={styles.listDescription}>
                                            {soloDia(
                                                notificacion.fecha_notificacion
                                            )}
                                        </Text>
                                    </View>
                                    {!notificacion.leida ? (
                                        <Text
                                            style={[
                                                styles.statusBadge,
                                                styles.notificationBadge,
                                            ]}
                                        >
                                            Nueva
                                        </Text>
                                    ) : null}
                                </View>
                            )}
                        />
                    ) : null}
                </>
            )}
        </ScrollView>
    );
}

const ICONOS_NOTIFICACION = {
    reserva_confirmada: '✅',
    reserva_rechazada: '❌',
    reserva_nueva: '📅',
    consulta_nueva: '💬',
    mensaje_nuevo: '✉️',
};

function StatCard({ icon, label, value, onPress }) {
    return (
        <TouchableOpacity
            style={styles.statCard}
            onPress={onPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${value}. Ver ${label.toLowerCase()}`}
        >
            <Text style={styles.statIcon}>{icon}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statAction}>Ver ›</Text>
        </TouchableOpacity>
    );
}

function QuickAction({
    icon,
    title,
    description,
    onPress,
    primary = false,
}) {
    return (
        <TouchableOpacity
            style={[styles.quickAction, primary && styles.quickActionPrimary]}
            onPress={onPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${title}. ${description}`}
        >
            <Text
                style={[
                    styles.quickActionIcon,
                    primary && styles.quickActionIconPrimary,
                ]}
            >
                {icon}
            </Text>
            <View style={styles.quickActionContent}>
                <Text
                    style={[
                        styles.quickActionTitle,
                        primary && styles.quickActionTitlePrimary,
                    ]}
                >
                    {title}
                </Text>
                <Text
                    style={[
                        styles.quickActionDescription,
                        primary && styles.quickActionDescriptionPrimary,
                    ]}
                >
                    {description}
                </Text>
            </View>
            <Text
                style={[
                    styles.quickActionArrow,
                    primary && styles.quickActionArrowPrimary,
                ]}
            >
                ›
            </Text>
        </TouchableOpacity>
    );
}

function DashboardList({
    title,
    items,
    emptyText,
    actionLabel,
    onAction,
    onEmptyAction,
    emptyActionLabel,
    renderItem,
}) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {items.length > 0 ? (
                    <TouchableOpacity
                        onPress={onAction}
                        accessibilityRole="button"
                    >
                        <Text style={styles.sectionAction}>{actionLabel} ›</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
            <View style={styles.listCard}>
                {items.length > 0 ? (
                    items.map(renderItem)
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>{emptyText}</Text>
                        {onEmptyAction && emptyActionLabel ? (
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={onEmptyAction}
                                accessibilityRole="button"
                            >
                                <Text style={styles.emptyButtonText}>
                                    {emptyActionLabel}
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        paddingBottom: theme.spacing.xl + 90,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },
    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 14,
    },
    errorCard: {
        margin: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 14,
        backgroundColor: theme.colors.errorBg,
        gap: theme.spacing.sm,
    },
    errorText: {
        color: theme.colors.errorText,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    retryText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    welcomeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
    },
    avatar: {
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.45)',
    },
    avatarText: {
        color: theme.colors.white,
        fontSize: 25,
        fontWeight: '700',
    },
    welcomeContent: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    welcomeEyebrow: {
        color: theme.colors.white,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        opacity: 0.85,
    },
    welcomeTitle: {
        marginTop: 3,
        color: theme.colors.white,
        fontSize: 20,
        fontWeight: '700',
    },
    welcomeDescription: {
        marginTop: 4,
        color: theme.colors.white,
        fontSize: 12,
        lineHeight: 17,
        opacity: 0.9,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    statCard: {
        width: '48%',
        minHeight: 132,
        padding: theme.spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.white,
    },
    statIcon: {
        fontSize: 20,
    },
    statValue: {
        marginTop: 7,
        color: theme.colors.textDark,
        fontSize: 25,
        fontWeight: '700',
    },
    statLabel: {
        marginTop: 1,
        color: theme.colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    statAction: {
        marginTop: 7,
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    section: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    sectionTitle: {
        color: theme.colors.textDark,
        fontSize: 18,
        fontWeight: '700',
    },
    sectionAction: {
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    quickActions: {
        gap: theme.spacing.sm,
    },
    quickAction: {
        minHeight: 70,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.white,
    },
    quickActionPrimary: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    quickActionIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        textAlign: 'center',
        textAlignVertical: 'center',
        backgroundColor: theme.colors.primaryBg,
        color: theme.colors.primary,
        fontSize: 19,
        lineHeight: 38,
    },
    quickActionIconPrimary: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        color: theme.colors.white,
    },
    quickActionContent: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    quickActionTitle: {
        color: theme.colors.textDark,
        fontSize: 14,
        fontWeight: '700',
    },
    quickActionTitlePrimary: {
        color: theme.colors.white,
    },
    quickActionDescription: {
        marginTop: 3,
        color: theme.colors.textMuted,
        fontSize: 12,
    },
    quickActionDescriptionPrimary: {
        color: theme.colors.white,
        opacity: 0.85,
    },
    quickActionArrow: {
        marginLeft: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 27,
        fontWeight: '300',
    },
    quickActionArrowPrimary: {
        color: theme.colors.white,
    },
    listCard: {
        overflow: 'hidden',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.white,
    },
    listItem: {
        minHeight: 70,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    listIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primaryBg,
    },
    listIconText: {
        fontSize: 17,
    },
    warningIcon: {
        backgroundColor: theme.colors.warningBg,
    },
    notificationUnread: {
        backgroundColor: theme.colors.infoBg,
    },
    listContent: {
        flex: 1,
        minWidth: 0,
        marginLeft: theme.spacing.sm,
    },
    listTitle: {
        color: theme.colors.textDark,
        fontSize: 13,
        fontWeight: '700',
    },
    listDescription: {
        marginTop: 4,
        color: theme.colors.textMuted,
        fontSize: 11,
    },
    statusBadge: {
        overflow: 'hidden',
        marginLeft: theme.spacing.xs,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 999,
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    estadoPendiente: {
        color: theme.colors.warningText,
        backgroundColor: theme.colors.warningBg,
    },
    estadoConfirmada: {
        color: theme.colors.successText,
        backgroundColor: theme.colors.successBg,
    },
    estadoRechazada: {
        color: theme.colors.errorText,
        backgroundColor: theme.colors.errorBg,
    },
    estadoCancelada: {
        color: theme.colors.neutralText,
        backgroundColor: theme.colors.neutralBorder,
    },
    estadoFinalizada: {
        color: theme.colors.finalizedText,
        backgroundColor: theme.colors.finalizedBg,
    },
    notificationBadge: {
        color: theme.colors.infoText,
        backgroundColor: theme.colors.infoBg,
    },
    emptyState: {
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    emptyText: {
        color: theme.colors.textMuted,
        fontSize: 13,
        textAlign: 'center',
    },
    emptyButton: {
        minHeight: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
    },
    emptyButtonText: {
        color: theme.colors.white,
        fontSize: 13,
        fontWeight: '700',
    },
});
