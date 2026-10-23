import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

import { useLayout } from '@/context/LayoutContext';
import { theme } from '@/theme/theme';
import api from '../../services/api';

import { estaAutenticado } from '../../services/authService';
import {
    agregarFavorito,
    eliminarFavorito,
    obtenerFavoritos,
} from '../../services/favoriteService';
import { crearReserva } from '../../services/reservationService';
import { obtenerPerfil } from '../../services/userService';

import ApplicantProfileForm from '@/components/ApplicantProfileForm';
import PropertyReviews from '@/components/PropertyReviews';
import ReservationRequestForm from '@/components/ReservationRequestForm';

// Interfaces... (Mantenidas iguales)
interface Servicio { id: number; nombre: string; }
interface Categoria { id: number; nombre: string; }
interface Localidad { id: number; nombre: string; codigo_postal: string; provincia_id: number; }
interface Imagen { id: number; ruta: string; es_principal: boolean; }
interface Propiedad {
    id: number; titulo: string; descripcion: string; precio: number; expensas: number;
    direccion: string; cantidad_ambientes: number; cantidad_dormitorios: number;
    cantidad_banos: number; capacidad: number | null; disponible: boolean; destacada: boolean;
    categoria_id: number; usuario_id: number; localidad_id: number; imagen_url: string | null;
    categoria: Categoria; localidad: Localidad; servicios: Servicio[];
    imagenes: Imagen[]; imagen_principal: Imagen | null;
}

