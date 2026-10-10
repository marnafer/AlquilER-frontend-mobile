import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';


import { useLayout } from '@/context/LayoutContext';
import { theme } from '@/theme/theme';
import api, {
    agregarFavorito,
    eliminarFavorito,
    estaAutenticado,
    obtenerFavoritos,
    obtenerPerfil,
    obtenerResenasByPropiedad,
} from '../../services/api';
import { extraerItems } from '../../utils/formato';

interface Servicio {
    id: number;
    nombre: string;
}

interface Categoria {
    id: number;
    nombre: string;
}

interface Localidad {
    id: number;
    nombre: string;
    codigo_postal: string;
    provincia_id: number;
}

interface Imagen {
    id: number;
    ruta: string;
    es_principal: boolean;
}

interface Calificador {
    id: number;
    nombre: string;
    apellido: string;
}

interface Resena {
    id: number;
    calificacion: number;
    comentario: string;
    fecha_publicacion: string;
    calificador_id: number;
    calificador: Calificador;
    reserva_id: number;
}

interface Usuario {
    id: number;
    nombre: string;
    apellido: string;
}

interface Propiedad {
    id: number;
    titulo: string;
    descripcion: string;
    precio: number;
    expensas: number;
    direccion: string;
    cantidad_ambientes: number;
    cantidad_dormitorios: number;
    cantidad_banos: number;
    capacidad: number | null;
    acepta_mascotas: boolean | number | string;
    acepta_hijos: boolean | number | string;
    disponible: boolean;
    destacada: boolean;
    categoria_id: number;
    usuario_id: number;
    localidad_id: number;
    imagen_url: string | null;
    categoria: Categoria;
    localidad: Localidad;
    servicios: Servicio[];
    imagenes: Imagen[];
    imagen_principal: Imagen | null;
}

const Divisor = () => <View style={styles.divider} />;

const esAceptado = (valor: boolean | number | string) =>
    valor === true ||
    valor === 1 ||
    valor === '1' ||
    valor === 'true';

