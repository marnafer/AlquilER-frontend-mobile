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
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import {
    marcarNotificacionLeida,
    marcarTodasNotificacionesLeidas,
    obtenerNotificaciones,
} from '../services/api';
import { theme } from '../theme/theme';
import { extraerItems } from '../utils/formato';

const ICONOS_POR_TIPO = {
    reserva_confirmada: '✓',
    reserva_rechazada: '✕',
    reserva_nueva: '📅',
    consulta_nueva: '💬',
    mensaje_nuevo: '✉️',
};

const POR_PAGINA = 8;

export default function NotificationsScreen() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [marcandoId, setMarcandoId] = useState(null);
    const [marcandoTodas, setMarcandoTodas] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
    const [pagina, setPagina] = useState(1);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        setMensaje({ tipo: '', texto: '' });

        const res = await obtenerNotificaciones();

        if (res.success) {
            setItems(extraerItems(res));
            setPagina(1);
        } else {
            setError(
                res.error ||
                res.message ||
                    'No se pudieron cargar las notificaciones.'
            );
        }

        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [cargar])
    );

    const marcarLeida = async (id) => {
        setMarcandoId(id);

        const res = await marcarNotificacionLeida(id);

        if (res.success) {
            setItems((prev) =>
                prev.map((n) =>
                    n.id === id ? { ...n, leida: true } : n
                )
            );
        } else {
            setMensaje({
                tipo: 'error',
                texto:
                    res.error ||
                    res.message ||
                    'No se pudo marcar como leída',
            });
        }

        setMarcandoId(null);
    };

    const marcarTodas = async () => {
        setMarcandoTodas(true);

        const res = await marcarTodasNotificacionesLeidas();

        if (res.success) {
            setItems((prev) =>
                prev.map((n) => ({ ...n, leida: true }))
            );

            setMensaje({
                tipo: 'exito',
                texto: 'Todas las notificaciones marcadas como leídas',
            });
        } else {
            setMensaje({
                tipo: 'error',
                texto:
                    res.error ||
                    res.message ||
                    'No se pudieron marcar como leídas',
            });
        }

        setMarcandoTodas(false);
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '';

        const d = new Date(fecha);

        return d.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Cargando notificaciones...
                </Text>
            </View>
        );
    }

    const noLeidas = items.filter((n) => !n.leida).length;
    const totalPaginas = Math.max(1, Math.ceil(items.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const itemsVisibles = items.slice(
        (paginaActual - 1) * POR_PAGINA,
        paginaActual * POR_PAGINA
    );
    const inicioPaginas = Math.max(
        1,
        Math.min(paginaActual - 3, totalPaginas - 6)
    );
    const paginasVisibles = Array.from(
        { length: Math.min(7, totalPaginas) },
        (_, indice) => inicioPaginas + indice
    );
    const irAPagina = (nuevaPagina) => {
        setPagina(Math.min(Math.max(1, nuevaPagina), totalPaginas));
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <ScreenHeader
                title="Notificaciones"
                subtitle="Consultá los avisos sobre tus reservas, consultas y mensajes."
            />

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

            {mensaje.texto ? (
                <View
                    style={[
                        styles.messageBox,
                        mensaje.tipo === 'error'
                            ? styles.messageError
                            : styles.messageExito,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            mensaje.tipo === 'error'
                                ? styles.messageTextError
                                : styles.messageTextExito,
                        ]}
                    >
                        {mensaje.texto}
                    </Text>
                </View>
            ) : null}

            {items.length > 0 ? (
                <>
                    <View style={styles.toolbar}>
                        <Text style={styles.resumen}>
                            {noLeidas > 0
                                ? `${noLeidas} sin leer de ${items.length}`
                                : 'Todas leídas'}
                        </Text>

                        {noLeidas > 0 ? (
                            <TouchableOpacity
                                style={styles.notaTodasButton}
                                onPress={marcarTodas}
                                disabled={marcandoTodas}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={styles.notaTodasText}
                                >
                                    {marcandoTodas
                                        ? 'Marcando...'
                                        : 'Marcar todas leídas'}
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    <View style={styles.lista}>
                        {itemsVisibles.map((n) => (
                            <View
                                key={n.id}
                                style={[
                                    styles.item,
                                    !n.leida && styles.itemNoLeida,
                                ]}
                            >
                                <View style={styles.itemIcon}>
                                    <Text style={styles.itemIconText}>
                                        {ICONOS_POR_TIPO[n.tipo] || '🔔'}
                                    </Text>

                                    {!n.leida ? (
                                        <View style={styles.dot} />
                                    ) : null}
                                </View>

                                <View style={styles.itemBody}>
                                    <Text style={styles.itemTitulo}>
                                        {n.titulo}
                                    </Text>

                                    {n.mensaje ? (
                                        <Text style={styles.itemMensaje}>
                                            {n.mensaje}
                                        </Text>
                                    ) : null}

                                    <Text style={styles.itemFecha}>
                                        {formatearFecha(
                                            n.fecha_notificacion
                                        )}
                                    </Text>
                                </View>

                                {!n.leida ? (
                                    <TouchableOpacity
                                        style={styles.itemMarcar}
                                        onPress={() =>
                                            marcarLeida(n.id)
                                        }
                                        disabled={
                                            marcandoId === n.id
                                        }
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={
                                                styles.itemMarcarText
                                            }
                                        >
                                            {marcandoId === n.id
                                                ? '...'
                                                : '✓'}
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        ))}
                    </View>
                    {totalPaginas > 1 ? (
                        <View style={styles.paginacion}>
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Página anterior"
                                disabled={paginaActual === 1}
                                onPress={() => irAPagina(paginaActual - 1)}
                                style={[
                                    styles.botonPagina,
                                    paginaActual === 1 && styles.botonPaginaDeshabilitado,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.textoBotonPagina,
                                        paginaActual === 1 && styles.textoPaginaDeshabilitado,
                                    ]}
                                >
                                    Anterior
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.numerosPagina}>
                                {paginasVisibles.map((numero) => {
                                    const activa = numero === paginaActual;
                                    return (
                                        <TouchableOpacity
                                            key={numero}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Página ${numero}`}
                                            accessibilityState={{ selected: activa }}
                                            onPress={() => irAPagina(numero)}
                                            style={[
                                                styles.numeroPagina,
                                                activa && styles.numeroPaginaActivo,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.textoNumeroPagina,
                                                    activa && styles.textoNumeroPaginaActivo,
                                                ]}
                                            >
                                                {numero}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Página siguiente"
                                disabled={paginaActual === totalPaginas}
                                onPress={() => irAPagina(paginaActual + 1)}
                                style={[
                                    styles.botonPagina,
                                    paginaActual === totalPaginas &&
                                        styles.botonPaginaDeshabilitado,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.textoBotonPagina,
                                        paginaActual === totalPaginas &&
                                            styles.textoPaginaDeshabilitado,
                                    ]}
                                >
                                    Siguiente
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>
                        🔕
                    </Text>

                    <Text style={styles.emptyTitle}>
                        Todavía no tenés notificaciones
                    </Text>

                    <Text style={styles.emptyText}>
                        Recibirás avisos cuando te confirmen o
                        rechacen una reserva, cuando te consulten
                        por una propiedad o cuando recibas un
                        mensaje nuevo.
                    </Text>
                </View>
            )}
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
        textAlign: 'center',
        fontWeight: '600',
    },

    messageTextError: {
        color: theme.colors.errorText,
    },

    messageTextExito: {
        color: theme.colors.successText,
    },

    toolbar: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    resumen: {
        color: theme.colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },

    notaTodasButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
    },

    notaTodasText: {
        color: theme.colors.white,
        fontSize: 13,
        fontWeight: '700',
    },

    lista: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },

    paginacion: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
    },

    numerosPagina: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 4,
    },

    botonPagina: {
        minHeight: 38,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 9,
        backgroundColor: theme.colors.background,
    },

    botonPaginaDeshabilitado: {
        opacity: 0.45,
    },

    textoBotonPagina: {
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },

    textoPaginaDeshabilitado: {
        color: theme.colors.textMuted,
    },

    numeroPagina: {
        width: 36,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 9,
        backgroundColor: theme.colors.background,
    },

    numeroPaginaActivo: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary,
    },

    textoNumeroPagina: {
        color: theme.colors.textDark,
        fontSize: 13,
        fontWeight: '600',
    },

    textoNumeroPaginaActivo: {
        color: theme.colors.white,
    },

    item: {
        minHeight: 76,
        padding: theme.spacing.md,
        borderRadius: 14,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    itemNoLeida: {
        backgroundColor: theme.colors.primaryBg,
        borderColor: theme.colors.primarySoft,
    },

    itemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        position: 'relative',
    },

    itemIconText: {
        fontSize: 18,
    },

    dot: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
    },

    itemBody: {
        flex: 1,
        marginLeft: theme.spacing.md,
        minWidth: 0,
    },

    itemTitulo: {
        color: theme.colors.textDark,
        fontSize: 15,
        fontWeight: '700',
    },

    itemMensaje: {
        marginTop: 3,
        color: theme.colors.textMuted,
        fontSize: 13,
        lineHeight: 18,
    },

    itemFecha: {
        marginTop: 6,
        color: theme.colors.textMuted,
        fontSize: 11,
    },

    itemMarcar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        marginLeft: theme.spacing.sm,
    },

    itemMarcarText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },

    emptyContainer: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
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

    emptyText: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
});