import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';

import { useLayout } from '@/context/LayoutContext';
import api from '@/services/api';
import { theme } from '@/theme/theme';

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

export default function PropiedadDetailScreen() {
    const { id } =
        useLocalSearchParams<{ id: string }>();

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

    const Divisor = () => (
        <View style={styles.divider} />
    );

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
        backgroundColor:
            '#ffffff',
    },
});