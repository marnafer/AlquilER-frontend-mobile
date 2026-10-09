import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import {
    useCallback,
    useState,
} from 'react';

import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useLayout } from '../context/LayoutContext';
import {
    aprobarReserva,
    cancelarReserva,
    finalizarReserva,
    obtenerPerfil,
    obtenerResenasByReserva,
    obtenerReserva,
    rechazarReserva,
} from '../services/api';
import { theme } from '../theme/theme';
import {
    construirUrlImagen,
    extraerItems,
    formatearFechaHora,
    soloDia,
} from '../utils/formato';

const ESTADO_INFO = {
    pendiente: { etiqueta: 'Pendiente', color: theme.colors.warningText, bg: theme.colors.warningBg },
    confirmada: { etiqueta: 'Confirmada', color: theme.colors.successText, bg: theme.colors.successBg },
    rechazada: { etiqueta: 'Rechazada', color: theme.colors.errorText, bg: theme.colors.errorBg },
    cancelada: { etiqueta: 'Cancelada', color: theme.colors.neutralText, bg: theme.colors.neutralBorder },
    finalizada: { etiqueta: 'Finalizada', color: theme.colors.finalizedText, bg: theme.colors.finalizedBg },
};

export default function ReservaDetalleScreen() {
    const { id } = useLocalSearchParams();

    const router = useRouter();
    const { bottomNavigationHeight } = useLayout();

    const [loading, setLoading] = useState(true);
    const [accionando, setAccionando] = useState(false);
    const [reserva, setReserva] = useState(null);
    const [resenas, setResenas] = useState([]);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    const cargar = useCallback(async () => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setMensaje({ tipo: '', texto: '' });

        try {
            const res = await obtenerReserva(id);

            if (res.success) {
                setReserva(res.data);

                const rRes = await obtenerResenasByReserva(id);

                setResenas(extraerItems(rRes));
            } else {
                setMensaje({
                    tipo: 'error',
                    texto:
                        res.message ||
                        'No se pudo cargar la reserva.',
                });
            }
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: 'Error de conexión al cargar la reserva.',
            });
        } finally {
            setLoading(false);
        }
    }, [id]);

    const ejecutarAccion = async (accion) => {
        setAccionando(true);

        let result;

        try {
            if (accion === 'aprobar') {
                result = await aprobarReserva(reserva.id);
            } else if (accion === 'rechazar') {
                result = await rechazarReserva(reserva.id);
            } else if (accion === 'finalizar') {
                result = await finalizarReserva(reserva.id);
            } else if (accion === 'cancelar') {
                result = await cancelarReserva(reserva.id);
            }

            if (result?.success) {
                setMensaje({
                    tipo: 'exito',
                    texto:
                        result.message ||
                        'Reserva actualizada correctamente.',
                });

                await cargar();
            } else {
                setMensaje({
                    tipo: 'error',
                    texto:
                        result?.message ||
                        'No se pudo actualizar la reserva.',
                });
            }
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: 'Error de conexión.',
            });
        } finally {
            setAccionando(false);
        }
    };

    const confirmarAccion = (accion, titulo) => {
        if (typeof window !== 'undefined' && window.confirm) {
            if (!window.confirm(titulo)) return;
        }

        ejecutarAccion(accion);
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Cargando reserva...
                </Text>
            </View>
        );
    }

    if (!reserva) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>
                    No se pudo cargar la reserva.
                </Text>
            </View>
        );
    }

    const propiedad =
        reserva.propiedad || reserva.propiedad_obj || null;

    const inquilino =
        reserva.usuario || reserva.inquilino || null;

    const propietario = propiedad?.usuario || null;

    const info =
        ESTADO_INFO[reserva.estado] || {
            etiqueta: reserva.estado,
            color: theme.colors.neutralText,
            bg: theme.colors.neutralBg,
        };

    const vencida =
        reserva.estado === 'confirmada' &&
        soloDia(reserva.fecha_fin_alquiler) <
            new Date().toISOString().slice(0, 10);

    const puedeAprobar =
        propietario && reserva.estado === 'pendiente';

    const puedeRechazar =
        propietario && reserva.estado === 'pendiente';

    const puedeFinalizar =
        propietario && reserva.estado === 'confirmada';

    const puedeCancelar = ['pendiente', 'confirmada'].includes(
        reserva.estado
    );

    const img = construirUrlImagen(
        propiedad?.imagen_url ||
            propiedad?.imagen_principal?.ruta ||
            propiedad?.imagenes?.[0]?.ruta ||
            null
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{
                paddingBottom:
                    bottomNavigationHeight + theme.spacing.lg,
            }}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    Reserva #{reserva.id}
                </Text>

                <Text style={styles.headerSubtitle}>
                    Seguimiento completo del estado, fechas y
                    participantes.
                </Text>

                <View style={styles.headerBadges}>
                    <Text
                        style={[
                            styles.badge,
                            {
                                color: info.color,
                                backgroundColor: info.bg,
                            },
                        ]}
                    >
                        {info.etiqueta}
                    </Text>

                    {vencida ? (
                        <Text
                            style={[styles.badge, styles.badgeVencida]}
                        >
                            Vencida (sin finalizar)
                        </Text>
                    ) : null}
                </View>

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
            </View>

            <View style={styles.body}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        Información general
                    </Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Desde</Text>
                        <Text style={styles.infoValue}>
                            {soloDia(reserva.fecha_inicio_alquiler)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Hasta</Text>
                        <Text style={styles.infoValue}>
                            {soloDia(reserva.fecha_fin_alquiler)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Creada</Text>
                        <Text style={styles.infoValue}>
                            {formatearFechaHora(reserva.created_at)}
                        </Text>
                    </View>

                    {reserva.fecha_confirmacion ? (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>
                                Confirmada
                            </Text>
                            <Text style={styles.infoValue}>
                                {formatearFechaHora(
                                    reserva.fecha_confirmacion
                                )}
                            </Text>
                        </View>
                    ) : null}

                    {reserva.usuario_id ? (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>
                                Inquilino ID
                            </Text>
                            <Text style={styles.infoValue}>
                                #{reserva.usuario_id}
                            </Text>
                        </View>
                    ) : null}

                    {puedeAprobar ||
                    puedeRechazar ||
                    puedeFinalizar ||
                    puedeCancelar ? (
                        <View style={styles.acciones}>
                            {puedeAprobar ? (
                                <TouchableOpacity
                                    style={[
                                        styles.boton,
                                        styles.botonPrimario,
                                    ]}
                                    onPress={() =>
                                        confirmarAccion(
                                            'aprobar',
                                            '¿Aprobar solicitud?'
                                        )
                                    }
                                    disabled={accionando}
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={
                                            styles.botonPrimarioText
                                        }
                                    >
                                        Aprobar
                                    </Text>
                                </TouchableOpacity>
                            ) : null}

                            {puedeFinalizar ? (
                                <TouchableOpacity
                                    style={[
                                        styles.boton,
                                        styles.botonPrimario,
                                    ]}
                                    onPress={() =>
                                        confirmarAccion(
                                            'finalizar',
                                            vencida
                                                ? '¿Finalizar reserva vencida?'
                                                : '¿Finalizar reserva?'
                                        )
                                    }
                                    disabled={accionando}
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={
                                            styles.botonPrimarioText
                                        }
                                    >
                                        {vencida
                                            ? 'Finalizar (vencida)'
                                            : 'Finalizar'}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}

                            {puedeRechazar ? (
                                <TouchableOpacity
                                    style={[
                                        styles.boton,
                                        styles.botonDanger,
                                    ]}
                                    onPress={() =>
                                        confirmarAccion(
                                            'rechazar',
                                            '¿Rechazar solicitud? El inquilino recibirá el rechazo.'
                                        )
                                    }
                                    disabled={accionando}
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={
                                            styles.botonDangerText
                                        }
                                    >
                                        Rechazar
                                    </Text>
                                </TouchableOpacity>
                            ) : null}

                            {puedeCancelar ? (
                                <TouchableOpacity
                                    style={[
                                        styles.boton,
                                        styles.botonSecundario,
                                    ]}
                                    onPress={() =>
                                        confirmarAccion(
                                            'cancelar',
                                            '¿Cancelar esta reserva?'
                                        )
                                    }
                                    disabled={accionando}
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={
                                            styles.botonSecundarioText
                                        }
                                    >
                                        Cancelar
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    ) : null}
                </View>

                {propiedad ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            Propiedad
                        </Text>

                        <TouchableOpacity
                            style={styles.propiedadRow}
                            onPress={() =>
                                router.push(
                                    `/propiedad/${propiedad.id}`
                                )
                            }
                            activeOpacity={0.8}
                        >
                            {img ? (
                                <Image
                                    source={{ uri: img }}
                                    style={styles.propiedadImg}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.propiedadImgPlaceholder}>
                                    <Text style={styles.propImgIcon}>
                                        🏠
                                    </Text>
                                </View>
                            )}

                            <View style={styles.propiedadInfo}>
                                <Text
                                    style={styles.propiedadTitulo}
                                    numberOfLines={1}
                                >
                                    {propiedad.titulo || '—'}
                                </Text>

                                {propiedad.direccion ? (
                                    <Text
                                        style={styles.propiedadDireccion}
                                    >
                                        {propiedad.direccion}
                                    </Text>
                                ) : null}

                                <Text style={styles.verPropiedad}>
                                    Ver propiedad ›
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        Participantes
                    </Text>

                    {inquilino ? (
                        <View style={styles.participante}>
                            <Text style={styles.participanteRol}>
                                Inquilino
                            </Text>
                            <Text style={styles.participanteNombre}>
                                {[inquilino.nombre, inquilino.apellido]
                                    .filter(Boolean)
                                    .join(' ') || `#${inquilino.id}`}
                            </Text>
                            {inquilino.email ? (
                                <Text style={styles.participanteDetalle}>
                                    📧 {inquilino.email}
                                </Text>
                            ) : null}
                            {inquilino.telefono ? (
                                <Text style={styles.participanteDetalle}>
                                    📞 {inquilino.telefono}
                                </Text>
                            ) : null}
                        </View>
                    ) : null}

                    {propietario ? (
                        <View
                            style={[
                                styles.participante,
                                styles.participanteBorde,
                            ]}
                        >
                            <Text style={styles.participanteRol}>
                                Propietario
                            </Text>
                            <Text style={styles.participanteNombre}>
                                {[propietario.nombre, propietario.apellido]
                                    .filter(Boolean)
                                    .join(' ') || `#${propietario.id}`}
                            </Text>
                            {propietario.email ? (
                                <Text style={styles.participanteDetalle}>
                                    📧 {propietario.email}
                                </Text>
                            ) : null}
                            {propietario.telefono ? (
                                <Text style={styles.participanteDetalle}>
                                    📞 {propietario.telefono}
                                </Text>
                            ) : null}
                        </View>
                    ) : null}
                </View>

                {resenas.length > 0 ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            Reseñas asociadas
                        </Text>

                        {resenas.map((r) => (
                            <View
                                key={r.id}
                                style={styles.resena}
                            >
                                <View style={styles.resenaHeader}>
                                    <Text style={styles.resenaStars}>
                                        {'★'.repeat(
                                            Math.max(
                                                0,
                                                Math.min(
                                                    5,
                                                    Number(r.calificacion) ||
                                                        0
                                                )
                                            )
                                        )}
                                        {'☆'.repeat(
                                            Math.max(
                                                0,
                                                5 -
                                                    Math.min(
                                                        5,
                                                        Number(
                                                            r.calificacion
                                                        ) || 0
                                                    )
                                            )
                                        )}
                                    </Text>

                                    <Text style={styles.resenaFecha}>
                                        {formatearFechaHora(
                                            r.created_at
                                        )}
                                    </Text>
                                </View>

                                <Text style={styles.resenaTipo}>
                                    Tipo: {r.tipo} · Calificador #
                                    {r.calificador_id}
                                </Text>

                                {r.comentario ? (
                                    <Text style={styles.resenaComentario}>
                                        {r.comentario}
                                    </Text>
                                ) : null}
                            </View>
                        ))}
                    </View>
                ) : null}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
    },

    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 14,
    },

    errorText: {
        color: theme.colors.textDark,
        fontSize: 16,
        textAlign: 'center',
    },

    header: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
        backgroundColor: theme.colors.primary,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },

    headerTitle: {
        color: theme.colors.white,
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },

    headerSubtitle: {
        marginTop: theme.spacing.sm,
        color: theme.colors.white,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        opacity: 0.9,
    },

    headerBadges: {
        marginTop: theme.spacing.md,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },

    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: '700',
        overflow: 'hidden',
    },

    badgeVencida: {
        color: theme.colors.warningText,
        backgroundColor: theme.colors.warningBg,
        borderWidth: 1,
        borderColor: theme.colors.warningBorder,
    },

    messageBox: {
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

    body: {
        padding: theme.spacing.md,
        gap: theme.spacing.md,
    },

    card: {
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
    },

    cardTitle: {
        color: theme.colors.textDark,
        fontSize: 17,
        fontWeight: '700',
        marginBottom: theme.spacing.md,
    },

    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },

    infoLabel: {
        color: theme.colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },

    infoValue: {
        color: theme.colors.textDark,
        fontSize: 14,
    },

    acciones: {
        marginTop: theme.spacing.md,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },

    boton: {
        minHeight: 42,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        borderWidth: 1,
    },

    botonPrimario: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },

    botonPrimarioText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },

    botonDanger: {
        backgroundColor: theme.colors.errorText,
        borderColor: theme.colors.errorText,
    },

    botonDangerText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },

    botonSecundario: {
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.border,
    },

    botonSecundarioText: {
        color: theme.colors.textDark,
        fontSize: 14,
        fontWeight: '600',
    },

    propiedadRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },

    propiedadImg: {
        width: 90,
        height: 68,
        borderRadius: 10,
    },

    propiedadImgPlaceholder: {
        width: 90,
        height: 68,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.border,
    },

    propImgIcon: {
        fontSize: 26,
    },

    propiedadInfo: {
        flex: 1,
        minWidth: 0,
    },

    propiedadTitulo: {
        color: theme.colors.textDark,
        fontSize: 15,
        fontWeight: '700',
    },

    propiedadDireccion: {
        marginTop: 2,
        color: theme.colors.textMuted,
        fontSize: 13,
    },

    verPropiedad: {
        marginTop: 6,
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },

    participante: {
        gap: 3,
    },

    participanteBorde: {
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },

    participanteRol: {
        color: theme.colors.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },

    participanteNombre: {
        color: theme.colors.textDark,
        fontSize: 15,
        fontWeight: '700',
    },

    participanteDetalle: {
        color: theme.colors.textMuted,
        fontSize: 13,
    },

    resena: {
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        marginBottom: theme.spacing.sm,
    },

    resenaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    resenaStars: {
        color: '#f59e0b',
        fontSize: 13,
    },

    resenaFecha: {
        color: theme.colors.textMuted,
        fontSize: 12,
    },

    resenaTipo: {
        marginTop: 6,
        color: theme.colors.neutralText,
        fontSize: 13,
    },

    resenaComentario: {
        marginTop: 6,
        color: theme.colors.textDark,
        fontSize: 13,
        lineHeight: 19,
    },
});