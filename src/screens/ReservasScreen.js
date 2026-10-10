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
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import {
    aprobarReserva,
    cancelarReserva,
    crearResena,
    finalizarReserva,
    obtenerPerfil,
    obtenerResenasByUsuario,
    obtenerReservas,
    rechazarReserva,
    separarReservas,
} from '../services/api';
import { theme } from '../theme/theme';
import {
    construirUrlImagen,
    extraerItems,
    soloDia,
} from '../utils/formato';

const ESTADOS = [
    { valor: 'todos', etiqueta: 'Todas' },
    { valor: 'pendiente', etiqueta: 'Pendientes' },
    { valor: 'confirmada', etiqueta: 'Confirmadas' },
    { valor: 'rechazada', etiqueta: 'Rechazadas' },
    { valor: 'cancelada', etiqueta: 'Canceladas' },
    { valor: 'finalizada', etiqueta: 'Finalizadas' },
];

const ESTADO_INFO = {
    pendiente: { etiqueta: 'Pendiente', color: theme.colors.warningText, bg: theme.colors.warningBg },
    confirmada: { etiqueta: 'Confirmada', color: theme.colors.successText, bg: theme.colors.successBg },
    rechazada: { etiqueta: 'Rechazada', color: theme.colors.errorText, bg: theme.colors.errorBg },
    cancelada: { etiqueta: 'Cancelada', color: theme.colors.neutralText, bg: theme.colors.neutralBorder },
    finalizada: { etiqueta: 'Finalizada', color: theme.colors.finalizedText, bg: theme.colors.finalizedBg },
};

const ORIGENES = [
    { valor: 'todos', etiqueta: 'Todas' },
    { valor: 'recibida', etiqueta: 'Recibidas en mis propiedades' },
    { valor: 'propia', etiqueta: 'Mis solicitudes' },
];