export default function PropiedadDetailScreen() {
    const router = useRouter();
    const [mostrarFormularioPerfil, setMostrarFormularioPerfil] = useState(false);
    const [mostrarDetalles, setMostrarDetalles] = useState(false);
    const [usuarioActualId, setUsuarioActualId] = useState<number | null>(null);
    const [perfilCargado, setPerfilCargado] = useState(false);
    const { id } = useLocalSearchParams<{ id: string }>();
    const { bottomNavigationHeight } = useLayout();
    const { width } = useWindowDimensions();

    const [imagenActual, setImagenActual] = useState(0);
    const [propiedad, setPropiedad] = useState<Propiedad | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensajeFavorito, setMensajeFavorito] = useState('');
    
    const escalaFavorito = useRef(new Animated.Value(1)).current;
    
    const [esFavorito, setEsFavorito] = useState(false);
    const [actualizandoFavorito, setActualizandoFavorito] = useState(false);
    const [creandoConsulta, setCreandoConsulta] = useState(false);
    const [errorConsulta, setErrorConsulta] = useState('');
    const [mostrarFormularioReserva, setMostrarFormularioReserva] = useState(false);
    const [creandoReserva, setCreandoReserva] = useState(false);
    const [errorReserva, setErrorReserva] = useState('');

    const scrollViewRef = useRef<ScrollView>(null);
    const [posicionFormulario, setPosicionFormulario] = useState(0);

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
                (item: any) => Number(item.propiedad_id) === Number(propiedad.id)
            );
            setEsFavorito(favorito);
        } catch (error) {
            console.error('❌ ERROR CARGANDO FAVORITOS:', error);
        }
    }, [propiedad?.id]);

    const construirUrlImagen = (ruta: string | null) => {
        if (!ruta) return null;
        const baseUrl = (api.defaults.baseURL ?? '').replace(/\/api\/?$/, '');
        return `${baseUrl}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
    };

    const animarFavorito = () => {
        Animated.sequence([
            Animated.timing(escalaFavorito, { toValue: 1.25, duration: 120, useNativeDriver: true }),
            Animated.spring(escalaFavorito, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
        ]).start();
    };

    const toggleFavorito = async () => {
        if (!propiedad?.id || actualizandoFavorito) return;
        const autenticado = await estaAutenticado();
        if (!autenticado) {
            setMensajeFavorito('Iniciá sesión para agregar favoritos');
            setTimeout(() => setMensajeFavorito(''), 2200);
            return;
        }

        const nuevoEstado = !esFavorito;
        setEsFavorito(nuevoEstado);
        setActualizandoFavorito(true);
        setMensajeFavorito(nuevoEstado ? 'Agregada a favoritos' : 'Eliminada de favoritos');
        animarFavorito();

        try {
            const response = nuevoEstado ? await agregarFavorito(propiedad.id) : await eliminarFavorito(propiedad.id);
            if (!response?.success) {
                setEsFavorito(!nuevoEstado);
                setMensajeFavorito(response?.error || response?.message || 'No se pudo actualizar el favorito');
                return;
            }
            setTimeout(() => setMensajeFavorito(''), 2200);
        } catch (error) {
            console.error('FAVORITO - error:', error);
            setEsFavorito(!nuevoEstado);
            setMensajeFavorito('No se pudo actualizar el favorito');
        } finally {
            setActualizandoFavorito(false);
        }
    };

    useEffect(() => {
        let activo = true;
        const cargarPerfilActual = async () => {
            try {
                const autenticado = await estaAutenticado();
                if (!autenticado) return;
                const response = await obtenerPerfil();
                if (!response?.success) return;
                const perfil = response.data;
                if (activo && perfil?.id != null) setUsuarioActualId(Number(perfil.id));
            } catch (error) {
                console.error('Error al cargar el perfil actual:', error);
            } finally {
                if (activo) setPerfilCargado(true);
            }
        };
        cargarPerfilActual();
        return () => { activo = false; };
    }, []);

    useEffect(() => { cargarEstadoFavorito(); }, [cargarEstadoFavorito]);

    useEffect(() => {
        if (!mostrarFormularioPerfil && !mostrarFormularioReserva) return;
        const frame = requestAnimationFrame(() => {
            scrollViewRef.current?.scrollTo({ y: Math.max(0, posicionFormulario - 20), animated: true });
        });
        return () => cancelAnimationFrame(frame);
    }, [mostrarFormularioPerfil, mostrarFormularioReserva, posicionFormulario]);

    useEffect(() => {
        const cargarPropiedad = async () => {
            if (!id) {
                setError('No se indicó una propiedad.');
                setCargando(false);
                return;
            }
            try {
                setCargando(true);
                setError('');
                const response = await api.get(`/propiedades/${id}`);
                setPropiedad(response.data.data);
            } catch (error) {
                console.error('❌ ERROR CARGANDO PROPIEDAD:', error);
                setError('No se pudo cargar la información de la propiedad.');
            } finally {
                setCargando(false);
            }
        };
        cargarPropiedad();
    }, [id]);

    if (cargando) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Cargando propiedad...</Text>
            </View>
        );
    }

    if (error || !propiedad) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.colors.errorText} />
                <Text style={styles.errorText}>{error || 'Propiedad no encontrada.'}</Text>
            </View>
        );
    }

    const Divisor = () => <View style={styles.divider} />;
    const imagenes = propiedad.imagenes ?? [];
    const imagenesOrdenadas = [
        ...imagenes.filter((img) => img.es_principal),
        ...imagenes.filter((img) => !img.es_principal),
    ];

    const consultarPropiedad = async () => {
        if (!propiedad?.id || creandoConsulta) return;
        if (usuarioActualId !== null && Number(usuarioActualId) === Number(propiedad.usuario_id)) return;
        setErrorConsulta('');
        const autenticado = await estaAutenticado();
        if (!autenticado) {
            router.push('/login');
            return;
        }
        setMostrarFormularioPerfil(true);
    };

    const esPropietario = usuarioActualId !== null && Number(usuarioActualId) === Number(propiedad.usuario_id);

    return (
        <KeyboardAvoidingView
            style={styles.keyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ScrollView
                ref={scrollViewRef}
                style={styles.container}
                contentContainerStyle={[styles.content, { paddingBottom: bottomNavigationHeight + theme.spacing.lg }]}
                showsVerticalScrollIndicator={false}
            >
                {/* IMÁGENES */}
                <View style={styles.carouselContainer}>
                    {imagenesOrdenadas.length > 0 ? (
                        <>
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={(e) => {
                                    const indice = Math.round(e.nativeEvent.contentOffset.x / width);
                                    setImagenActual(indice);
                                }}
                            >
                                {imagenesOrdenadas.map((imagen) => {
                                    const url = construirUrlImagen(imagen.ruta);
                                    return (
                                        <View key={imagen.id} style={[styles.carouselImageContainer, { width }]}>
                                            {url ? (
                                                <Image source={{ uri: url }} style={styles.carouselImage} resizeMode="cover" />
                                            ) : (
                                                <View style={styles.imagePlaceholder}>
                                                    <Ionicons name="image-outline" size={48} color={theme.colors.textMuted} />
                                                    <Text style={styles.imagePlaceholderLabel}>Sin imágenes</Text>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                            {imagenesOrdenadas.length > 1 && (
                                <View style={styles.indicators}>
                                    {imagenesOrdenadas.map((_, index) => (
                                        <View key={index} style={[styles.indicator, index === imagenActual && styles.indicatorActivo]} />
                                    ))}
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="home-outline" size={48} color={theme.colors.textMuted} />
                            <Text style={styles.imagePlaceholderLabel}>Sin imágenes disponibles</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={toggleFavorito}
                        disabled={actualizandoFavorito}
                        activeOpacity={0.8}
                    >
                        <Animated.View style={{ transform: [{ scale: escalaFavorito }] }}>
                            <Ionicons 
                                name={esFavorito ? "heart" : "heart-outline"} 
                                size={26} 
                                color={esFavorito ? theme.colors.primary : theme.colors.textDark} 
                            />
                        </Animated.View>
                    </TouchableOpacity>

                    {mensajeFavorito !== '' && (
                        <View style={styles.favoriteToast}>
                            <Text style={styles.favoriteToastText}>{mensajeFavorito}</Text>
                        </View>
                    )}
                </View>

                {/* INFORMACIÓN PRINCIPAL */}
                <View style={styles.header}>
                    <View style={styles.badgeContainer}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{propiedad.categoria.nombre}</Text>
                        </View>
                        <View style={styles.locationBadge}>
                            <Ionicons name="location" size={12} color={theme.colors.textMuted} />
                            <Text style={styles.locationBadgeText}>{propiedad.localidad.nombre}</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{propiedad.titulo}</Text>

                    <Text style={styles.price}>
                        ${propiedad.precio.toLocaleString('es-AR')}
                    </Text>

                    {propiedad.expensas > 0 && (
                        <Text style={styles.expenses}>
                            + ${propiedad.expensas.toLocaleString('es-AR')} expensas
                        </Text>
                    )}
                </View>

                <Divisor />

                {/* RESEÑAS */}
                <PropertyReviews propiedadId={propiedad.id} />

                <Divisor />

                {/* DESPLEGABLE DE DETALLES */}
                <TouchableOpacity
                    style={styles.detailsToggle}
                    onPress={() => setMostrarDetalles((actual) => !actual)}
                    activeOpacity={0.7}
                >
                    <View style={styles.detailsIconContainer}>
                        <Ionicons name="list-outline" size={24} color={theme.colors.primary} />
                    </View>
                    <View style={styles.detailsToggleContent}>
                        <Text style={styles.detailsToggleTitle}>Detalles de la propiedad</Text>
                        <Text style={styles.detailsToggleSubtitle}>Características, ubicación y servicios</Text>
                    </View>
                    <View style={[styles.detailsChevronContainer, mostrarDetalles && styles.detailsChevronExpanded]}>
                        <Ionicons name={mostrarDetalles ? "chevron-up" : "chevron-down"} size={20} color={mostrarDetalles ? '#fff' : theme.colors.textDark} />
                    </View>
                </TouchableOpacity>

                {mostrarDetalles && (
                    <View style={styles.detailsContent}>
                        {/* CARACTERÍSTICAS (Rediseñadas tipo grilla) */}
                        <Divisor />
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Características</Text>
                            <View style={styles.featuresGrid}>
                                <View style={styles.featurePill}>
                                    <Ionicons name="cube-outline" size={18} color={theme.colors.textDark} />
                                    <Text style={styles.featureText}>{propiedad.cantidad_ambientes} Ambientes</Text>
                                </View>
                                <View style={styles.featurePill}>
                                    <Ionicons name="bed-outline" size={18} color={theme.colors.textDark} />
                                    <Text style={styles.featureText}>{propiedad.cantidad_dormitorios} Dormitorios</Text>
                                </View>
                                <View style={styles.featurePill}>
                                    <Ionicons name="water-outline" size={18} color={theme.colors.textDark} />
                                    <Text style={styles.featureText}>{propiedad.cantidad_banos} Baños</Text>
                                </View>
                                {propiedad.capacidad !== null && (
                                    <View style={styles.featurePill}>
                                        <Ionicons name="people-outline" size={18} color={theme.colors.textDark} />
                                        <Text style={styles.featureText}>Capacidad: {propiedad.capacidad}</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* UBICACIÓN */}
                        <Divisor />
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Ubicación</Text>
                            <View style={styles.locationRow}>
                                <Ionicons name="map-outline" size={20} color={theme.colors.textMuted} />
                                <View>
                                    <Text style={styles.text}>{propiedad.direccion}</Text>
                                    <Text style={styles.textMuted}>{propiedad.localidad.nombre} (CP: {propiedad.localidad.codigo_postal})</Text>
                                </View>
                            </View>
                        </View>

                        {/* DESCRIPCIÓN */}
                        <Divisor />
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Descripción</Text>
                            <Text style={styles.text}>{propiedad.descripcion}</Text>
                        </View>

                        {/* SERVICIOS */}
                        <Divisor />
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Servicios</Text>
                            <View style={styles.servicesContainer}>
                                {propiedad.servicios.length > 0 ? (
                                    propiedad.servicios.map((servicio) => (
                                        <View key={servicio.id} style={styles.serviceItem}>
                                            <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                                            <Text style={styles.serviceText}>{servicio.nombre}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.textMuted}>No se especificaron servicios.</Text>
                                )}
                            </View>
                        </View>

                        {/* DISPONIBILIDAD */}
                        <Divisor />
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Disponibilidad</Text>
                            <View style={[styles.availabilityBadge, propiedad.disponible ? styles.badgeAvailable : styles.badgeUnavailable]}>
                                <Ionicons name={propiedad.disponible ? "checkmark-circle-outline" : "close-circle-outline"} size={16} color={propiedad.disponible ? theme.colors.primary : theme.colors.textMuted} />
                                <Text style={[styles.availabilityText, propiedad.disponible ? styles.textAvailable : styles.textUnavailable]}>
                                    {propiedad.disponible ? 'Disponible' : 'No disponible'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                <Divisor />

                {perfilCargado && !esPropietario && (
                    <View 
                        style={styles.accionesPropiedad}
                        onLayout={(e) => setPosicionFormulario(e.nativeEvent.layout.y)}
                    >
                        <TouchableOpacity
                            style={styles.consultarButton}
                            onPress={consultarPropiedad}
                            disabled={creandoConsulta}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                            <Text style={styles.consultarButtonText}>Consultar propiedad</Text>
                        </TouchableOpacity>

                        {mostrarFormularioPerfil && (
                            <ApplicantProfileForm
                                propiedadId={propiedad.id}
                                onCancel={() => {
                                    setMostrarFormularioPerfil(false);
                                    setErrorConsulta('');
                                }}
                                onConsultaCreada={(consultaId) => {
                                    setMostrarFormularioPerfil(false);
                                    router.push(`/messages/${consultaId}`);
                                }}
                            />
                        )}

                        {propiedad.disponible && (
                            <TouchableOpacity
                                style={[styles.consultarButton, styles.reservarButton]}
                                onPress={async () => {
                                    setErrorReserva('');
                                    const autenticado = await estaAutenticado();
                                    if (!autenticado) {
                                        router.push('/login');
                                        return;
                                    }
                                    setMostrarFormularioReserva(true);
                                }}
                                disabled={creandoReserva}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#fff" />
                                <Text style={styles.consultarButtonText}>Solicitar reserva</Text>
                            </TouchableOpacity>
                        )}

                        {mostrarFormularioReserva && (
                            <ReservationRequestForm
                                onCancel={() => {
                                    setMostrarFormularioReserva(false);
                                    setErrorReserva('');
                                }}
                                onSubmit={async (fechaInicio, fechaFin) => {
                                    if (!propiedad.id || creandoReserva) return;
                                    setErrorReserva('');
                                    setCreandoReserva(true);
                                    try {
                                        const response = await crearReserva(propiedad.id, fechaInicio, fechaFin);
                                        if (!response?.success || !response?.data?.id) {
                                            setErrorReserva(response?.message || response?.error || 'No se pudo crear la solicitud de reserva.');
                                            return;
                                        }
                                        setMostrarFormularioReserva(false);
                                        Alert.alert(
                                            '¡Solicitud enviada!',
                                            'Tu solicitud de reserva se creó correctamente y quedó pendiente de confirmación por parte del propietario.',
                                            [{ text: 'Aceptar', onPress: () => {} }]
                                        );
                                    } finally {
                                        setCreandoReserva(false);
                                    }
                                }}
                            />
                        )}

                        {errorReserva !== '' && (
                            <Text style={styles.errorConsulta}>{errorReserva}</Text>
                        )}
                    </View>
                )}      
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingBottom: 0 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg, backgroundColor: theme.colors.background },
    loadingText: { marginTop: theme.spacing.md, color: theme.colors.textDark, fontSize: 15, fontWeight: '500' },
    errorText: { color: theme.colors.errorText, fontSize: 15, marginTop: 12, textAlign: 'center', fontWeight: '500' },
    
    // Header y Badges
    header: { padding: theme.spacing.lg },
    badgeContainer: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    categoryBadge: { backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    categoryBadgeText: { color: theme.colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    locationBadgeText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
    
    title: { fontSize: 26, fontWeight: '800', color: theme.colors.textDark, lineHeight: 32 },
    price: { marginTop: 12, fontSize: 28, fontWeight: '800', color: theme.colors.primary },
    expenses: { marginTop: 4, fontSize: 15, color: theme.colors.textMuted, fontWeight: '500' },
    divider: { height: StyleSheet.hairlineWidth, marginVertical: theme.spacing.md, backgroundColor: theme.colors.border },
    
    // Contenido Desplegable
    detailsContent: { gap: 0, paddingTop: theme.spacing.sm },
    section: { marginHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
    sectionTitle: { marginBottom: theme.spacing.md, fontSize: 18, fontWeight: '700', color: theme.colors.textDark },
    text: { fontSize: 15, lineHeight: 24, color: theme.colors.textDark },
    textMuted: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4 },
    
    // Grilla de características
    featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    featurePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.inputBg, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border },
    featureText: { fontSize: 14, color: theme.colors.textDark, fontWeight: '500' },
    
    locationRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    
    // Servicios
    servicesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    serviceItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '45%' },
    serviceText: { fontSize: 15, color: theme.colors.textDark },
    
    // Disponibilidad
    availabilityBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
    badgeAvailable: { backgroundColor: `${theme.colors.primary}15` },
    badgeUnavailable: { backgroundColor: theme.colors.border },
    availabilityText: { fontSize: 14, fontWeight: '600' },
    textAvailable: { color: theme.colors.primary },
    textUnavailable: { color: theme.colors.textMuted },

    // Carrusel
    carouselContainer: { width: '100%', height: 320, backgroundColor: theme.colors.border, position: 'relative' },
    carouselImageContainer: { height: 320, backgroundColor: theme.colors.border },
    carouselImage: { width: '100%', height: '100%' },
    imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    imagePlaceholderLabel: { marginTop: 12, fontSize: 15, fontWeight: '600', color: theme.colors.textMuted },
    indicators: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.5)' },
    indicatorActivo: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffffff' },
    
    // Botón Favorito
    favoriteButton: { position: 'absolute', top: 16, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
    favoriteToast: { position: 'absolute', bottom: 40, left: 20, right: 20, alignItems: 'center' },
    favoriteToastText: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: theme.colors.textDark, color: '#fff', fontSize: 14, fontWeight: '600', elevation: 4 },
    
    // Botones de Acción
    accionesPropiedad: { marginTop: theme.spacing.md, gap: 12, paddingBottom: 20 },
    consultarButton: { marginHorizontal: theme.spacing.lg, flexDirection: 'row', gap: 8, paddingVertical: 14, paddingHorizontal: theme.spacing.md, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.textDark, elevation: 3, shadowOpacity: 0.2, shadowOffset: {width: 0, height: 2}, shadowRadius: 4 },
    reservarButton: { backgroundColor: theme.colors.primary },
    consultarButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    errorConsulta: { marginHorizontal: theme.spacing.lg, color: theme.colors.errorText, fontSize: 14, textAlign: 'center', fontWeight: '500' },
    
    keyboardAvoiding: { flex: 1 },
    
    // Acordeón de Detalles
    detailsToggle: { marginHorizontal: theme.spacing.lg, marginVertical: theme.spacing.md, padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: theme.colors.inputBg, elevation: 2, shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: {width: 0, height: 2} },
    detailsIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center' },
    detailsToggleContent: { flex: 1, gap: 2 },
    detailsToggleTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textDark },
    detailsToggleSubtitle: { fontSize: 13, color: theme.colors.textMuted },
    detailsChevronContainer: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.border },
    detailsChevronExpanded: { backgroundColor: theme.colors.primary },
});