export default function PropiedadDetailScreen() {
    const { id } =
        useLocalSearchParams<{ id: string }>();

    const router = useRouter();

    const { bottomNavigationHeight } = useLayout();

    const { width } = useWindowDimensions();

    const [imagenActual, setImagenActual] =
        useState(0);

    const [propiedad, setPropiedad] =
        useState<Propiedad | null>(null);

    const [cargando, setCargando] =
        useState(true);

    const [error, setError] =
        useState('');

    const [mensajeFavorito, setMensajeFavorito] = useState('');

    const [resenas, setResenas] = useState<Resena[]>([]);
    const [promedioResenas, setPromedioResenas] = useState(0);
    const [cargandoResenas, setCargandoResenas] = useState(false);
    const [perfil, setPerfil] = useState<Usuario | null>(null);

    const [escalaFavorito] = useState(
        () => new Animated.Value(1)
    );

    const [esFavorito, setEsFavorito] = useState(false);
    const [actualizandoFavorito, setActualizandoFavorito] =
    useState(false);

    const propiedadId = propiedad?.id;

    const construirUrlImagen = (
        ruta: string | null
    ) => {
        if (!ruta) {
            return null;
        }

        const baseUrl =
            (api.defaults.baseURL ?? '').replace(
                /\/api\/?$/,
                ''
            );

        return `${baseUrl}${
            ruta.startsWith('/')
                ? ruta
                : `/${ruta}`
        }`;
    };

    const animarFavorito = () => {
        Animated.sequence([
            Animated.timing(escalaFavorito, {
                toValue: 1.25,
                duration: 120,
                useNativeDriver: true,
            }),
            Animated.spring(escalaFavorito, {
                toValue: 1,
                friction: 4,
                tension: 120,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const toggleFavorito = async () => {
    if (!propiedad?.id || actualizandoFavorito) return;

    const autenticado = await estaAutenticado();

    if (!autenticado) {
        setMensajeFavorito(
            'Iniciá sesión para agregar favoritos'
        );

        setTimeout(() => setMensajeFavorito(''), 2200);

        return;
    }

    const nuevoEstado = !esFavorito;

    // Cambio visual inmediato
    setEsFavorito(nuevoEstado);
    setActualizandoFavorito(true);
    setMensajeFavorito(
        nuevoEstado
            ? '♥ Agregada a favoritos'
            : '♡ Eliminada de favoritos'
    );

    animarFavorito();

    try {
        const response = nuevoEstado
            ? await agregarFavorito(propiedad.id)
            : await eliminarFavorito(propiedad.id);

        if (!response?.success) {
            // Si el backend rechaza la operación,
            // volvemos al estado anterior.
            setEsFavorito(!nuevoEstado);

            setMensajeFavorito(
                response?.error ||
                response?.message ||
                'No se pudo actualizar el favorito'
            );

            return;
        }

        // El mensaje ya está visible desde el comienzo.
        setTimeout(() => {
            setMensajeFavorito('');
        }, 2200);
    } catch (error) {
        console.error(
            'FAVORITO - error:',
            error
        );

        setEsFavorito(!nuevoEstado);

        setMensajeFavorito(
            'No se pudo actualizar el favorito'
        );
    } finally {
        setActualizandoFavorito(false);
    }
};

    useEffect(() => {
        if (!propiedadId) return;

        let activo = true;

        const cargarEstadoFavorito = async () => {
            try {
                const autenticado = await estaAutenticado();

                if (!activo) return;

                if (!autenticado) {
                    setEsFavorito(false);
                    return;
                }

                const response = await obtenerFavoritos();

                if (!activo || !response?.success) return;

                const favorito = (response.data || []).some(
                    (item: any) =>
                        Number(item.propiedad_id) === Number(propiedadId)
                );

                setEsFavorito(favorito);
            } catch (error) {
                console.error(
                    '❌ ERROR CARGANDO FAVORITOS:',
                    error
                );
            }
        };

        cargarEstadoFavorito();

        return () => {
            activo = false;
        };
    }, [propiedadId]);


    useEffect(() => {
        const cargarPropiedad = async () => {
            if (!id) {
                setError(
                    'No se indicó una propiedad.'
                );

                setCargando(false);

                return;
            }

            try {
                setCargando(true);
                setError('');

                const response = await api.get(
                    `/propiedades/${id}`
                );

                setPropiedad(
                    response.data.data
                );
            } catch (error) {
                console.error(
                    '❌ ERROR CARGANDO PROPIEDAD:',
                    error
                );

                setError(
                    'No se pudo cargar la información de la propiedad.'
                );
            } finally {
                setCargando(false);
            }
        };

        cargarPropiedad();
    }, [id]);

    useEffect(() => {
        const cargarResenas = async () => {
            if (!id) return;

            setCargandoResenas(true);

            const res = await obtenerResenasByPropiedad(id);

            if (res?.success) {
                setResenas(extraerItems(res) as Resena[]);

                setPromedioResenas(
                    Number(res.data?.promedio) || 0
                );
            }

            setCargandoResenas(false);
        };

        const cargarPerfil = async () => {
            const autenticado = await estaAutenticado();

            if (!autenticado) return;

            const res = await obtenerPerfil();

            if (res?.success && res.data?.id) {
                setPerfil(res.data as Usuario);
            }
        };

        cargarResenas();
        cargarPerfil();
    }, [id]);

    const esDuenio =
        !!perfil &&
        !!propiedad &&
        Number(perfil.id) === Number(propiedad.usuario_id);

    const miResena =
        (perfil &&
            resenas.find(
                (r) =>
                    String(r.calificador_id) ===
                    String(perfil.id)
            )) ||
        null;

    const irAReservar = async () => {
        const autenticado = await estaAutenticado();

        if (!autenticado) {
            router.push('/login');
            return;
        }

        if (esDuenio || !propiedad) return;

        router.push(`/reservas/nueva/${propiedad.id}`);
    };

    const irAConsultar = async () => {
        const autenticado = await estaAutenticado();

        if (!autenticado) {
            router.push('/login');
            return;
        }

        if (esDuenio || !propiedad) return;

        router.push(`/consultas/nueva/${propiedad.id}`);
    };

    if (cargando) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Cargando propiedad...
                </Text>
            </View>
        );
    }

    if (error || !propiedad) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>
                    {error ||
                        'Propiedad no encontrada.'}
                </Text>
            </View>
        );
    }

    const imagenes =
        propiedad.imagenes ?? [];

    const imagenesOrdenadas = [
        ...imagenes.filter(
            (imagen) => imagen.es_principal
        ),
        ...imagenes.filter(
            (imagen) => !imagen.es_principal
        ),
    ];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.content,
                {
                    paddingBottom:
                        bottomNavigationHeight +
                        theme.spacing.lg,
                },
            ]}
            showsVerticalScrollIndicator={false}
        >
            {/* IMÁGENES */}
            <View style={styles.carouselContainer}>
                {imagenesOrdenadas.length > 0 ? (
                    <>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={
                                false
                            }
                            onMomentumScrollEnd={(
                                event
                            ) => {
                                const indice =
                                    Math.round(
                                        event
                                            .nativeEvent
                                            .contentOffset
                                            .x /
                                            width
                                    );

                                setImagenActual(
                                    indice
                                );
                            }}
                        >
                            {imagenesOrdenadas.map(
                                (imagen) => {
                                    const imagenUrl =
                                        construirUrlImagen(
                                            imagen.ruta
                                        );

                                    return (
                                        <View
                                            key={
                                                imagen.id
                                            }
                                            style={[
                                                styles.carouselImageContainer,
                                                {
                                                    width,
                                                },
                                            ]}
                                        >
                                            {imagenUrl ? (
                                                <Image
                                                    source={{
                                                        uri: imagenUrl,
                                                    }}
                                                    style={
                                                        styles.carouselImage
                                                    }
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View
                                                    style={
                                                        styles.imagePlaceholder
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.imagePlaceholderText
                                                        }
                                                    >
                                                        🏠
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    );
                                }
                            )}
                        </ScrollView>

                        {imagenesOrdenadas.length >
                            1 && (
                            <View
                                style={
                                    styles.indicators
                                }
                            >
                                {imagenesOrdenadas.map(
                                    (
                                        imagen,
                                        index
                                    ) => (
                                        <View
                                            key={
                                                imagen.id
                                            }
                                            style={[
                                                styles.indicator,
                                                index ===
                                                    imagenActual &&
                                                    styles.indicatorActivo,
                                            ]}
                                        />
                                    )
                                )}
                            </View>
                        )}
                    </>
                ) : (
                    <View
                        style={
                            styles.imagePlaceholder
                        }
                    >
                        <Text
                            style={
                                styles.imagePlaceholderText
                            }
                        >
                            🏠
                        </Text>

                        <Text
                            style={
                                styles.imagePlaceholderLabel
                            }
                        >
                            Sin imágenes
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={toggleFavorito}
                    disabled={actualizandoFavorito}
                    activeOpacity={0.8}
                >
                    <Animated.Text
                        style={[
                            styles.favoriteIcon,
                            {
                                transform: [
                                    {
                                        scale: escalaFavorito,
                                    },
                                ],
                            },
                        ]}
                    >
                        {esFavorito ? '♥' : '♡'}
                    </Animated.Text>
                </TouchableOpacity>

                {mensajeFavorito !== '' && (
                    <View style={styles.favoriteToast}>
                        <Text style={styles.favoriteToastText}>
                            {mensajeFavorito}
                        </Text>
                    </View>
                )}
            </View>

            {/* INFORMACIÓN PRINCIPAL */}
            <View style={styles.header}>
                <Text style={styles.title}>
                    {propiedad.titulo}
                </Text>

                <Text style={styles.category}>
                    {propiedad.categoria.nombre} ·{' '}
                    {propiedad.localidad.nombre}
                </Text>

                <Text style={styles.price}>
                    $
                    {propiedad.precio.toLocaleString(
                        'es-AR'
                    )}
                </Text>

                {propiedad.expensas > 0 && (
                    <Text
                        style={styles.expenses}
                    >
                        Expensas: $
                        {propiedad.expensas.toLocaleString(
                            'es-AR'
                        )}
                    </Text>
                )}

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.actionPrimary,
                            (!propiedad.disponible ||
                                esDuenio) &&
                                styles.actionDisabled,
                        ]}
                        onPress={irAReservar}
                        disabled={
                            !propiedad.disponible || esDuenio
                        }
                        activeOpacity={0.85}
                    >
                        <Text style={styles.actionPrimaryText}>
                            {esDuenio
                                ? 'Es tu propiedad'
                                : propiedad.disponible
                                ? 'Reservar ahora'
                                : 'No disponible'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.actionSecondary,
                            esDuenio && styles.actionDisabled,
                        ]}
                        onPress={irAConsultar}
                        disabled={esDuenio}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.actionSecondaryText}>
                            {esDuenio
                                ? 'Es tu propiedad'
                                : 'Consultar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Divisor />

            {/* CARACTERÍSTICAS */}
            <View style={styles.section}>
                <Text
                    style={styles.sectionTitle}
                >
                    Características
                </Text>

                <View style={styles.features}>
                    <Text style={styles.feature}>
                        {
                            propiedad.cantidad_ambientes
                        }{' '}
                        ambientes
                    </Text>

                    <Text style={styles.feature}>
                        {
                            propiedad.cantidad_dormitorios
                        }{' '}
                        dormitorios
                    </Text>

                    <Text style={styles.feature}>
                        {propiedad.cantidad_banos}{' '}
                        baños
                    </Text>

                    {propiedad.capacidad !==
                        null && (
                        <Text
                            style={styles.feature}
                        >
                            Capacidad:{' '}
                            {
                                propiedad.capacidad
                            }
                        </Text>
                    )}
                </View>

                <View style={styles.policies}>
                    <View
                        style={[
                            styles.policyBadge,
                            esAceptado(propiedad.acepta_mascotas)
                                ? styles.policyAccepted
                                : styles.policyRejected,
                        ]}
                    >
                        <Text
                            style={[
                                styles.policyText,
                                esAceptado(propiedad.acepta_mascotas)
                                    ? styles.policyTextAccepted
                                    : styles.policyTextRejected,
                            ]}
                        >
                            {esAceptado(propiedad.acepta_mascotas)
                                ? 'Se aceptan mascotas'
                                : 'No se aceptan mascotas'}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.policyBadge,
                            esAceptado(propiedad.acepta_hijos)
                                ? styles.policyAccepted
                                : styles.policyRejected,
                        ]}
                    >
                        <Text
                            style={[
                                styles.policyText,
                                esAceptado(propiedad.acepta_hijos)
                                    ? styles.policyTextAccepted
                                    : styles.policyTextRejected,
                            ]}
                        >
                            {esAceptado(propiedad.acepta_hijos)
                                ? 'Se aceptan niños'
                                : 'No se aceptan niños'}
                        </Text>
                    </View>
                </View>
            </View>

            <Divisor />

            {/* UBICACIÓN */}
            <View style={styles.section}>
                <Text
                    style={styles.sectionTitle}
                >
                    Ubicación
                </Text>

                <Text style={styles.text}>
                    {propiedad.direccion}
                </Text>

                <Text style={styles.text}>
                    {propiedad.localidad.nombre}
                </Text>

                <Text
                    style={styles.textMuted}
                >
                    Código postal:{' '}
                    {
                        propiedad.localidad
                            .codigo_postal
                    }
                </Text>
            </View>

            <Divisor />

            {/* DESCRIPCIÓN */}
            <View style={styles.section}>
                <Text
                    style={styles.sectionTitle}
                >
                    Descripción
                </Text>

                <Text style={styles.text}>
                    {propiedad.descripcion}
                </Text>
            </View>

            <Divisor />

            {/* SERVICIOS */}
            <View style={styles.section}>
                <Text
                    style={styles.sectionTitle}
                >
                    Servicios
                </Text>

                {propiedad.servicios.length >
                0 ? (
                    propiedad.servicios.map(
                        (servicio) => (
                            <Text
                                key={
                                    servicio.id
                                }
                                style={
                                    styles.service
                                }
                            >
                                •{' '}
                                {
                                    servicio.nombre
                                }
                            </Text>
                        )
                    )
                ) : (
                    <Text
                        style={
                            styles.textMuted
                        }
                    >
                        No se especificaron
                        servicios.
                    </Text>
                )}
            </View>

            <Divisor />

            {/* DISPONIBILIDAD */}
            <View style={styles.section}>
                <Text
                    style={styles.sectionTitle}
                >
                    Disponibilidad
                </Text>

                <Text
                    style={[
                        styles.availability,
                        propiedad.disponible
                            ? styles.available
                            : styles.unavailable,
                    ]}
                >
                    {propiedad.disponible
                        ? 'Disponible'
                        : 'No disponible'}
                </Text>
            </View>

            <Divisor />

            {/* RESEÑAS */}
            <View style={styles.section}>
                <View style={styles.resenaHeader}>
                    <Text
                        style={styles.sectionTitle}
                    >
                        Reseñas
                    </Text>

                    {resenas.length > 0 ? (
                        <View style={styles.resenaPromedio}>
                            <Text style={styles.resenaPromedioNum}>
                                {promedioResenas.toFixed(1)}
                            </Text>

                            <Text style={styles.resenaPromedioEstrellas}>
                                {'★'.repeat(
                                    Math.round(promedioResenas)
                                )}
                                {'☆'.repeat(
                                    5 - Math.round(promedioResenas)
                                )}
                            </Text>

                            <Text style={styles.resenaPromedioTotal}>
                                {resenas.length}{' '}
                                {resenas.length === 1
                                    ? 'reseña'
                                    : 'reseñas'}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {cargandoResenas ? (
                    <ActivityIndicator
                        color={theme.colors.primary}
                        style={{ marginVertical: theme.spacing.md }}
                    />
                ) : resenas.length > 0 ? (
                    <View style={styles.resenaLista}>
                        {resenas.map((r) => (
                            <View
                                key={r.id}
                                style={styles.resenaItem}
                            >
                                <View style={styles.resenaItemTop}>
                                    <Text style={styles.resenaAutor}>
                                        {r.calificador
                                            ? `${r.calificador.nombre} ${r.calificador.apellido || ''}`.trim()
                                            : `Usuario #${r.calificador_id}`}
                                    </Text>

                                    <Text style={styles.resenaEstrellas}>
                                        {'★'.repeat(
                                            Math.max(
                                                0,
                                                Math.min(
                                                    5,
                                                    Number(r.calificacion)
                                                )
                                            )
                                        )}{'☆'.repeat(
                                            Math.max(
                                                0,
                                                5 -
                                                    Math.min(
                                                        5,
                                                        Number(
                                                            r.calificacion
                                                        )
                                                    )
                                            )
                                        )}
                                    </Text>
                                </View>

                                {miResena &&
                                String(r.id) ===
                                    String(miResena.id) ? (
                                    <Text style={styles.resenaMiaBadge}>
                                        ★ Tu reseña
                                    </Text>
                                ) : null}

                                {r.fecha_publicacion ? (
                                    <Text style={styles.resenaFecha}>
                                        {String(
                                            r.fecha_publicacion
                                        ).slice(0, 10)}
                                    </Text>
                                ) : null}

                                {r.comentario ? (
                                    <Text style={styles.resenaComentario}>
                                        {r.comentario}
                                    </Text>
                                ) : null}
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.textMuted}>
                        Todavía no hay reseñas para esta
                        propiedad.
                    </Text>
                )}
            </View>
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
        paddingBottom: 0,
    },

    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor:
            theme.colors.background,
    },

    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.textDark,
        fontSize: 15,
    },

    errorText: {
        color: theme.colors.textDark,
        fontSize: 16,
        textAlign: 'center',
    },

    header: {
        padding: theme.spacing.lg,
    },

    title: {
        fontSize: 26,
        fontWeight: '700',
        color: theme.colors.textDark,
    },

    category: {
        marginTop: 6,
        fontSize: 15,
        color: theme.colors.textMuted,
    },

    price: {
        marginTop: theme.spacing.md,
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.primary,
    },

    expenses: {
        marginTop: 4,
        fontSize: 14,
        color: theme.colors.textMuted,
    },

    divider: {
        height: 1,
        marginVertical: theme.spacing.sm,
        backgroundColor:
            theme.colors.border,
    },

    section: {
        marginHorizontal:
            theme.spacing.lg,
    },

    sectionTitle: {
        marginBottom:
            theme.spacing.sm,
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.textDark,
    },

    features: {
        gap: theme.spacing.sm,
    },

    feature: {
        fontSize: 15,
        color: theme.colors.textDark,
    },

    policies: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },

    policyBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 7,
        borderRadius: 999,
    },

    policyAccepted: {
        backgroundColor: theme.colors.successBg,
    },

    policyRejected: {
        backgroundColor: theme.colors.errorBg,
    },

    policyText: {
        fontSize: 13,
        fontWeight: '600',
    },

    policyTextAccepted: {
        color: theme.colors.successText,
    },

    policyTextRejected: {
        color: theme.colors.errorText,
    },

    text: {
        fontSize: 15,
        lineHeight: 22,
        color: theme.colors.textDark,
    },

    textMuted: {
        fontSize: 14,
        color: theme.colors.textMuted,
    },

    service: {
        marginBottom:
            theme.spacing.sm,
        fontSize: 15,
        color: theme.colors.textDark,
    },

    availability: {
        fontSize: 15,
        fontWeight: '600',
    },

    available: {
        color: theme.colors.primary,
    },

    unavailable: {
        color: theme.colors.textMuted,
    },

    actions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.lg,
    },

    actionButton: {
        flex: 1,
        minHeight: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.sm,
    },

    actionPrimary: {
        backgroundColor: theme.colors.primary,
    },

    actionSecondary: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },

    actionDisabled: {
        backgroundColor: theme.colors.disabled,
        borderColor: theme.colors.disabled,
        opacity: 0.7,
    },

    actionPrimaryText: {
        color: theme.colors.white,
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
    },

    actionSecondaryText: {
        color: theme.colors.primary,
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
    },

    resenaHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },

    resenaPromedio: {
        alignItems: 'center',
    },

    resenaPromedioNum: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.textDark,
    },

    resenaPromedioEstrellas: {
        color: '#f59e0b',
        fontSize: 13,
        letterSpacing: 1,
    },

    resenaPromedioTotal: {
        color: theme.colors.textMuted,
        fontSize: 12,
    },

    resenaLista: {
        gap: theme.spacing.sm,
    },

    resenaItem: {
        padding: theme.spacing.md,
        borderRadius: 12,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    resenaItemTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    resenaAutor: {
        color: theme.colors.textDark,
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
        marginRight: theme.spacing.sm,
    },

    resenaEstrellas: {
        color: '#f59e0b',
        fontSize: 14,
        letterSpacing: 1,
    },

    resenaMiaBadge: {
        marginTop: 6,
        alignSelf: 'flex-start',
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },

    resenaFecha: {
        marginTop: 6,
        color: theme.colors.textMuted,
        fontSize: 12,
    },

    resenaComentario: {
        marginTop: 6,
        color: theme.colors.textDark,
        fontSize: 14,
        lineHeight: 20,
    },

    carouselContainer: {
        width: '100%',
        height: 280,
        backgroundColor:
            theme.colors.border,
    },

    carouselImageContainer: {
        height: 280,
        backgroundColor:
            theme.colors.border,
    },

    carouselImage: {
        width: '100%',
        height: '100%',
    },

    imagePlaceholder: {
        width: '100%',
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor:
            theme.colors.border,
    },

    imagePlaceholderText: {
        fontSize: 48,
    },

    imagePlaceholderLabel: {
        marginTop: 8,
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.textMuted,
        textAlign: 'center',
    },

    indicators: {
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },

    indicator: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor:
            '#ffffff99',
    },

    indicatorActivo: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: theme.colors.white,
    },

    favoriteButton: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: theme.colors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: {
            width: 0,
            height: 2,
        },
    },

    favoriteIcon: {
        fontSize: 30,
        color: theme.colors.primary,
        lineHeight: 34,
    },

    favoriteToast: {
        position: 'absolute',
        bottom: 18,
        left: 20,
        right: 20,
        alignItems: 'center',
    },

    favoriteToastText: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: theme.colors.background,
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
        elevation: 4,
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: {
            width: 0,
            height: 2,
        },
    },
});