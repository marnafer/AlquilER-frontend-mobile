
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    useFocusEffect,
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import {
    enviarMensaje,
    obtenerConsulta,
    obtenerMensajes,
    obtenerPerfil,
} from '../../services/api';

import { theme } from '../../theme/theme';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LIMITE_MENSAJES = 10;
const INTERVALO_ACTUALIZACION = 15000;

function extraerDatos(respuesta) {
    if (respuesta?.success) {
        return respuesta.data;
    }

    if (respuesta?.data?.success) {
        return respuesta.data.data;
    }

    return respuesta?.data ?? respuesta;
}

function combinarMensajes(actuales, nuevos) {
    const mensajesPorId = new Map();

    [...actuales, ...nuevos].forEach((mensaje) => {
        if (mensaje?.id != null) {
            mensajesPorId.set(mensaje.id, mensaje);
        }
    });

    return [...mensajesPorId.values()].sort(
        (a, b) => a.id - b.id
    );
}

function obtenerNombre(usuario) {
    if (!usuario) {
        return '';
    }

    return [
        usuario.nombre,
        usuario.apellido,
    ]
        .filter(Boolean)
        .join(' ');
}

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const actualizandoMensajesRef = useRef(false);

    const consultaId = Array.isArray(id) ? id[0] : id;

    const volver = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/home');
        }
    };

    const [consulta, setConsulta] = useState(null);
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [texto, setTexto] = useState('');

    const [loading, setLoading] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [hayAnteriores, setHayAnteriores] = useState(false);

    const listaRef = useRef(null);
    const mensajesRef = useRef([]);
    const consultaRef = useRef(null);
    const usuarioRef = useRef(null);

    const cargandoAnterioresRef = useRef(false);
    const alturaContenidoRef = useRef(0);
    const mantenerPosicionRef = useRef(false);
    const desplazarAlFinalRef = useRef(true);
    const cercaDelFinalRef = useRef(true);

    useEffect(() => {
        mensajesRef.current = mensajes;
    }, [mensajes]);

    useEffect(() => {
        consultaRef.current = consulta;
    }, [consulta]);

    useEffect(() => {
        usuarioRef.current = usuarioActual;
    }, [usuarioActual]);

    const cargarInicial = useCallback(async () => {
        if (!consultaId) {
            setError('No se indicó una consulta válida.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        desplazarAlFinalRef.current = true;

        try {
            const [
                respuestaConsulta,
                respuestaPerfil,
                respuestaMensajes,
            ] = await Promise.all([
                obtenerConsulta(consultaId),
                obtenerPerfil(),
                obtenerMensajes(consultaId, {
                    limite: LIMITE_MENSAJES,
                }),
            ]);

            const datosConsulta = extraerDatos(
                respuestaConsulta
            );

            const datosPerfil = extraerDatos(
                respuestaPerfil
            );

            const datosMensajes = extraerDatos(
                respuestaMensajes
            );

            if (!datosConsulta?.id) {
                throw new Error(
                    'No se pudo obtener la conversación.'
                );
            }

            if (!datosPerfil?.id) {
                throw new Error(
                    'No se pudo identificar al usuario autenticado.'
                );
            }

            const items = Array.isArray(datosMensajes?.items)
                ? datosMensajes.items
                : [];

            setConsulta(datosConsulta);
            setUsuarioActual(datosPerfil);
            setMensajes(combinarMensajes([], items));

            setHayAnteriores(
                Boolean(datosMensajes?.hay_anteriores)
            );
        } catch (e) {
            console.error(
                'CHAT: error al cargar la conversación:',
                e
            );

            setError(
                'No se pudo cargar la conversación. Revisá tu conexión e intentá nuevamente.'
            );
        } finally {
            setLoading(false);
        }
    }, [consultaId]);

    
    const cargarNuevos = useCallback(async () => {
        if (
            !consultaId ||
            !usuarioRef.current ||
            !consultaRef.current ||
            actualizandoMensajesRef.current
        ) {
            return;
        }

        actualizandoMensajesRef.current = true;

        try {
            let historial = mensajesRef.current;
            let ultimoId = historial.length > 0
                ? Math.max(...historial.map((mensaje) => mensaje.id))
                : null;

            const mensajesRecibidos = [];
            let primeraConsulta = true;

            while (primeraConsulta || ultimoId !== null) {
                primeraConsulta = false;

                const parametros = {
                    limite: LIMITE_MENSAJES,
                };

                if (ultimoId !== null) {
                    parametros.despues_de_id = ultimoId;
                }

                const respuesta = await obtenerMensajes(
                    consultaId,
                    parametros
                );

                if (
                    respuesta?.success === false ||
                    respuesta?.data?.success === false
                ) {
                    throw new Error(
                        respuesta?.error ||
                        respuesta?.message ||
                        'No se pudieron actualizar los mensajes.'
                    );
                }

                const datos = extraerDatos(respuesta);
                const items = Array.isArray(datos?.items)
                    ? datos.items
                    : [];

                // Si la conversación no tenía mensajes, la consulta
                // inicial trae el historial más reciente.
                if (historial.length === 0 && mensajesRecibidos.length === 0) {
                    setHayAnteriores(Boolean(datos?.hay_anteriores));
                }

                if (items.length === 0) {
                    break;
                }

                mensajesRecibidos.push(...items);

                const nuevoUltimoId = Math.max(
                    ...items.map((mensaje) => mensaje.id)
                );

                // Evita repetir indefinidamente un lote inválido.
                if (
                    ultimoId !== null &&
                    nuevoUltimoId <= ultimoId
                ) {
                    break;
                }

                ultimoId = nuevoUltimoId;

                // Si no quedan más mensajes nuevos, terminamos.
                if (!datos?.hay_mas_nuevos) {
                    break;
                }
            }

            if (mensajesRecibidos.length === 0) {
                return;
            }

            const combinados = combinarMensajes(
                mensajesRef.current,
                mensajesRecibidos
            );

            mensajesRef.current = combinados;
            setMensajes(combinados);

            if (cercaDelFinalRef.current) {
                desplazarAlFinalRef.current = true;

                requestAnimationFrame(() => {
                    listaRef.current?.scrollToEnd({
                        animated: true,
                    });
                });
            }
        } catch (e) {
            // Un fallo temporal no debe interrumpir la conversación.
            console.warn(
                'CHAT: no se pudieron actualizar los mensajes:',
                e
            );
        } finally {
            actualizandoMensajesRef.current = false;
        }
    }, [consultaId]);

    useFocusEffect(
        useCallback(() => {
            let activo = true;

            const iniciar = async () => {
                await cargarInicial();
            };

            iniciar();

            const intervalo = setInterval(() => {
                if (activo) {
                    cargarNuevos();
                }
            }, INTERVALO_ACTUALIZACION);

            return () => {
                activo = false;
                clearInterval(intervalo);
            };
        }, [cargarInicial, cargarNuevos])
    );

    const cargarAnteriores = async () => {
        if (
            cargandoAnterioresRef.current ||
            !hayAnteriores ||
            mensajesRef.current.length === 0
        ) {
            return;
        }

        cargandoAnterioresRef.current = true;
        setLoadingOlder(true);

        try {
            const primerId = Math.min(
                ...mensajesRef.current.map(
                    (mensaje) => mensaje.id
                )
            );

            const alturaAnterior =
                alturaContenidoRef.current;

            const respuesta = await obtenerMensajes(
                consultaId,
                {
                    antes_de_id: primerId,
                    limite: LIMITE_MENSAJES,
                }
            );

            const datos = extraerDatos(respuesta);

            const anteriores = Array.isArray(datos?.items)
                ? datos.items
                : [];

            if (anteriores.length > 0) {
                mantenerPosicionRef.current = true;
                alturaContenidoRef.current = alturaAnterior;

                const combinados = combinarMensajes(
                    mensajesRef.current,
                    anteriores
                );

                mensajesRef.current = combinados;
                setMensajes(combinados);
            }

            setHayAnteriores(
                Boolean(datos?.hay_anteriores)
            );
        } catch (e) {
            console.error(
                'CHAT: error al cargar mensajes anteriores:',
                e
            );

            setError(
                'No se pudieron cargar los mensajes anteriores.'
            );
        } finally {
            cargandoAnterioresRef.current = false;
            setLoadingOlder(false);
        }
    };

    
    const enviar = async () => {
        const mensajeTexto = texto.trim();

        if (!mensajeTexto || sending) return;

        setError('');
        setSending(true);

        try {
            const respuesta = await enviarMensaje(
                consultaId,
                mensajeTexto
            );

            if (
                respuesta?.success === false ||
                respuesta?.data?.success === false
            ) {
                const mensajeError =
                    respuesta?.message ||
                    respuesta?.error ||
                    respuesta?.data?.message ||
                    respuesta?.data?.error ||
                    'No se pudo enviar el mensaje.';

                throw new Error(mensajeError);
            }

            const mensajeCreado = extraerDatos(respuesta);

            if (
                !mensajeCreado?.id ||
                !mensajeCreado?.mensaje
            ) {
                throw new Error(
                    'El servidor no devolvió el mensaje correctamente.'
                );
            }

            desplazarAlFinalRef.current = true;

            const combinados = combinarMensajes(
                mensajesRef.current,
                [mensajeCreado]
            );

            mensajesRef.current = combinados;
            setMensajes(combinados);
            setTexto('');

            requestAnimationFrame(() => {
                listaRef.current?.scrollToEnd({
                    animated: true,
                });
            });
        } catch (e) {
            const errorApi = e?.response?.data;

            const erroresValidacion =
                errorApi?.validation_errors;

            const primerError = erroresValidacion
                ? Object.values(erroresValidacion)
                    .flat()
                    .find((mensaje) => typeof mensaje === 'string')
                : null;

            const mensajeError =
                primerError ||
                errorApi?.message ||
                errorApi?.error ||
                e?.message ||
                'No se pudo enviar el mensaje. Intentá nuevamente.';

            setError(String(mensajeError));
        } finally {
            setSending(false);
        }
    };


    const manejarContenido = (ancho, alto) => {
        if (mantenerPosicionRef.current) {
            const desplazamiento = Math.max(
                0,
                alto - alturaContenidoRef.current
            );

            mantenerPosicionRef.current = false;
            alturaContenidoRef.current = alto;

            requestAnimationFrame(() => {
                listaRef.current?.scrollToOffset({
                    offset: desplazamiento,
                    animated: false,
                });
            });

            return;
        }

        alturaContenidoRef.current = alto;

        if (desplazarAlFinalRef.current) {
            desplazarAlFinalRef.current = false;

            requestAnimationFrame(() => {
                listaRef.current?.scrollToEnd({
                    animated: false,
                });
            });
        }
    };

    const propiedad = consulta?.propiedad;
    const usuarioConsulta = consulta?.usuario;
    const propietario = propiedad?.usuario;

    const esSolicitante =
        Number(usuarioActual?.id) ===
        Number(consulta?.usuario_id);

    const contacto = esSolicitante
        ? propietario
        : usuarioConsulta;

    const nombreContacto =
        obtenerNombre(contacto) ||
        'Conversación';

    if (loading) {
        return (
            <View style={styles.centrado}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.textoSecundario}>
                    Cargando conversación...
                </Text>
            </View>
        );
    }

    if (!consulta || !usuarioActual) {
        return (
            <View style={styles.pantallaError}>
                <Pressable
                    onPress={volver}
                    style={styles.botonVolver}
                >
                    <Text style={styles.textoVolver}>
                        ‹ Volver
                    </Text>
                </Pressable>

                <Text style={styles.errorTexto}>
                    {error || 'No se pudo abrir el chat.'}
                </Text>

                <Pressable
                    onPress={cargarInicial}
                    style={styles.botonReintentar}
                >
                    <Text style={styles.textoBotonEnviar}>
                        Reintentar
                    </Text>
                </Pressable>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={styles.header}>
                <Pressable
                    onPress={volver}
                    hitSlop={12}
                    style={styles.volver}
                >
                    <Text style={styles.flecha}>
                        ‹
                    </Text>
                </Pressable>

                <View style={styles.headerInfo}>
                    <Text
                        style={styles.nombreContacto}
                        numberOfLines={1}
                    >
                        {nombreContacto}
                    </Text>

                    <Text
                        style={styles.tituloPropiedad}
                        numberOfLines={1}
                    >
                        {propiedad?.titulo ||
                            propiedad?.nombre ||
                            'Consulta sobre una propiedad'}
                    </Text>
                </View>
            </View>

            {error ? (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorTexto}>
                        {error}
                    </Text>

                    <Pressable
                        onPress={() => setError('')}
                        hitSlop={8}
                    >
                        <Text style={styles.cerrarError}>
                            ×
                        </Text>
                    </Pressable>
                </View>
            ) : null}

            <FlatList
                ref={listaRef}
                style={styles.lista}
                contentContainerStyle={styles.listaContenido}
                data={mensajes}
                keyExtractor={(item) =>
                    String(item.id)
                }
                onContentSizeChange={manejarContenido}
                onScroll={(evento) => {
                    const {
                        contentOffset,
                        contentSize,
                        layoutMeasurement,
                    } = evento.nativeEvent;

                    cercaDelFinalRef.current =
                        layoutMeasurement.height +
                        contentOffset.y >=
                        contentSize.height - 100;
                }}
                scrollEventThrottle={16}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                    hayAnteriores ? (
                        <Pressable
                            onPress={cargarAnteriores}
                            disabled={loadingOlder}
                            style={styles.botonAnteriores}
                        >
                            {loadingOlder ? (
                                <ActivityIndicator
                                    size="small"
                                    color={theme.colors.primary}
                                />
                            ) : (
                                <Text
                                    style={styles.textoAnteriores}
                                >
                                    Cargar mensajes anteriores
                                </Text>
                            )}
                        </Pressable>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.vacio}>
                        <Text style={styles.textoVacio}>
                            Todavía no hay mensajes.
                        </Text>

                        <Text style={styles.textoSecundario}>
                            ¡Podés iniciar la conversación!
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const esPropio =
                        Number(item.usuario_id) ===
                        Number(usuarioActual.id);

                    return (
                        <View
                            style={[
                                styles.filaMensaje,
                                esPropio
                                    ? styles.filaPropia
                                    : styles.filaAjena,
                            ]}
                        >
                            <View
                                style={[
                                    styles.burbuja,
                                    esPropio
                                        ? styles.burbujaPropia
                                        : styles.burbujaAjena,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.mensajeTexto,
                                        esPropio
                                            ? styles.mensajePropioTexto
                                            : styles.mensajeAjenoTexto,
                                    ]}
                                >
                                    {item.mensaje}
                                </Text>

                                <Text
                                    style={[
                                        styles.fechaMensaje,
                                        esPropio
                                            ? styles.fechaPropia
                                            : styles.fechaAjena,
                                    ]}
                                >
                                    {item.fecha_mensaje
                                        ? new Date(
                                            item.fecha_mensaje
                                        ).toLocaleTimeString(
                                            'es-AR',
                                            {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }
                                        )
                                        : ''}
                                </Text>
                            </View>
                        </View>
                    );
                }}
            />

            <View
                style={[
                    styles.compositor,
                    {
                        paddingBottom: Math.max(
                            theme.spacing.sm,
                            insets.bottom
                        ),
                    },
                ]}
            >
                <TextInput
                    style={styles.input}
                    value={texto}
                    onChangeText={setTexto}
                    placeholder="Escribí un mensaje..."
                    placeholderTextColor={
                        theme.colors.textMuted
                    }
                    multiline
                    maxLength={2000}
                    editable={!sending}
                    onSubmitEditing={() => {
                        if (Platform.OS === 'ios') {
                            enviar();
                        }
                    }}
                />

                <Pressable
                    onPress={enviar}
                    disabled={!texto.trim() || sending}
                    style={[
                        styles.botonEnviar,
                        (
                            !texto.trim() ||
                            sending
                        ) && styles.botonEnviarDeshabilitado,
                    ]}
                >
                    {sending ? (
                        <ActivityIndicator
                            size="small"
                            color="#ffffff"
                        />
                    ) : (
                        <Text style={styles.textoBotonEnviar}>
                            Enviar
                        </Text>
                    )}
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    centrado: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },

    pantallaError: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
    },

    textoSecundario: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 14,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.inputBg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },

    volver: {
        width: 40,
        height: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },

    flecha: {
        fontSize: 36,
        lineHeight: 40,
        color: theme.colors.primary,
    },

    headerInfo: {
        flex: 1,
        marginLeft: theme.spacing.sm,
    },

    nombreContacto: {
        color: theme.colors.textDark,
        fontSize: 16,
        fontWeight: '700',
    },

    tituloPropiedad: {
        marginTop: 3,
        color: theme.colors.textMuted,
        fontSize: 13,
    },

    lista: {
        flex: 1,
    },

    listaContenido: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        flexGrow: 1,
    },

    botonAnteriores: {
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40,
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },

    textoAnteriores: {
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },

    vacio: {
        flex: 1,
        minHeight: 180,
        alignItems: 'center',
        justifyContent: 'center',
    },

    textoVacio: {
        color: theme.colors.textDark,
        fontSize: 16,
        fontWeight: '600',
    },

    filaMensaje: {
        width: '100%',
        marginBottom: theme.spacing.sm,
        flexDirection: 'row',
    },

    filaPropia: {
        justifyContent: 'flex-end',
    },

    filaAjena: {
        justifyContent: 'flex-start',
    },

    burbuja: {
        maxWidth: '82%',
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        paddingBottom: 6,
        borderRadius: 16,
    },

    burbujaPropia: {
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
    },

    burbujaAjena: {
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderBottomLeftRadius: 4,
    },

    mensajeTexto: {
        fontSize: 15,
        lineHeight: 21,
    },

    mensajePropioTexto: {
        color: '#ffffff',
    },

    mensajeAjenoTexto: {
        color: theme.colors.textDark,
    },

    fechaMensaje: {
        alignSelf: 'flex-end',
        marginTop: 4,
        fontSize: 10,
    },

    fechaPropia: {
        color: '#eeeeee',
    },

    fechaAjena: {
        color: theme.colors.textMuted,
    },

    compositor: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.inputBg,
        gap: theme.spacing.sm,
    },

    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 22,
        color: theme.colors.textDark,
        fontSize: 15,
        backgroundColor: theme.colors.background,
    },

    botonEnviar: {
        minHeight: 44,
        paddingHorizontal: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: theme.colors.primary,
    },

    botonEnviarDeshabilitado: {
        opacity: 0.5,
    },

    textoBotonEnviar: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },

    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.errorBg,
    },

    errorTexto: {
        flex: 1,
        color: theme.colors.errorText,
        fontSize: 13,
        textAlign: 'center',
    },

    cerrarError: {
        marginLeft: theme.spacing.sm,
        color: theme.colors.errorText,
        fontSize: 22,
    },

    botonVolver: {
        padding: theme.spacing.md,
    },

    textoVolver: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },

    botonReintentar: {
        marginTop: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
    },
});