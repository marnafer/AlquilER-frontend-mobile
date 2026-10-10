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

import ScreenHeader from '../components/ScreenHeader';
import {
    obtenerPerfil,
    obtenerResenasByUsuario,
} from '../services/api';
import { theme } from '../theme/theme';

const ACCESOS_RAPIDOS = [
    {
        title: 'Mi panel',
        subtitle: 'Ver el resumen de tu actividad',
        route: '/dashboard',
    },
    {
        title: 'Mis favoritos',
        subtitle: 'Consultar propiedades guardadas',
        route: '/favorites',
    },
    {
        title: 'Explorar propiedades',
        subtitle: 'Encontrar tu próximo alquiler',
        route: '/explore',
    },
    {
        title: 'Publicar propiedad',
        subtitle: 'Crear una nueva publicación',
        route: '/publicar-propiedad',
    },
] as const;

export default function ProfileScreen() {
    const router = useRouter();

    const [usuario, setUsuario] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cargandoResenas, setCargandoResenas] = useState(true);
    const [errorResenas, setErrorResenas] = useState('');
    const [resenasRecibidas, setResenasRecibidas] = useState<any[]>([]);
    const [promedioResenas, setPromedioResenas] = useState(0);
    const [totalResenas, setTotalResenas] = useState(0);

    const cargarPerfil = useCallback(async () => {
        setLoading(true);
        setError('');
        setCargandoResenas(true);
        setErrorResenas('');

        let perfil;

        try {
            const response = await obtenerPerfil();

            if (!response?.success || !response.data) {
                throw new Error(
                    response?.error ||
                    response?.message ||
                    'No se pudo cargar tu perfil'
                );
            }

            perfil = response.data;
            setUsuario(perfil);
        } catch (error) {
            console.error('PROFILE: error al cargar perfil:', error);
            setUsuario(null);
            setError(
                error instanceof Error
                    ? error.message
                    : 'No se pudo cargar tu perfil'
            );
            setResenasRecibidas([]);
            setPromedioResenas(0);
            setTotalResenas(0);
            setLoading(false);
            setCargandoResenas(false);
            return;
        }

        setLoading(false);

        try {
            const respuestaResenas = await obtenerResenasByUsuario(perfil.id);
            if (!respuestaResenas?.success) {
                throw new Error(
                    respuestaResenas?.error ||
                        respuestaResenas?.message ||
                        'No se pudieron cargar las reseñas.'
                );
            }

            const datos = respuestaResenas.data || {};
            const items = Array.isArray(datos.items) ? datos.items : [];

            setResenasRecibidas(items);
            setPromedioResenas(Number(datos.promedio) || 0);
            setTotalResenas(Number(datos.total) || items.length);
        } catch (error) {
            console.error('PROFILE: error al cargar reputación:', error);
            setErrorResenas(
                error instanceof Error
                    ? error.message
                    : 'No se pudieron cargar las reseñas.'
            );
            setResenasRecibidas([]);
            setPromedioResenas(0);
            setTotalResenas(0);
        } finally {
            setCargandoResenas(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            cargarPerfil();
        }, [cargarPerfil])
    );

    const renderEstrellas = (valor: number) => (
        <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((estrella) => (
                <Text
                    key={estrella}
                    style={[
                        styles.star,
                        estrella <= Math.round(valor)
                            ? styles.starFilled
                            : styles.starEmpty,
                    ]}
                >
                    ★
                </Text>
            ))}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Cargando perfil...
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
                title="Mi perfil"
                subtitle="Información personal"
            />

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                </View>
            ) : null}

            {usuario ? (
                <View style={styles.card}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {usuario.nombre
                                ?.charAt(0)
                                ?.toUpperCase() || '?'}
                        </Text>
                    </View>

                    <View style={styles.profileHeading}>
                        <Text style={styles.profileName}>
                            {usuario.nombre} {usuario.apellido}
                        </Text>
                        <Text style={styles.roleBadge}>
                            {usuario.rol?.nombre ||
                                usuario.rol?.valor ||
                                'Usuario'}
                        </Text>
                        {usuario.created_at ? (
                            <Text style={styles.memberSince}>
                                Miembro desde{' '}
                                {new Date(usuario.created_at).toLocaleDateString(
                                    'es-AR',
                                    { year: 'numeric', month: 'long' }
                                )}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.info}>
                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Nombre
                            </Text>

                            <Text style={styles.value}>
                                {usuario.nombre}
                            </Text>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Apellido
                            </Text>

                            <Text style={styles.value}>
                                {usuario.apellido}
                            </Text>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Email
                            </Text>

                            <Text style={styles.value}>
                                {usuario.email}
                            </Text>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Teléfono
                            </Text>

                            <Text style={styles.value}>
                                {usuario.telefono}
                            </Text>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Domicilio
                            </Text>

                            <Text style={styles.value}>
                                {usuario.domicilio}
                            </Text>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Rol
                            </Text>

                            <Text style={styles.value}>
                                {usuario.rol?.nombre}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() =>
                            router.push('/editar-perfil')
                        }
                        activeOpacity={0.85}
                    >
                        <Text style={styles.editButtonText}>
                            Editar perfil
                        </Text>
                    </TouchableOpacity>

                    {String(
                        usuario.rol?.nombre ||
                            usuario.rol?.valor
                    ).toLowerCase() === 'administrador' ||
                    String(usuario.rol?.id) === '1' ? (
                        <TouchableOpacity
                            style={[
                                styles.editButton,
                                styles.adminButton,
                            ]}
                            onPress={() =>
                                router.push('/admin')
                            }
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[
                                    styles.editButtonText,
                                    styles.adminButtonText,
                                ]}
                            >
                                Panel de administración
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : null}

            {usuario ? (
                <View style={styles.reputationCard}>
                    <Text style={styles.sectionTitle}>Mi reputación</Text>

                    {cargandoResenas ? (
                        <View style={styles.reviewsLoading}>
                            <ActivityIndicator
                                size="small"
                                color={theme.colors.primary}
                            />
                            <Text style={styles.secondaryText}>
                                Cargando reseñas...
                            </Text>
                        </View>
                    ) : errorResenas ? (
                        <Text style={styles.reviewsError}>
                            {errorResenas}
                        </Text>
                    ) : totalResenas === 0 ? (
                        <Text style={styles.emptyReviews}>
                            Todavía no recibiste reseñas.
                        </Text>
                    ) : (
                        <>
                            <View style={styles.ratingSummary}>
                                {renderEstrellas(promedioResenas)}
                                <Text style={styles.ratingValue}>
                                    {promedioResenas.toFixed(1)}
                                </Text>
                                <Text style={styles.secondaryText}>
                                    ({totalResenas}{' '}
                                    {totalResenas === 1 ? 'reseña' : 'reseñas'})
                                </Text>
                            </View>

                            <Text style={styles.latestReviewsTitle}>
                                Últimas reseñas recibidas
                            </Text>

                            {resenasRecibidas.slice(0, 3).map((resena) => (
                                <View
                                    key={resena.id}
                                    style={styles.review}
                                >
                                    <View style={styles.reviewHeader}>
                                        <View style={styles.reviewRating}>
                                            {renderEstrellas(
                                                Number(resena.calificacion) || 0
                                            )}
                                            <Text style={styles.reviewScore}>
                                                {resena.calificacion}/5
                                            </Text>
                                        </View>
                                        {resena.fecha_publicacion ? (
                                            <Text style={styles.reviewDate}>
                                                {String(
                                                    resena.fecha_publicacion
                                                ).slice(0, 10)}
                                            </Text>
                                        ) : null}
                                    </View>
                                    {resena.comentario ? (
                                        <Text style={styles.reviewComment}>
                                            {resena.comentario}
                                        </Text>
                                    ) : null}
                                </View>
                            ))}
                        </>
                    )}
                </View>
            ) : null}

            {usuario ? (
                <View style={styles.reputationCard}>
                    <Text style={styles.sectionTitle}>Accesos rápidos</Text>
                    {ACCESOS_RAPIDOS.map((acceso) => (
                        <TouchableOpacity
                            key={acceso.route}
                            style={styles.quickAction}
                            onPress={() => router.push(acceso.route)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.quickActionText}>
                                <Text style={styles.quickActionTitle}>
                                    {acceso.title}
                                </Text>
                                <Text style={styles.quickActionSubtitle}>
                                    {acceso.subtitle}
                                </Text>
                            </View>
                            <Text style={styles.quickActionArrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : null}
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

    card: {
        marginHorizontal:
            theme.spacing.md,
        marginTop:
            theme.spacing.lg,
        padding:
            theme.spacing.lg,
        borderRadius: 16,
        backgroundColor:
            theme.colors.inputBg,
        borderWidth: 1,
        borderColor:
            theme.colors.border,
    },

    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
            theme.colors.primary,
    },

    avatarText: {
        color: theme.colors.white,
        fontSize: 30,
        fontWeight: '700',
    },

    profileHeading: {
        alignItems: 'center',
        marginTop: theme.spacing.md,
    },

    profileName: {
        color: theme.colors.textDark,
        fontSize: 21,
        fontWeight: '700',
        textAlign: 'center',
    },

    roleBadge: {
        marginTop: theme.spacing.xs,
        overflow: 'hidden',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
        color: theme.colors.white,
        fontSize: 12,
        fontWeight: '700',
    },

    memberSince: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 13,
    },

    info: {
        marginTop:
            theme.spacing.lg,
    },

    field: {
        paddingVertical:
            theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor:
            theme.colors.border,
    },

    label: {
        marginBottom: 4,
        color:
            theme.colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },

    value: {
        color:
            theme.colors.textDark,
        fontSize: 16,
    },

    editButton: {
        minHeight: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop:
            theme.spacing.lg,
        borderRadius: 12,
        backgroundColor:
            theme.colors.primary,
    },

    editButtonText: {
        color: theme.colors.white,
        fontSize: 15,
        fontWeight: '700',
    },

    adminButton: {
        backgroundColor: theme.colors.textDark,
    },

    adminButtonText: {
        color: theme.colors.white,
    },

    reputationCard: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        padding: theme.spacing.lg,
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    sectionTitle: {
        marginBottom: theme.spacing.md,
        color: theme.colors.textDark,
        fontSize: 18,
        fontWeight: '700',
    },

    reviewsLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
    },

    secondaryText: {
        color: theme.colors.textMuted,
        fontSize: 13,
    },

    reviewsError: {
        color: theme.colors.errorText,
        fontSize: 14,
    },

    emptyReviews: {
        color: theme.colors.textMuted,
        fontSize: 14,
    },

    ratingSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },

    stars: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    star: {
        marginRight: 2,
        fontSize: 17,
    },

    starFilled: {
        color: '#f59e0b',
    },

    starEmpty: {
        color: '#cbd5e1',
    },

    ratingValue: {
        color: theme.colors.textDark,
        fontSize: 18,
        fontWeight: '700',
    },

    latestReviewsTitle: {
        marginBottom: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
    },

    review: {
        marginTop: theme.spacing.sm,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.background,
    },

    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
    },

    reviewRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },

    reviewScore: {
        color: theme.colors.textDark,
        fontSize: 12,
        fontWeight: '600',
    },

    reviewDate: {
        color: theme.colors.textMuted,
        fontSize: 12,
    },

    reviewComment: {
        color: theme.colors.textDark,
        fontSize: 14,
        lineHeight: 20,
    },

    quickAction: {
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },

    quickActionText: {
        flex: 1,
        paddingRight: theme.spacing.md,
    },

    quickActionTitle: {
        color: theme.colors.textDark,
        fontSize: 15,
        fontWeight: '700',
    },

    quickActionSubtitle: {
        marginTop: 3,
        color: theme.colors.textMuted,
        fontSize: 12,
    },

    quickActionArrow: {
        color: theme.colors.primary,
        fontSize: 26,
        fontWeight: '600',
    },
});