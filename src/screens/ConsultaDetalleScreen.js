import {
    useFocusEffect,
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import {
    useCallback,
    useState,
} from 'react';

import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useLayout } from '../context/LayoutContext';
import api, {
    enviarMensajeConsulta,
    obtenerConsultas,
    obtenerConsultasByPropiedad,
    obtenerMensajesConsulta,
    obtenerPerfil,
} from '../services/api';
import { theme } from '../theme/theme';
import { extraerItems } from '../utils/formato';
import {
    ETIQUETAS_GARANTIAS,
    ETIQUETAS_PRECALIFICACION,
    evaluarPrecalificacion,
} from '../utils/precalificacion';

export default function ConsultaDetalleScreen() {
    const { id, propiedadId, origen } = useLocalSearchParams();

    const router = useRouter();
    const { bottomNavigationHeight } = useLayout();

    const [consulta, setConsulta] = useState(null);
    const [propiedad, setPropiedad] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [usuarioId, setUsuarioId] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [respuesta, setRespuesta] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [errorRespuesta, setErrorRespuesta] = useState('');

    const cargar = useCallback(async () => {
        if (!id) {
            setCargando(false);
            return;
        }

        try {
            setCargando(true);
            setErrorRespuesta('');

            const perfilRes = await obtenerPerfil();

            if (perfilRes?.success) {
                setUsuarioId(perfilRes.data?.id ?? null);
            }

            let encontrada = null;
            const idPropiedad = Array.isArray(propiedadId)
                ? propiedadId[0]
                : propiedadId;
            const esRecibida = origen === 'recibida';

            if (esRecibida && idPropiedad) {
                const recibidasRes =
                    await obtenerConsultasByPropiedad(idPropiedad);
                encontrada = extraerItems(recibidasRes).find(
                    (c) => String(c.id) === String(id)
                );

                try {
                    const propiedadRes = await api.get(
                        `/propiedades/${idPropiedad}`
                    );
                    setPropiedad(propiedadRes.data?.data || null);
                } catch (errorPropiedad) {
                    console.error(
                        'CONSULTA: error al cargar propiedad para precalificación',
                        errorPropiedad
                    );
                }
            }

            if (!encontrada) {
                const consultasRes = await obtenerConsultas();
                encontrada = extraerItems(consultasRes).find(
                    (c) => String(c.id) === String(id)
                );
            }

            if (encontrada) {
                setConsulta(encontrada);
            }

            const mensajesRes =
                await obtenerMensajesConsulta(id);

            setMensajes(extraerItems(mensajesRes));
        } catch (error) {
            console.error(
                'CONSULTA: error al cargar hilo',
                error
            );
        } finally {
            setCargando(false);
        }
    }, [id, origen, propiedadId]);

    const responder = async () => {
        const texto = respuesta.trim();

        if (!texto) {
            setErrorRespuesta('El mensaje es requerido');

            return;
        }

        if (texto.length < 5) {
            setErrorRespuesta(
                'El mensaje debe tener al menos 5 caracteres'
            );

            return;
        }

        setEnviando(true);
        setErrorRespuesta('');

        try {
            const result = await enviarMensajeConsulta(
                id,
                texto
            );

            if (result.success) {
                setRespuesta('');

                const mensajesRes =
                    await obtenerMensajesConsulta(id);

                setMensajes(extraerItems(mensajesRes));
            } else {
                setErrorRespuesta(
                    result.error ||
                    result.message ||
                    'No se pudo enviar el mensaje.'
                );
            }
        } catch (_error) {
            setErrorRespuesta(
                'Error de conexión al enviar el mensaje.'
            );
        } finally {
            setEnviando(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [cargar])
    );

    const nombreDe = (m) =>
        m?.nombre ||
        m?.apellido ||
        m?.email ||
        'Usuario';

    const formatearFecha = (fecha) => {
        if (!fecha) return '';

        return String(fecha).replace('T', ' ').slice(0, 16);
    };

    const titulo = consulta?.propiedad?.titulo || 'Consulta';
    const perfilInteresado = consulta?.perfil_interesado;
    const propiedadContexto = propiedad || consulta?.propiedad;
    const precalificacion = evaluarPrecalificacion(
        consulta,
        propiedadContexto
    );
    const garantiasInteresado = Array.isArray(perfilInteresado?.garantias)
        ? perfilInteresado.garantias
            .map((garantia) => ETIQUETAS_GARANTIAS[garantia] || garantia)
            .join(', ')
        : 'No indicó';
    const interesadoTieneMascotas =
        perfilInteresado?.tiene_mascotas === true ||
        perfilInteresado?.tiene_mascotas === 1 ||
        perfilInteresado?.tiene_mascotas === '1' ||
        perfilInteresado?.tiene_mascotas === 'true';

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === 'ios' ? 'padding' : 'height'
            }
            keyboardVerticalOffset={
                Platform.OS === 'ios' ? 90 : 0
            }
        >
            <View style={styles.header}>
                <Text
                    style={styles.headerTitle}
                    numberOfLines={1}
                >
                    {titulo}
                </Text>

                {consulta?.propiedad?.id ? (
                    <TouchableOpacity
                        onPress={() =>
                            router.push(
                                `/propiedades/${consulta.propiedad.id}`
                            )
                        }
                        activeOpacity={0.8}
                    >
                        <Text style={styles.headerLink}>
                            Ver propiedad ›
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {cargando ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator
                        size="large"
                        color={theme.colors.primary}
                    />

                    <Text style={styles.loadingText}>
                        Cargando conversación...
                    </Text>
                </View>
            ) : (
                <>
                    <ScrollView
                        style={styles.thread}
                        contentContainerStyle={{
                            paddingBottom:
                                bottomNavigationHeight +
                                theme.spacing.md,
                            paddingHorizontal:
                                theme.spacing.md,
                            paddingVertical: theme.spacing.md,
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        {origen === 'recibida' && perfilInteresado ? (
                            <View style={styles.profileCard}>
                                <View style={styles.profileHeader}>
                                    <Text style={styles.profileTitle}>
                                        Perfil del interesado
                                    </Text>
                                    <Text
                                        style={[
                                            styles.profileStatus,
                                            precalificacion.estado ===
                                                'coincide' &&
                                                styles.profileStatusMatch,
                                            precalificacion.estado ===
                                                'revisar' &&
                                                styles.profileStatusReview,
                                        ]}
                                    >
                                        {ETIQUETAS_PRECALIFICACION[
                                            precalificacion.estado
                                        ]}
                                    </Text>
                                </View>
                                <Text style={styles.profileDetail}>
                                    Mudanza: {perfilInteresado.fecha_mudanza || 'No indicó'}
                                </Text>
                                <Text style={styles.profileDetail}>
                                    Ocupantes: {perfilInteresado.cantidad_ocupantes ?? 'No indicó'}
                                </Text>
                                <Text style={styles.profileDetail}>
                                    Mascotas: {interesadoTieneMascotas ? 'Sí' : 'No'}
                                    {interesadoTieneMascotas
                                        ? ` (${perfilInteresado.cantidad_mascotas || 0})`
                                        : ''}
                                </Text>
                                <Text style={styles.profileDetail}>
                                    Garantías: {garantiasInteresado}
                                </Text>
                                {precalificacion.motivos.map((motivo) => (
                                    <Text
                                        key={motivo}
                                        style={styles.profileReason}
                                    >
                                        • {motivo}
                                    </Text>
                                ))}
                                <Text style={styles.profileNote}>
                                    La compatibilidad es orientativa y no
                                    implica un rechazo automático.
                                </Text>
                            </View>
                        ) : null}

                        {mensajes.length > 0 ? (
                            mensajes.map((m) => {
                                const esMio =
                                    String(m.usuario_id) ===
                                    String(usuarioId);

                                return (
                                    <View
                                        key={m.id}
                                        style={[
                                            styles.burbuja,
                                            esMio
                                                ? styles.burbujaMia
                                                : styles.burbujaOtro,
                                        ]}
                                    >
                                        <View
                                            style={
                                                styles.burbujaHeader
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.burbujaAutor,
                                                    esMio &&
                                                        styles.burbujaAutorMio,
                                                ]}
                                            >
                                                {esMio
                                                    ? 'Vos'
                                                    : nombreDe(m)}
                                            </Text>

                                            <Text
                                                style={[
                                                    styles.burbujaFecha,
                                                    esMio &&
                                                        styles.burbujaFechaMia,
                                                ]}
                                            >
                                                {formatearFecha(
                                                    m.fecha_mensaje
                                                )}
                                            </Text>
                                        </View>

                                        <Text
                                            style={[
                                                styles.burbujaTexto,
                                                esMio &&
                                                    styles.burbujaTextoMio,
                                            ]}
                                        >
                                            {m.mensaje}
                                        </Text>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={styles.sinMensajes}>
                                Sin mensajes todavía.
                            </Text>
                        )}
                    </ScrollView>

                    <View
                        style={[
                            styles.respuestaContainer,
                            {
                                paddingBottom:
                                    bottomNavigationHeight +
                                    theme.spacing.sm,
                            },
                        ]}
                    >
                        {errorRespuesta ? (
                            <Text style={styles.errorRespuesta}>
                                {errorRespuesta}
                            </Text>
                        ) : null}

                        <View style={styles.respuestaRow}>
                            <TextInput
                                style={styles.respuestaInput}
                                placeholder="Responder..."
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                value={respuesta}
                                onChangeText={setRespuesta}
                                multiline
                            />

                            <TouchableOpacity
                                style={[
                                    styles.enviarButton,
                                    enviando &&
                                        styles.enviarButtonDisabled,
                                ]}
                                onPress={responder}
                                disabled={enviando}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.enviarText}>
                                    {enviando ? '...' : 'Enviar'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    header: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        alignItems: 'center',
    },

    headerTitle: {
        color: theme.colors.white,
        fontSize: 20,
        fontWeight: '700',
    },

    headerLink: {
        marginTop: 6,
        color: theme.colors.white,
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.95,
    },

    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 14,
    },

    thread: {
        flex: 1,
    },

    profileCard: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.inputBg,
    },

    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
    },

    profileTitle: {
        color: theme.colors.textDark,
        fontSize: 16,
        fontWeight: '700',
    },

    profileStatus: {
        color: theme.colors.textMuted,
        fontSize: 12,
        fontWeight: '700',
    },

    profileStatusMatch: {
        color: theme.colors.successText,
    },

    profileStatusReview: {
        color: theme.colors.errorText,
    },

    profileDetail: {
        marginTop: 4,
        color: theme.colors.textDark,
        fontSize: 13,
    },

    profileReason: {
        marginTop: 5,
        color: theme.colors.errorText,
        fontSize: 12,
    },

    profileNote: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 11,
        lineHeight: 16,
    },

    burbuja: {
        maxWidth: '85%',
        marginBottom: theme.spacing.sm,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
    },

    burbujaMia: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
    },

    burbujaOtro: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderBottomLeftRadius: 4,
    },

    burbujaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 4,
    },

    burbujaAutor: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.textDark,
    },

    burbujaAutorMio: {
        color: theme.colors.primarySoft,
    },

    burbujaFecha: {
        fontSize: 10,
        color: theme.colors.textMuted,
    },

    burbujaFechaMia: {
        color: theme.colors.infoBg,
    },

    burbujaTexto: {
        fontSize: 15,
        lineHeight: 21,
        color: theme.colors.textDark,
    },

    burbujaTextoMio: {
        color: theme.colors.white,
    },

    sinMensajes: {
        color: theme.colors.textMuted,
        fontSize: 14,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    },

    respuestaContainer: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },

    errorRespuesta: {
        marginBottom: theme.spacing.sm,
        color: theme.colors.errorText,
        fontSize: 12,
    },

    respuestaRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: theme.spacing.sm,
    },

    respuestaInput: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        backgroundColor: theme.colors.inputBg,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 10,
        color: theme.colors.textDark,
        fontSize: 15,
    },

    enviarButton: {
        minHeight: 44,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
    },

    enviarButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },

    enviarText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
});