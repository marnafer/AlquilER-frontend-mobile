import {
    useFocusEffect,
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
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import PropertySelect from '../components/PropertySelect';
import ScreenHeader from '../components/ScreenHeader';
import {
    eliminarRecurso,
    enviarMensajeConsulta,
    obtenerMensajesConsulta,
    obtenerPerfil,
    obtenerRecurso,
    restaurarRecurso,
} from '../services/api';
import { theme } from '../theme/theme';
import { extraerItems } from '../utils/formato';

const formatearFecha = (fecha) => {
    if (!fecha) return '';

    return String(fecha).replace('T', ' ').slice(0, 16);
};

const nombreDe = (m) => {
    if (!m) return 'Usuario';

    return (
        m.nombre ||
        m.apellido ||
        m.email ||
        m.usuario_nombre ||
        'Usuario'
    );
};

export default function AdminConsultasScreen() {
    const [autorizado, setAutorizado] = useState(false);
    const [verificando, setVerificando] = useState(true);
    const [usuarioId, setUsuarioId] = useState(null);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    const [papelera, setPapelera] = useState(false);

    const [usuarios, setUsuarios] = useState([]);
    const [usuarioFiltro, setUsuarioFiltro] = useState('');

    const [activa, setActiva] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [cargandoMensajes, setCargandoMensajes] =
        useState(false);

    const [respuesta, setRespuesta] = useState('');
    const [enviandoRespuesta, setEnviandoRespuesta] =
        useState(false);
    const [errorRespuesta, setErrorRespuesta] = useState('');
    const [exitoRespuesta, setExitoRespuesta] = useState('');

    const [procesandoId, setProcesandoId] = useState(null);

    const verificarAcceso = useCallback(async () => {
        setVerificando(true);

        const res = await obtenerPerfil();

        if (res.success) {
            const rol =
                res.data?.rol?.nombre ||
                res.data?.rol?.valor ||
                res.data?.rol?.id;

            setAutorizado(
                String(rol).toLowerCase() ===
                    'administrador' || String(rol) === '1'
            );

            setUsuarioId(res.data?.id ?? null);
        } else {
            setAutorizado(false);
        }

        setVerificando(false);
    }, []);

    const cargarUsuarios = useCallback(async () => {
        const res = await obtenerRecurso('/usuarios');

        setUsuarios(extraerItems(res));
    }, []);

    const cargar = useCallback(
        async () => {
            setLoading(true);
            setError('');
            setMensaje({ tipo: '', texto: '' });

            try {
                const res = usuarioFiltro
                    ? await obtenerRecurso(
                          `/consultas/usuario/${usuarioFiltro}`
                      )
                    : await obtenerRecurso('/admin/consultas', {
                          solo_eliminados: papelera ? 1 : 0,
                      });

                if (res?.success === false) {
                    setError(
                        res.message ||
                            'No se pudieron cargar las consultas.'
                    );
                } else {
                    setItems(extraerItems(res));
                }

                setActiva(null);
                setMensajes([]);
            } catch (err) {
                console.error(
                    'ADMIN CONSULTAS: error al cargar',
                    err
                );

                setError(
                    'Error de conexión al cargar las consultas.'
                );
            } finally {
                setLoading(false);
            }
        },
        [usuarioFiltro, papelera]
    );

    useFocusEffect(
        useCallback(() => {
            verificarAcceso();
            cargarUsuarios();
        }, [verificarAcceso, cargarUsuarios])
    );

    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [cargar])
    );

    const abrirConsulta = async (item) => {
        setActiva(item);
        setRespuesta('');
        setErrorRespuesta('');
        setExitoRespuesta('');
        setCargandoMensajes(true);

        const res = await obtenerMensajesConsulta(item.id);

        setMensajes(extraerItems(res));
        setCargandoMensajes(false);
    };

    const responder = async () => {
        const texto = respuesta.trim();

        if (!texto) {
            setErrorRespuesta('El mensaje es requerido.');

            return;
        }

        if (texto.length < 5) {
            setErrorRespuesta(
                'El mensaje debe tener al menos 5 caracteres.'
            );

            return;
        }

        setEnviandoRespuesta(true);
        setErrorRespuesta('');
        setExitoRespuesta('');

        const resultado = await enviarMensajeConsulta(
            activa.id,
            texto
        );

        if (resultado?.success) {
            setRespuesta('');
            setExitoRespuesta(
                'Mensaje enviado correctamente.'
            );

            const res = await obtenerMensajesConsulta(
                activa.id
            );

            setMensajes(extraerItems(res));
        } else {
            setErrorRespuesta(
                resultado?.message ||
                    'No se pudo enviar el mensaje.'
            );
        }

        setEnviandoRespuesta(false);
    };

    const eliminar = async (item) => {
        if (
            typeof window !== 'undefined' &&
            window.confirm &&
            !window.confirm(
                `¿Eliminar la consulta #${item.id}? La conversación se moverá a la papelera.`
            )
        ) {
            return;
        }

        setProcesandoId(String(item.id));

        const resultado = await eliminarRecurso(
            '/consultas',
            item.id
        );

        setMensaje(
            resultado?.success
                ? {
                      tipo: 'exito',
                      texto: 'Consulta movida a la papelera.',
                  }
                : {
                      tipo: 'error',
                      texto:
                          resultado?.message ||
                          'No se pudo eliminar la consulta.',
                  }
        );

        setProcesandoId(null);
        cargar();
    };

    const restaurar = async (item) => {
        setProcesandoId(String(item.id));

        const resultado = await restaurarRecurso(
            '/consultas',
            item.id
        );

        setMensaje(
            resultado?.success
                ? { tipo: 'exito', texto: 'Consulta restaurada.' }
                : {
                      tipo: 'error',
                      texto:
                          resultado?.message ||
                          'No se pudo restaurar la consulta.',
                  }
        );

        setProcesandoId(null);
        cargar();
    };

    if (verificando) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Verificando acceso...
                </Text>
            </View>
        );
    }

    if (!autorizado) {
        return (
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <ScreenHeader
                    title="Panel de control"
                    subtitle="Administración"
                />

                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        No tenés permisos de administración para
                        usar este módulo.
                    </Text>
                </View>
            </ScrollView>
        );
    }

    const esEliminada = Boolean(
        activa?.deleted_at || activa?.eliminado
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <ScreenHeader
                title="Consultas"
                subtitle="Leé las consultas de los interesados y respondé cada conversación."
            />

            <View style={styles.toolbar}>
                <View style={styles.filtroUsuario}>
                    <PropertySelect
                        label="Por usuario"
                        placeholder="Todos los usuarios"
                        options={usuarios.map((u) => ({
                            id: u.id,
                            nombre: `${u.nombre} ${u.apellido || ''}`.trim() +
                                ` (${u.email})`,
                        }))}
                        value={usuarioFiltro || null}
                        onChange={(v) => {
                            setUsuarioFiltro(v || '');
                            if (v) setPapelera(false);
                        }}
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.papeleraButton,
                        papelera && styles.papeleraButtonActivo,
                    ]}
                    onPress={() => setPapelera((v) => !v)}
                    disabled={Boolean(usuarioFiltro)}
                    activeOpacity={0.85}
                >
                    <Text
                        style={[
                            styles.papeleraButtonText,
                            papelera &&
                                styles.papeleraButtonTextActivo,
                        ]}
                    >
                        {papelera
                            ? 'Ver activas'
                            : '🗑️ Papelera'}
                    </Text>
                </TouchableOpacity>
            </View>

            {papelera ? (
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        Estás viendo la papelera. Las consultas
                        eliminadas aparecen acá y podés
                        restaurarlas.
                    </Text>
                </View>
            ) : null}

            {mensaje.texto ? (
                <View
                    style={[
                        styles.messageBox,
                        mensaje.tipo === 'error'
                            ? styles.messageError
                            : styles.messageExito,
                    ]}
                >
                    <Text style={styles.messageText}>
                        {mensaje.texto}
                    </Text>
                </View>
            ) : null}

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={cargar}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.retryButtonText}>
                            Reintentar
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {loading ? (
                <View style={styles.loadingSmall}>
                    <ActivityIndicator
                        size="large"
                        color={theme.colors.primary}
                    />
                </View>
            ) : items.length > 0 ? (
                <View style={styles.seccion}>
                    <Text style={styles.seccionTitulo}>
                        Conversaciones
                    </Text>

                    <View style={styles.lista}>
                        {items.map((c) => {
                            const activaEsta =
                                activa?.id === c.id;

                            const procesando =
                                procesandoId === String(c.id);

                            return (
                                <TouchableOpacity
                                    key={c.id}
                                    style={[
                                        styles.item,
                                        activaEsta &&
                                            styles.itemActivo,
                                    ]}
                                    onPress={() =>
                                        abrirConsulta(c)
                                    }
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.itemIcon}>
                                        <Text
                                            style={
                                                styles.itemIconText
                                            }
                                        >
                                            💬
                                        </Text>
                                    </View>

                                    <View
                                        style={styles.itemBody}
                                    >
                                        <View
                                            style={
                                                styles.itemHead
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.itemNumero
                                                }
                                            >
                                                #{c.id}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.itemFecha
                                                }
                                            >
                                                {formatearFecha(
                                                    c.fecha_consulta
                                                )}
                                            </Text>
                                        </View>

                                        <Text
                                            style={
                                                styles.itemTitulo
                                            }
                                            numberOfLines={1}
                                        >
                                            {c.propiedad?.titulo ||
                                                `Propiedad #${c.propiedad_id}`}
                                        </Text>

                                        <Text
                                            style={
                                                styles.itemDetalle
                                            }
                                            numberOfLines={1}
                                        >
                                            De {c.usuario
                                                ? `${c.usuario.nombre} ${c.usuario.apellido || ''}`.trim()
                                                : `Usuario #${c.usuario_id}`}
                                        </Text>
                                    </View>

                                    <View
                                        style={
                                            styles.itemAccion
                                        }
                                    >
                                        {papelera ? (
                                            <TouchableOpacity
                                                style={
                                                    styles.miniButton
                                                }
                                                onPress={() =>
                                                    restaurar(
                                                        c
                                                    )
                                                }
                                                disabled={
                                                    procesando
                                                }
                                                activeOpacity={
                                                    0.8
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.miniButtonText
                                                    }
                                                >
                                                    {procesando
                                                        ? '...'
                                                        : '♻️'}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                style={[
                                                    styles.miniButton,
                                                    styles.miniButtonEliminar,
                                                ]}
                                                onPress={() =>
                                                    eliminar(
                                                        c
                                                    )
                                                }
                                                disabled={
                                                    procesando
                                                }
                                                activeOpacity={
                                                    0.8
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        styles.miniButtonText,
                                                        styles.miniButtonTextEliminar,
                                                    ]}
                                                >
                                                    {procesando
                                                        ? '...'
                                                        : '🗑️'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>💬</Text>

                    <Text style={styles.emptyTitle}>
                        {papelera
                            ? 'La papelera está vacía'
                            : 'No hay consultas'}
                    </Text>
                </View>
            )}

            {activa ? (
                <View style={styles.hilo}>
                    <View style={styles.hiloCabecera}>
                        <Text style={styles.hiloTitulo}>
                            {activa.propiedad?.titulo ||
                                `Propiedad #${activa.propiedad_id}`}
                        </Text>

                        <Text style={styles.hiloSubtitulo}>
                            Consulta #{activa.id}
                        </Text>
                    </View>

                    {cargandoMensajes ? (
                        <View style={styles.hiloCargando}>
                            <ActivityIndicator
                                color={theme.colors.primary}
                            />

                            <Text style={styles.hiloCargandoText}>
                                Cargando conversación...
                            </Text>
                        </View>
                    ) : mensajes.length > 0 ? (
                        <View style={styles.mensajes}>
                            {mensajes.map((m) => {
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
                                                : styles.burbujaOtra,
                                        ]}
                                    >
                                        <View
                                            style={
                                                styles.burbujaHead
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.burbujaNombre,
                                                    esMio &&
                                                        styles.burbujaNombreMio,
                                                ]}
                                            >
                                                {esMio
                                                    ? 'Vos (Admin)'
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
                            })}
                        </View>
                    ) : (
                        <View style={styles.hiloVacio}>
                            <Text>
                                Sin mensajes todavía.
                            </Text>
                        </View>
                    )}

                    {esEliminada ? (
                        <View style={styles.hiloVacio}>
                            <Text>
                                Consulta eliminada: no se pueden
                                agregar mensajes.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.responder}>
                            <TextInput
                                style={[
                                    styles.respuestaInput,
                                    errorRespuesta &&
                                        styles.respuestaInputError,
                                ]}
                                placeholder="Responder como administrador..."
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                value={respuesta}
                                onChangeText={setRespuesta}
                                multiline
                            />

                            {errorRespuesta ? (
                                <Text style={styles.formError}>
                                    {errorRespuesta}
                                </Text>
                            ) : null}

                            {exitoRespuesta ? (
                                <Text style={styles.formExito}>
                                    ✓ {exitoRespuesta}
                                </Text>
                            ) : null}

                            <TouchableOpacity
                                style={[
                                    styles.enviarButton,
                                    enviandoRespuesta &&
                                        styles.enviarButtonDisabled,
                                ]}
                                onPress={responder}
                                disabled={enviandoRespuesta}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={styles.enviarButtonText}
                                >
                                    {enviandoRespuesta
                                        ? 'Enviando...'
                                        : 'Enviar respuesta'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            ) : null}
        </ScrollView>
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

    loadingSmall: {
        paddingVertical: theme.spacing.xl,
        alignItems: 'center',
    },

    toolbar: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },

    filtroUsuario: {
        marginBottom: 0,
    },

    papeleraButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.inputBg,
    },

    papeleraButtonActivo: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryBg,
    },

    papeleraButtonText: {
        color: theme.colors.textDark,
        fontSize: 13,
        fontWeight: '600',
    },

    papeleraButtonTextActivo: {
        color: theme.colors.primary,
    },

    infoBox: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.infoBg,
        borderWidth: 1,
        borderColor: theme.colors.finalizedBg,
    },

    infoText: {
        fontSize: 13,
        color: theme.colors.infoText,
        textAlign: 'center',
    },

    messageBox: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
    },

    messageError: {
        backgroundColor: theme.colors.errorBg,
    },

    messageExito: {
        backgroundColor: theme.colors.successBg,
    },

    messageText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        color: theme.colors.textDark,
    },

    errorBox: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.errorBg,
        alignItems: 'center',
    },

    errorText: {
        color: theme.colors.errorText,
        fontSize: 14,
        textAlign: 'center',
    },

    retryButton: {
        marginTop: theme.spacing.sm,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.errorText,
    },

    retryButtonText: {
        color: theme.colors.errorText,
        fontSize: 13,
        fontWeight: '600',
    },

    seccion: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
    },

    seccionTitulo: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.textDark,
        marginBottom: theme.spacing.sm,
    },

    lista: {
        gap: theme.spacing.sm,
    },

    item: {
        padding: theme.spacing.md,
        borderRadius: 14,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },

    itemActivo: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryBg,
    },

    itemIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },

    itemIconText: {
        fontSize: 18,
    },

    itemBody: {
        flex: 1,
        marginLeft: theme.spacing.md,
        minWidth: 0,
    },

    itemHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    itemNumero: {
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: '700',
    },

    itemFecha: {
        color: theme.colors.textMuted,
        fontSize: 11,
    },

    itemTitulo: {
        marginTop: 4,
        color: theme.colors.textDark,
        fontSize: 15,
        fontWeight: '700',
    },

    itemDetalle: {
        marginTop: 2,
        color: theme.colors.textMuted,
        fontSize: 13,
    },

    itemAccion: {
        marginLeft: theme.spacing.sm,
    },

    miniButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },

    miniButtonEliminar: {
        borderColor: theme.colors.errorText,
    },

    miniButtonText: {
        fontSize: 14,
    },

    miniButtonTextEliminar: {
        color: theme.colors.errorText,
    },

    emptyContainer: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        paddingVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },

    emptyIcon: {
        fontSize: 36,
        marginBottom: theme.spacing.sm,
    },

    emptyTitle: {
        color: theme.colors.textDark,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },

    hilo: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        padding: theme.spacing.md,
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    hiloCabecera: {
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },

    hiloTitulo: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textDark,
    },

    hiloSubtitulo: {
        marginTop: 2,
        fontSize: 12,
        color: theme.colors.textMuted,
    },

    hiloCargando: {
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
    },

    hiloCargandoText: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 13,
    },

    mensajes: {
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
    },

    burbuja: {
        padding: theme.spacing.md,
        borderRadius: 12,
        maxWidth: '92%',
    },

    burbujaMia: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
    },

    burbujaOtra: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    burbujaHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing.sm,
    },

    burbujaNombre: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.textDark,
    },

    burbujaNombreMio: {
        color: theme.colors.white,
    },

    burbujaFecha: {
        fontSize: 10,
        color: theme.colors.textMuted,
    },

    burbujaFechaMia: {
        color: 'rgba(255,255,255,0.85)',
    },

    burbujaTexto: {
        marginTop: 4,
        fontSize: 14,
        color: theme.colors.textDark,
        lineHeight: 19,
    },

    burbujaTextoMio: {
        color: theme.colors.white,
    },

    hiloVacio: {
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
    },

    hiloVacioText: {
        color: theme.colors.textMuted,
        fontSize: 13,
    },

    responder: {
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },

    respuestaInput: {
        minHeight: 70,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.background,
        paddingHorizontal: 12,
        paddingTop: 10,
        color: theme.colors.textDark,
        fontSize: 14,
        textAlignVertical: 'top',
    },

    respuestaInputError: {
        borderColor: theme.colors.errorText,
    },

    formError: {
        marginTop: 5,
        fontSize: 12,
        color: theme.colors.errorText,
    },

    formExito: {
        marginTop: 5,
        fontSize: 12,
        color: theme.colors.successText,
    },

    enviarButton: {
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.sm,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
    },

    enviarButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },

    enviarButtonText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
});