export default function ReservasScreen() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [reservas, setReservas] = useState([]);
    const [misResenasHechas, setMisResenasHechas] = useState([]);
    const [esGestion, setEsGestion] = useState(false);
    const [filtro, setFiltro] = useState('todos');
    const [filtroOrigen, setFiltroOrigen] = useState('todos');
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
    const [accionando, setAccionando] = useState(null);

    const [resenaActiva, setResenaActiva] = useState(null);
    const [calificacion, setCalificacion] = useState(0);
    const [comentario, setComentario] = useState('');
    const [enviandoResena, setEnviandoResena] = useState(false);
    const [errorResena, setErrorResena] = useState('');

    const cargarDatos = useCallback(async () => {
        try {
            setLoading(true);
            setMensaje({ tipo: '', texto: '' });

            const perfilRes = await obtenerPerfil();

            if (perfilRes?.success) {
                const hechasRes = await obtenerResenasByUsuario(
                    perfilRes.data.id
                );

                setMisResenasHechas(
                    extraerItems(hechasRes)
                );
            } else {
                setMisResenasHechas([]);
            }

            const { misReservas, reservasDeMisPropiedades } =
                separarReservas(
                    await obtenerReservas()
                );

            setEsGestion(reservasDeMisPropiedades.length > 0);

            const todas = [
                ...misReservas.map((r) => ({
                    ...r,
                    origen: 'propia',
                })),
                ...reservasDeMisPropiedades.map((r) => ({
                    ...r,
                    origen: 'recibida',
                })),
            ].sort((a, b) => String(b.id || 0).localeCompare(
                String(a.id || 0),
                undefined,
                { numeric: true }
            ));

            setReservas(todas);
        } catch (error) {
            console.error(
                'RESERVAS: error al cargar',
                error
            );

            setReservas([]);

            setMensaje({
                tipo: 'error',
                texto: 'No se pudieron cargar las reservas.',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            cargarDatos();
        }, [cargarDatos])
    );

    const puedeAprobar = (reserva) =>
        esGestion &&
        reserva.origen === 'recibida' &&
        reserva.estado === 'pendiente';

    const puedeRechazar = (reserva) =>
        esGestion &&
        reserva.origen === 'recibida' &&
        reserva.estado === 'pendiente';

    const puedeFinalizar = (reserva) =>
        esGestion &&
        reserva.origen === 'recibida' &&
        reserva.estado === 'confirmada';

    const puedeCancelar = (reserva) =>
        ['pendiente', 'confirmada'].includes(
            reserva.estado
        );

    const yaCalificoReserva = (reserva) => {
        const tipo =
            reserva.origen === 'propia'
                ? 'propiedad'
                : 'inquilino';

        return misResenasHechas.some(
            (r) =>
                String(r.reserva_id) === String(reserva.id) &&
                r.tipo === tipo
        );
    };

    const estaVencidaNoFinalizada = (reserva) => {
        if (reserva.estado !== 'confirmada') return false;

        const finStr = reserva.fecha_fin_alquiler
            ? String(reserva.fecha_fin_alquiler).slice(0, 10)
            : null;

        if (!finStr) return false;

        return (
            finStr <
            new Date().toISOString().slice(0, 10)
        );
    };

    const puedeCalificar = (reserva) =>
        reserva.estado === 'finalizada' &&
        !yaCalificoReserva(reserva);

    const ejecutarAccion = async (accion, reserva) => {
        setAccionando(reserva.id);

        let result;

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

            await cargarDatos();
        } else {
            setMensaje({
                tipo: 'error',
                texto:
                    result?.error ||
                    result?.message ||
                    'No se pudo actualizar la reserva.',
            });
        }

        setAccionando(null);
    };

    const confirmarAccion = (
        accion,
        reserva,
        titulo,
        boton
    ) => {
        if (typeof window !== 'undefined' && window.confirm) {
            if (!window.confirm(titulo)) return;
        }

        ejecutarAccion(accion, reserva);
    };

    const abrirCalificacion = (reserva) => {
        setCalificacion(0);
        setComentario('');
        setErrorResena('');
        setResenaActiva(reserva);
    };

    const tipoResena = (reserva) =>
        reserva?.origen === 'propia'
            ? 'propiedad'
            : 'inquilino';

    const enviarCalificacion = async () => {
        setErrorResena('');

        if (
            !calificacion ||
            calificacion < 1 ||
            calificacion > 5
        ) {
            setErrorResena(
                'Seleccioná una calificación de 1 a 5 estrellas'
            );

            return;
        }

        const comentarioFinal = comentario.trim();

        if (
            comentarioFinal &&
            comentarioFinal.length < 3
        ) {
            setErrorResena(
                'El comentario debe tener al menos 3 caracteres'
            );

            return;
        }

        setEnviandoResena(true);

        try {
            const payload = {
                reserva_id: Number(resenaActiva.id),
                tipo: tipoResena(resenaActiva),
                calificacion: Number(calificacion),
            };

            if (comentarioFinal) {
                payload.comentario = comentarioFinal;
            }

            const result = await crearResena(payload);

            if (result.success) {
                setMisResenasHechas((actuales) => [
                    ...actuales,
                    {
                        reserva_id: Number(resenaActiva.id),
                        tipo: tipoResena(resenaActiva),
                    },
                ]);
                setResenaActiva(null);
                setCalificacion(0);
                setComentario('');

                setMensaje({
                    tipo: 'exito',
                    texto:
                        result.message ||
                        '¡Reseña publicada correctamente!',
                });
            } else {
                const erroresServidor = Object.values(
                    result.validation_errors || {}
                )
                    .flatMap((mensajes) =>
                        Array.isArray(mensajes) ? mensajes : [mensajes]
                    )
                    .filter(Boolean)
                    .join('\n');

                setErrorResena(
                    result.error ||
                    erroresServidor ||
                    result.message ||
                    'No se pudo publicar la reseña.'
                );
            }
        } catch (_error) {
            setErrorResena(
                'Error de conexión al publicar la reseña.'
            );
        } finally {
            setEnviandoResena(false);
        }
    };

    const filtradas = reservas.filter(
        (r) =>
            (filtro === 'todos' || r.estado === filtro) &&
            (filtroOrigen === 'todos' ||
                r.origen === filtroOrigen)
    );

    const conteo = (estado) =>
        estado === 'todos'
            ? reservas.filter(
                  (r) =>
                      filtroOrigen === 'todos' ||
                      r.origen === filtroOrigen
              ).length
            : reservas.filter(
                  (r) =>
                      r.estado === estado &&
                      (filtroOrigen === 'todos' ||
                          r.origen === filtroOrigen)
              ).length;

    const conteoOrigen = (origen) =>
        origen === 'todos'
            ? reservas.length
            : reservas.filter(
                  (r) =>
                      r.origen === origen &&
                      (filtro === 'todos' ||
                          r.estado === filtro)
              ).length;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Cargando tus reservas...
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
                title="Mis reservas"
                subtitle="Aprobá, rechazá o finalizá las solicitudes que recibís en tus propiedades y seguí tus propios alquileres."
            />

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

            {reservas.length > 0 ? (
                <>
                    <View style={styles.filtersSection}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={
                                styles.filtersRow
                            }
                        >
                            {ESTADOS.map((e) => (
                                <TouchableOpacity
                                    key={e.valor}
                                    style={[
                                        styles.filterChip,
                                        filtro === e.valor &&
                                            styles.filterChipActivo,
                                    ]}
                                    onPress={() =>
                                        setFiltro(e.valor)
                                    }
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            filtro === e.valor &&
                                                styles.filterChipTextActivo,
                                        ]}
                                    >
                                        {e.etiqueta}
                                    </Text>

                                    <Text
                                        style={[
                                            styles.filterChipCount,
                                            filtro === e.valor &&
                                                styles.filterChipTextActivo,
                                        ]}
                                    >
                                        {conteo(e.valor)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={
                                styles.filtersRow
                            }
                        >
                            {ORIGENES.map((o) => (
                                <TouchableOpacity
                                    key={o.valor}
                                    style={[
                                        styles.filterChip,
                                        styles.filterChipOrigen,
                                        filtroOrigen === o.valor &&
                                            styles.filterChipActivo,
                                    ]}
                                    onPress={() =>
                                        setFiltroOrigen(o.valor)
                                    }
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            filtroOrigen === o.valor &&
                                                styles.filterChipTextActivo,
                                        ]}
                                    >
                                        {o.etiqueta}
                                    </Text>

                                    <Text
                                        style={[
                                            styles.filterChipCount,
                                            filtroOrigen === o.valor &&
                                                styles.filterChipTextActivo,
                                        ]}
                                    >
                                        {conteoOrigen(o.valor)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {filtradas.length > 0 ? (
                        <View style={styles.lista}>
                            {filtradas.map((reserva) => {
                                const prop =
                                    reserva.propiedad || null;

                                const img =
                                    construirUrlImagen(
                                        prop?.imagen_url ||
                                            prop?.imagen_principal?.ruta ||
                                            prop?.imagenes?.[0]?.ruta ||
                                            null
                                    );

                                const info =
                                    ESTADO_INFO[
                                        reserva.estado
                                    ] || {
                                        etiqueta: reserva.estado,
                                        color: theme.colors.neutralText,
                                        bg: theme.colors.neutralBg,
                                    };

                                const vencida =
                                    estaVencidaNoFinalizada(
                                        reserva
                                    );

                                return (
                                    <View
                                        key={reserva.id}
                                        style={styles.item}
                                    >
                                        <TouchableOpacity
                                            onPress={() =>
                                                router.push(
                                                    `/reservas/${reserva.id}`
                                                )
                                            }
                                            activeOpacity={0.8}
                                        >
                                            <View
                                                style={
                                                    styles.itemImagen
                                                }
                                            >
                                                {img ? (
                                                    <Image
                                                        source={{
                                                            uri: img,
                                                        }}
                                                        style={
                                                            styles.itemImageFull
                                                        }
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <View
                                                        style={
                                                            styles.itemImagenPlaceholder
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.itemImagenIcono
                                                            }
                                                        >
                                                            🏠
                                                        </Text>
                                                    </View>
                                                )}

                                                <View
                                                    style={[
                                                        styles.itemTag,
                                                        reserva.origen ===
                                                        'propia' &&
                                                            styles.itemTagPropia,
                                                    ]}
                                                >
                                                    <Text
                                                        style={
                                                            styles.itemTagText
                                                        }
                                                    >
                                                        {reserva.origen ===
                                                        'recibida'
                                                            ? 'Recibida'
                                                            : 'Solicitada'}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View
                                                style={
                                                    styles.itemInfo
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.itemTitulo
                                                    }
                                                    numberOfLines={1}
                                                >
                                                    {prop?.titulo ||
                                                        'Propiedad'}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.itemSolicitante
                                                    }
                                                >
                                                    {reserva.origen ===
                                                    'recibida'
                                                        ? `Solicitada por ${
                                                              reserva.usuario
                                                                  ? `${
                                                                        reserva
                                                                            .usuario
                                                                            .nombre ||
                                                                        ''
                                                                    } ${
                                                                        reserva
                                                                            .usuario
                                                                            .apellido ||
                                                                        ''
                                                                    }`.trim() ||
                                                                    `usuario #${reserva.usuario_id}`
                                                                  : `usuario #${reserva.usuario_id}`
                                                          }`
                                                        : 'Solicitud propia'}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.itemFechas
                                                    }
                                                >
                                                    Desde{' '}
                                                    {soloDia(
                                                        reserva.fecha_inicio_alquiler
                                                    )}{' '}
                                                    · Hasta{' '}
                                                    {soloDia(
                                                        reserva.fecha_fin_alquiler
                                                    )}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>

                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                gap: 6,
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.badge,
                                                    {
                                                        color: info.color,
                                                        backgroundColor:
                                                            info.bg,
                                                    },
                                                ]}
                                            >
                                                {info.etiqueta}
                                            </Text>

                                            {vencida ? (
                                                <Text
                                                    style={[
                                                        styles.badge,
                                                        styles.badgeVencida,
                                                    ]}
                                                >
                                                    Vencida
                                                </Text>
                                            ) : null}
                                        </View>

                                        {reserva.estado ===
                                            'finalizada' &&
                                        yaCalificoReserva(
                                            reserva
                                        ) ? (
                                            <Text
                                                style={
                                                    styles.yaCalificado
                                                }
                                            >
                                                ★ Ya calificaste
                                            </Text>
                                        ) : null}

                                        <View
                                            style={
                                                styles.accionesRow
                                            }
                                        >
                                            {puedeAprobar(
                                                reserva
                                            ) ? (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.boton,
                                                        styles.botonPrimario,
                                                    ]}
                                                    onPress={() =>
                                                        confirmarAccion(
                                                            'aprobar',
                                                            reserva,
                                                            '¿Aprobar solicitud?'
                                                        )
                                                    }
                                                    disabled={
                                                        accionando ===
                                                        reserva.id
                                                    }
                                                    activeOpacity={
                                                        0.85
                                                    }
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

                                            {puedeRechazar(
                                                reserva
                                            ) ? (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.boton,
                                                        styles.botonDanger,
                                                    ]}
                                                    onPress={() =>
                                                        confirmarAccion(
                                                            'rechazar',
                                                            reserva,
                                                            '¿Rechazar solicitud? El inquilino recibirá el rechazo.'
                                                        )
                                                    }
                                                    disabled={
                                                        accionando ===
                                                        reserva.id
                                                    }
                                                    activeOpacity={
                                                        0.85
                                                    }
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

                                            {puedeFinalizar(
                                                reserva
                                            ) ? (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.boton,
                                                        styles.botonPrimario,
                                                    ]}
                                                    onPress={() =>
                                                        confirmarAccion(
                                                            'finalizar',
                                                            reserva,
                                                            vencida
                                                                ? '¿Finalizar reserva vencida?'
                                                                : '¿Finalizar reserva?'
                                                        )
                                                    }
                                                    disabled={
                                                        accionando ===
                                                        reserva.id
                                                    }
                                                    activeOpacity={
                                                        0.85
                                                    }
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

                                            {puedeCancelar(
                                                reserva
                                            ) ? (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.boton,
                                                        styles.botonSecundario,
                                                    ]}
                                                    onPress={() =>
                                                        confirmarAccion(
                                                            'cancelar',
                                                            reserva,
                                                            '¿Cancelar esta reserva?'
                                                        )
                                                    }
                                                    disabled={
                                                        accionando ===
                                                        reserva.id
                                                    }
                                                    activeOpacity={
                                                        0.85
                                                    }
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

                                            {puedeCalificar(
                                                reserva
                                            ) ? (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.boton,
                                                        styles.botonSecundario,
                                                    ]}
                                                    onPress={() =>
                                                        abrirCalificacion(
                                                            reserva
                                                        )
                                                    }
                                                    activeOpacity={
                                                        0.85
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.botonSecundarioText
                                                        }
                                                    >
                                                        ★ Calificar
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>
                                🔍
                            </Text>

                            <Text style={styles.emptyTitle}>
                                No hay reservas en este estado
                            </Text>

                            <Text style={styles.emptyText}>
                                Probá con otro filtro para ver
                                más resultados.
                            </Text>
                        </View>
                    )}
                </>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>
                        📅
                    </Text>

                    <Text style={styles.emptyTitle}>
                        Todavía no tenés reservas
                    </Text>

                    <Text style={styles.emptyText}>
                        Las solicitudes en tus propiedades y tus
                        propias reservas van a aparecer acá.
                    </Text>
                </View>
            )}

            {resenaActiva ? (
            <Modal
                visible={!!resenaActiva}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    !enviandoResena && setResenaActiva(null)
                }
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            {tipoResena(resenaActiva) ===
                            'propiedad'
                                ? 'Calificar la propiedad'
                                : 'Calificar al inquilino'}
                        </Text>

                        <Text style={styles.modalSubtitle}>
                            {tipoResena(resenaActiva) ===
                            'propiedad'
                                ? '¿Cómo te fue en la propiedad? Tu opinión ayuda a otros usuarios.'
                                : 'Calificá tu experiencia con el inquilino de esta reserva.'}
                        </Text>

                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((n) => (
                                <TouchableOpacity
                                    key={n}
                                    onPress={() =>
                                        setCalificacion(n)
                                    }
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.star,
                                            n <= calificacion &&
                                                styles.starActiva,
                                        ]}
                                    >
                                        ★
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Contanos cómo fue tu experiencia (opcional)"
                            placeholderTextColor={
                                theme.colors.textMuted
                            }
                            value={comentario}
                            onChangeText={setComentario}
                            multiline
                            textAlignVertical="top"
                        />

                        {errorResena ? (
                            <Text style={styles.modalError}>
                                {errorResena}
                            </Text>
                        ) : null}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[
                                    styles.boton,
                                    styles.botonSecundario,
                                ]}
                                onPress={() =>
                                    setResenaActiva(null)
                                }
                                disabled={enviandoResena}
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

                            <TouchableOpacity
                                style={[
                                    styles.boton,
                                    styles.botonPrimario,
                                ]}
                                onPress={enviarCalificacion}
                                disabled={enviandoResena}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={
                                        styles.botonPrimarioText
                                    }
                                >
                                    {enviandoResena
                                        ? 'Publicando...'
                                        : 'Publicar reseña'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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

    filtersSection: {
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },

    filtersRow: {
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },

    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    filterChipOrigen: {
        backgroundColor: theme.colors.background,
    },

    filterChipActivo: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },

    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textDark,
    },

    filterChipTextActivo: {
        color: theme.colors.white,
    },

    filterChipCount: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.textMuted,
    },

    lista: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.md,
    },

    item: {
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
        paddingBottom: theme.spacing.md,
    },

    itemImagen: {
        height: 150,
        backgroundColor: theme.colors.border,
    },

    itemImageFull: {
        width: '100%',
        height: '100%',
    },

    itemImagenPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    itemImagenIcono: {
        fontSize: 40,
    },

    itemTag: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
    },

    itemTagPropia: {
        backgroundColor: theme.colors.textMuted,
    },

    itemTagText: {
        color: theme.colors.white,
        fontSize: 11,
        fontWeight: '700',
    },

    itemInfo: {
        padding: theme.spacing.md,
        gap: 4,
    },

    itemTitulo: {
        color: theme.colors.textDark,
        fontSize: 17,
        fontWeight: '700',
    },

    itemSolicitante: {
        color: theme.colors.textMuted,
        fontSize: 13,
    },

    itemFechas: {
        color: theme.colors.textMuted,
        fontSize: 13,
    },

    badge: {
        alignSelf: 'flex-start',
        marginLeft: theme.spacing.md,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: '700',
        overflow: 'hidden',
    },

    badgeVencida: {
        marginLeft: theme.spacing.sm,
        color: theme.colors.warningText,
        backgroundColor: theme.colors.warningBg,
        borderWidth: 1,
        borderColor: theme.colors.warningBorder,
    },

    yaCalificado: {
        marginLeft: theme.spacing.md,
        marginTop: theme.spacing.sm,
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.neutralText,
    },

    accionesRow: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
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

    modalOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        padding: theme.spacing.lg,
    },

    modalCard: {
        width: '100%',
        maxWidth: 420,
        padding: theme.spacing.lg,
        borderRadius: 18,
        backgroundColor: theme.colors.white,
    },

    modalTitle: {
        color: theme.colors.textDark,
        fontSize: 19,
        fontWeight: '700',
        textAlign: 'center',
    },

    modalSubtitle: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
    },

    starsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginVertical: theme.spacing.md,
    },

    star: {
        fontSize: 34,
        color: theme.colors.border,
    },

    starActiva: {
        color: '#f59e0b',
    },

    modalInput: {
        minHeight: 90,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        padding: 12,
        color: theme.colors.textDark,
        fontSize: 14,
        textAlignVertical: 'top',
    },

    modalError: {
        marginTop: theme.spacing.sm,
        color: theme.colors.errorText,
        fontSize: 13,
    },

    modalActions: {
        marginTop: theme.spacing.lg,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: theme.spacing.sm,
    },
});