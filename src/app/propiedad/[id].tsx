import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

import { useLayout } from '@/context/LayoutContext';
import { theme } from '@/theme/theme';
import api, {
    agregarFavorito,
    crearConsulta,
    eliminarFavorito,
    estaAutenticado,
    obtenerFavoritos,
    obtenerPerfil
} from '../../services/api';

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

type PerfilInteresado = {
    fecha_mudanza: string;
    cantidad_ocupantes: number;
    tiene_mascotas: boolean;
    cantidad_mascotas: number;
    garantias: string[];
};

export default function PropiedadDetailScreen() {

    const router = useRouter();

    const [mostrarFormularioPerfil, setMostrarFormularioPerfil] = useState(false);

    const [erroresPerfil, setErroresPerfil] = useState<ErroresPerfil>({});

    const [fechaMudanza, setFechaMudanza] = useState('');
    const [cantidadOcupantes, setCantidadOcupantes] = useState('1');
    const [tieneMascotas, setTieneMascotas] = useState(false);
    const [cantidadMascotas, setCantidadMascotas] = useState('0');

    const [garantias, setGarantias] = useState<string[]>([]);

    const [usuarioActualId, setUsuarioActualId] =
        useState<number | null>(null);

    const [perfilCargado, setPerfilCargado] =
        useState(false);

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

    const [mensajeFavorito, setMensajeFavorito] = useState('');

    const escalaFavorito = useRef(
        new Animated.Value(1)
    ).current;

    const [esFavorito, setEsFavorito] = useState(false);
    const [actualizandoFavorito, setActualizandoFavorito] =
    useState(false);

    const [creandoConsulta, setCreandoConsulta] = useState(false);
    const [errorConsulta, setErrorConsulta] = useState('');

    const cargarEstadoFavorito = useCallback(async () => {
        if (!propiedad?.id) return;

    const autenticado = await estaAutenticado();

        if (!autenticado) {
            setEsFavorito(false);
            return;
        }

        try {
            const response = await obtenerFavoritos();

            if (!response?.success) return;

            const favorito = (response.data || []).some(
                (item: any) =>
                    Number(item.propiedad_id) === Number(propiedad.id)
            );

            setEsFavorito(favorito);
        } catch (error) {
            console.error('❌ ERROR CARGANDO FAVORITOS:', error);
        }
    }, [propiedad?.id]);

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
        let activo = true;

        const cargarPerfilActual = async () => {
            try {
                const autenticado = await estaAutenticado();

                if (!autenticado) {
                    return;
                }

                const response = await obtenerPerfil();

                if (!response?.success) {
                    return;
                }

                const perfil = response.data;

                if (activo && perfil?.id != null) {
                    setUsuarioActualId(Number(perfil.id));
                }
            } catch (error) {
                console.error(
                    'Error al cargar el perfil actual:',
                    error
                );
            } finally {
                if (activo) {
                    setPerfilCargado(true);
                }
            }
        };

        cargarPerfilActual();

        return () => {
            activo = false;
        };
    }, []);

    useEffect(() => {
        cargarEstadoFavorito();
    }, [cargarEstadoFavorito]);


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

    const consultarPropiedad = async () => {
        if (!propiedad?.id || creandoConsulta) return;

        if (
            usuarioActualId !== null &&
            Number(usuarioActualId) === Number(propiedad.usuario_id)
        ) {
            return;
        }

        setErrorConsulta('');

        const autenticado = await estaAutenticado();

        if (!autenticado) {
            router.push('/login');
            return;
        }

        setMostrarFormularioPerfil(true);
    };

    type ErroresPerfil = {
        fecha_mudanza?: string;
        cantidad_ocupantes?: string;
        tiene_mascotas?: string;
        cantidad_mascotas?: string;
        garantias?: string;
        general?: string;
    };

    const enviarConsulta = async () => {

        setErroresPerfil({});

        if (!propiedad?.id || creandoConsulta) return;

        setErrorConsulta('');

        // Validar la fecha ingresada.
        const fechaValida =
            /^\d{4}-\d{2}-\d{2}$/.test(fechaMudanza) &&
            !Number.isNaN(Date.parse(`${fechaMudanza}T00:00:00`)) &&
            new Date(`${fechaMudanza}T00:00:00`).toISOString().slice(0, 10) === fechaMudanza;

       if (!fechaValida) {
            setErroresPerfil({
                fecha_mudanza: 'Ingresá una fecha válida en formato AAAA-MM-DD.',
            });
            return;
        }

        const ocupantes = Number(cantidadOcupantes);
        const mascotas = Number(cantidadMascotas);

        if (!Number.isInteger(ocupantes) || ocupantes < 1 || ocupantes > 50) {
            setErroresPerfil({
                cantidad_ocupantes: 'La cantidad de ocupantes debe estar entre 1 y 50.',
            });
            return;
        }

        if (
            !Number.isInteger(mascotas) ||
            mascotas < 0 ||
            mascotas > 20 ||
            (tieneMascotas && mascotas < 1) ||
            (!tieneMascotas && mascotas !== 0)
        ) {
            setErroresPerfil({
                cantidad_mascotas: tieneMascotas
                    ? 'Indicá entre 1 y 20 mascotas.'
                    : 'La cantidad de mascotas debe ser 0 si no tenés mascotas.',
            });
            return;
        }

        const perfilInteresado: PerfilInteresado = {
            fecha_mudanza: fechaMudanza,
            cantidad_ocupantes: ocupantes,
            tiene_mascotas: tieneMascotas,
            cantidad_mascotas: tieneMascotas ? mascotas : 0,
            garantias,
        };

        try {
            setCreandoConsulta(true);

            const response = await crearConsulta(
                propiedad.id,
                perfilInteresado
            );

            if (!response?.success || !response?.data?.id) {
        const errores = response?.validation_errors?.perfil_interesado;

        setErroresPerfil({
            fecha_mudanza: errores?.fecha_mudanza,
            cantidad_ocupantes: errores?.cantidad_ocupantes,
            tiene_mascotas: errores?.tiene_mascotas,
            cantidad_mascotas: errores?.cantidad_mascotas,
            garantias: errores?.garantias,
            general: !errores
                ? response?.message ||
                response?.error ||
                'No se pudo iniciar la consulta.'
                : undefined,
        });

        return;
    }

    setErroresPerfil({});

            router.push(`/messages/${response.data.id}`);
        } catch (error) {
            console.error('Error al iniciar consulta:', error);
            setErrorConsulta('Ocurrió un error al iniciar la consulta.');
        } finally {
            setCreandoConsulta(false);
        }
    };

    const esPropietario =
    usuarioActualId !== null &&
    Number(usuarioActualId) === Number(propiedad.usuario_id);

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

            {perfilCargado && !esPropietario && (
            <>
                {mostrarFormularioPerfil && (
                    <View style={styles.formularioPerfil}>
                        <Text style={styles.sectionTitle}>
                            Perfil del interesado
                        </Text>

                        <Text style={styles.textMuted}>
                            Completá estos datos para acompañar tu consulta al propietario.
                        </Text>

                        <Text style={styles.labelFormulario}>
                            Fecha estimada de mudanza
                        </Text>
                        <TextInput
                            style={styles.inputFormulario}
                            value={fechaMudanza}
                            onChangeText={setFechaMudanza}
                            placeholder="AAAA-MM-DD"
                            placeholderTextColor={theme.colors.textMuted}
                            keyboardType="numbers-and-punctuation"
                            maxLength={10}
                        />

                        {erroresPerfil.fecha_mudanza && (
                            <Text style={styles.errorText}>
                                {erroresPerfil.fecha_mudanza}
                            </Text>
                        )}

                        <Text style={styles.labelFormulario}>
                            Cantidad de ocupantes
                        </Text>
                        <TextInput
                            style={styles.inputFormulario}
                            value={cantidadOcupantes}
                            onChangeText={setCantidadOcupantes}
                            keyboardType="number-pad"
                            maxLength={2}
                            placeholder="Ej.: 3"
                            placeholderTextColor={theme.colors.textMuted}
                        />

                        {erroresPerfil.cantidad_ocupantes && (
                            <Text style={styles.errorText}>
                                {erroresPerfil.cantidad_ocupantes}
                            </Text>
                        )}

                        <View style={styles.filaMascotas}>
                            <Text style={styles.labelFormulario}>
                                ¿Tenés mascotas?
                            </Text>

                            <Switch
                                value={tieneMascotas}
                                onValueChange={(valor) => {
                                    setTieneMascotas(valor);
                                    setCantidadMascotas(valor ? '1' : '0');
                                }}
                                trackColor={{ true: theme.colors.primary }}
                            />
                        </View>

                        {tieneMascotas && (
                            <>
                                <Text style={styles.labelFormulario}>
                                    Cantidad de mascotas
                                </Text>

                                <TextInput
                                    style={styles.inputFormulario}
                                    value={cantidadMascotas}
                                    onChangeText={setCantidadMascotas}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    placeholder="Ej.: 1"
                                    placeholderTextColor={theme.colors.textMuted}
                                />
                            </>
                        )}

                        {erroresPerfil.cantidad_mascotas && (
                            <Text style={styles.errorText}>
                                {erroresPerfil.cantidad_mascotas}
                            </Text>
                        )}

                        <Text style={styles.labelFormulario}>
                            ¿Qué garantías podés presentar?
                        </Text>

                        {[
                            { value: 'recibo_sueldo', label: 'Recibo de sueldo' },
                            { value: 'garantia_propietaria', label: 'Garantía propietaria' },
                            { value: 'seguro_caucion', label: 'Seguro de caución' },
                            { value: 'garante', label: 'Garante' },
                        ].map((opcion) => {
                            const seleccionada = garantias.includes(opcion.value);

                            return (
                                <TouchableOpacity
                                    key={opcion.value}
                                    style={styles.opcionGarantia}
                                    onPress={() => {
                                        setGarantias((actuales) =>
                                            seleccionada
                                                ? actuales.filter(
                                                    (item) => item !== opcion.value
                                                )
                                                : [...actuales, opcion.value]
                                        );
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.checkboxGarantia}>
                                        {seleccionada ? '☑' : '□'}
                                    </Text>

                                    <Text style={styles.textoGarantia}>
                                        {opcion.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}

                        {erroresPerfil.garantias && (
                            <Text style={styles.errorText}>
                                {erroresPerfil.garantias}
                            </Text>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.consultarButton,
                                creandoConsulta && styles.consultarButtonDisabled,
                            ]}
                            onPress={enviarConsulta}
                            disabled={creandoConsulta}
                            activeOpacity={0.8}
                        >
                            {creandoConsulta ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.consultarButtonText}>
                                    Enviar perfil y abrir chat
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelarFormulario}
                            onPress={() => {
                                setMostrarFormularioPerfil(false);
                                setErrorConsulta('');
                            }}
                        >
                            <Text style={styles.textoCancelar}>
                                Cancelar
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!mostrarFormularioPerfil && (
                    <TouchableOpacity
                        style={styles.consultarButton}
                        onPress={consultarPropiedad}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.consultarButtonText}>
                            Consultar por esta propiedad
                        </Text>
                    </TouchableOpacity>
                )}
            </>
        )}

            {errorConsulta !== '' && (
                <Text style={styles.errorConsulta}>
                    {errorConsulta}
                </Text>
            )}

            {erroresPerfil.general && (
                <Text style={styles.errorText}>
                    {erroresPerfil.general}
                </Text>
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
        color: theme.colors.errorText,
        fontSize: 13,
        marginTop: 4,
        marginBottom: 4,
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

    favoriteButton: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#ffffffdd',
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

    consultarButton: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    elevation: 2,
},

    consultarButtonDisabled: {
        opacity: 0.7,
    },

    consultarButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    errorConsulta: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        color: theme.colors.errorText,
        fontSize: 14,
        textAlign: 'center',
    },

    
    formularioPerfil: {
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        backgroundColor: theme.colors.background,
    },

    labelFormulario: {
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textDark,
    },

    inputFormulario: {
        minHeight: 46,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        color: theme.colors.textDark,
        fontSize: 15,
    },

    filaMascotas: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
    },

    opcionGarantia: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },

    checkboxGarantia: {
        width: 28,
        fontSize: 22,
        color: theme.colors.primary,
    },

    textoGarantia: {
        fontSize: 15,
        color: theme.colors.textDark,
    },

    cancelarFormulario: {
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
    },

    textoCancelar: {
        color: theme.colors.textMuted,
        fontSize: 15,
        fontWeight: '600',
    },

});