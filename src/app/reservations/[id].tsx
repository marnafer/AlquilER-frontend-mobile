import {
    useFocusEffect,
    useLocalSearchParams,
    useRouter,
} from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '../../components/ScreenHeader';
import {
    cancelarReserva,
    confirmarReserva,
    finalizarReserva,
    obtenerReserva,
    rechazarReserva,
} from '../../services/reservationService';

import { useAuth } from '../../context/AuthContext';

import { theme } from '../../theme/theme';

import ReviewButton from '../../components/ReviewButton';
import { obtenerResenasReserva } from '../../services/reviewService';

import type {
    ReservationDetail,
    ReservationId,
} from '../../types/reservation';
import type { ReviewWithRelations } from '../../types/review';

function formatearFecha(valor: string | null | undefined): string {
  if (!valor) return 'No especificada';

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;

  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

type DatoProps = {
  etiqueta: string;
  valor: string | number | null | undefined;
};

function Dato({ etiqueta, valor }: DatoProps) {
    return (
        <View style={styles.dato}>
            <Text style={styles.etiqueta}>{etiqueta}</Text>
            <Text style={styles.valor}>
                {valor !== null && valor !== undefined && valor !== ''
                    ? String(valor)
                    : 'No disponible'}
            </Text>
        </View>
    );
}

function mensajeDeError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function DetalleReservaScreen() {

    const { usuario } = useAuth();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const reservaId = Array.isArray(id) ? id[0] : id;

    const [reserva, setReserva] = useState<ReservationDetail | null>(null);
    const [resenas, setResenas] = useState<ReviewWithRelations[] | null>(null);
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState('');

    const [procesandoAccion, setProcesandoAccion] = useState(false);

    function obtenerReservaId(): ReservationId {
        if (!reservaId) {
            throw new Error('No se recibió el identificador de la reserva.');
        } 

        return reservaId;
    }  

    const cargarReserva = useCallback(async (manual = false) => {
        if (!reservaId) {
            setError('No se recibió el identificador de la reserva.');
            setCargando(false);
            return;
        }

        if (manual) {
            setActualizando(true);
        } else {
            setCargando(true);
        }

        setError('');

        try {
            const respuesta = await obtenerReserva(reservaId);

            if (!respuesta?.success) {
                throw new Error(
                    respuesta?.message ||
                    respuesta?.error ||
                    'No se pudo cargar la reserva.'
                );
            }

            // Response::success() devuelve la reserva dentro de "data".
            const datos = respuesta.data;

            if (!datos || typeof datos !== 'object') {
                throw new Error('La respuesta no contiene los datos de la reserva.');
            }

            setReserva(datos);
            setResenas(null);

            try {
                const respuestaResenas = await obtenerResenasReserva(
                    reservaId
                );

                if (!respuestaResenas?.success) {
                    throw new Error(
                        respuestaResenas?.message ||
                        'No se pudieron consultar las reseñas.'
                    );
                }

                setResenas(
                    Array.isArray(respuestaResenas.data)
                        ? respuestaResenas.data
                        : []
                );
            } catch (e) {
                console.error(
                    'Error al consultar las reseñas de la reserva:',
                    e
                );

                setResenas(null);
            }
        } catch (e) {
            setError(
                mensajeDeError(e, 'Ocurrió un error al cargar la reserva.'
            ));
        } finally {
            setCargando(false);
            setActualizando(false);
        }
    }, [reservaId]);

    const confirmarSolicitud = async () => {
    try {
        setProcesandoAccion(true);

        const respuesta = await confirmarReserva(obtenerReservaId());

        if (!respuesta?.success) {
            throw new Error(
                respuesta?.message ||
                respuesta?.error ||
                'No se pudo confirmar la reserva.'
            );
        }

        await cargarReserva(true);

        Alert.alert(
            'Reserva confirmada',
            'La solicitud de reserva se confirmó correctamente.'
        );
    } catch (e) {
        Alert.alert(
            'Error',
            mensajeDeError(e, 'No se pudo confirmar la reserva.')
        );
    } finally {
        setProcesandoAccion(false);
    }
};

const rechazarSolicitud = () => {
    Alert.alert(
        'Rechazar reserva',
        '¿Estás seguro de que querés rechazar esta solicitud?',
        [
            {
                text: 'Volver',
                style: 'cancel',
            },
            {
                text: 'Rechazar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        setProcesandoAccion(true);

                        const respuesta = await rechazarReserva(obtenerReservaId());

                        if (!respuesta?.success) {
                            throw new Error(
                                respuesta?.message ||
                                respuesta?.error ||
                                'No se pudo rechazar la reserva.'
                            );
                        }

                        await cargarReserva(true);

                        Alert.alert(
                            'Solicitud rechazada',
                            'La reserva se rechazó correctamente.'
                        );
                    } catch (e) {
                        Alert.alert(
                            'Error',
                            mensajeDeError(e, 'No se pudo rechazar la reserva.')
                        );
                    } finally {
                        setProcesandoAccion(false);
                    }
                },
            },
        ]
    );
};

    const cancelarSolicitud = () => {
        Alert.alert(
            'Cancelar solicitud',
            '¿Estás seguro de que querés cancelar esta solicitud?',
            [
                {
                    text: 'Volver',
                    style: 'cancel',
                },
                {
                    text: 'Cancelar solicitud',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setProcesandoAccion(true);

                            const respuesta = await cancelarReserva(obtenerReservaId());

                            if (!respuesta?.success) {
                                throw new Error(
                                    respuesta?.message ||
                                    respuesta?.error ||
                                    'No se pudo cancelar la reserva.'
                                );
                            }

                            await cargarReserva(true);

                            Alert.alert(
                                'Reserva cancelada',
                                'La reserva se canceló correctamente.'
                            );
                        } catch (e) {
                            Alert.alert(
                                'Error',
                                mensajeDeError(e, 'No se pudo cancelar la reserva.')
                            );
                        } finally {
                            setProcesandoAccion(false);
                        }
                    },
                },
            ]
        );
    };

    const finalizarSolicitud = () => {
        Alert.alert(
            'Finalizar reserva',
            '¿Confirmás que la reserva se realizó y querés marcarla como finalizada?',
            [
                {
                    text: 'Volver',
                    style: 'cancel',
                },
                {
                    text: 'Finalizar reserva',
                    onPress: async () => {
                        try {
                            setProcesandoAccion(true);

                            const respuesta = await finalizarReserva(obtenerReservaId());

                            if (!respuesta?.success) {
                                throw new Error(
                                    respuesta?.message ||
                                    respuesta?.error ||
                                    'No se pudo finalizar la reserva.'
                                );
                            }

                            await cargarReserva(true);

                            Alert.alert(
                                'Reserva finalizada',
                                'La reserva se marcó como finalizada correctamente.'
                            );
                        } catch (e) {
                            Alert.alert(
                                'Error',
                                mensajeDeError(e, 'No se pudo finalizar la reserva.')
                            );
                        } finally {
                            setProcesandoAccion(false);
                        }
                    },
                },
            ]
        );
    };

    useFocusEffect(
        useCallback(() => {
            cargarReserva();
        }, [cargarReserva])
    );

    const propiedad = reserva?.propiedad;
    const usuarioReserva = reserva?.usuario;

    const estado = reserva?.estado;
    const propietarioId = propiedad?.usuario_id ?? null;
    const usuarioActualId = usuario?.id ?? null;

    const puedeCancelarReserva =
    reserva !== null &&
    usuarioActualId !== null &&
    reserva.usuario_id === usuarioActualId &&
    reserva.estado === 'pendiente';

    const puedeFinalizarReserva =
    propietarioId !== null &&
    usuarioActualId !== null &&
    propietarioId === usuarioActualId &&
    estado === 'confirmada';

    const puedeGestionarReserva =
    propietarioId !== null &&
    usuarioActualId !== null &&
    propietarioId === usuarioActualId &&
    estado === 'pendiente';

    const fechaInicio = reserva?.fecha_inicio_alquiler;
    const fechaFin = reserva?.fecha_fin_alquiler;
    const fechaReserva = reserva?.fecha_reserva;
    const fechaConfirmacion = reserva?.fecha_confirmacion;

    const esPropietario =
    propietarioId !== null &&
    usuarioActualId !== null &&
    propietarioId === usuarioActualId;

    const otroUsuarioId = esPropietario
    ? usuarioReserva?.id ?? null
    : propietarioId;

    const nombreCompletoOtraPersona = esPropietario
    ? [usuarioReserva?.nombre, usuarioReserva?.apellido]
        .filter(Boolean)
        .join(' ') || 'Ver perfil'
    : 'Ver perfil';

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Detalle de reserva"
                subtitle="Consulta la información de tu reserva"
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={actualizando}
                        onRefresh={() => cargarReserva(true)}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {cargando ? (
                    <View style={styles.loading}>
                        <ActivityIndicator
                            size="large"
                            color={theme.colors.primary}
                        />
                        <Text style={styles.loadingText}>
                            Cargando detalle...
                        </Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorText}>{error}</Text>

                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => cargarReserva(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.retryText}>
                                Reintentar
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : reserva ? (
                    <>
                        <View style={styles.card}>

                            <TouchableOpacity
                                disabled={!otroUsuarioId}
                                onPress={() => {
                                    router.push({
                                        pathname: '/public-profile/[id]',
                                        params: {
                                            id: String(otroUsuarioId),
                                        },
                                    });
                                }}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel={`Ver perfil de ${nombreCompletoOtraPersona}`}
                                style={styles.perfilLink}
                            >
                                <Text style={styles.perfilLinkText}>
                                    Ver perfil del {esPropietario ? 'Inquilino' : 'Propietario'}
                                </Text>
                                <Text style={styles.perfilLinkHint}>
                                    Ver perfil público →
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.seccionTitulo}>
                                Datos de la reserva
                            </Text>

                            {estado && (
                                <View style={styles.estadoContainer}>
                                    <Text style={styles.estadoTexto}>
                                        {String(estado).replaceAll('_', ' ')}
                                    </Text>
                                </View>
                            )}

                            <Dato
                                etiqueta="Fecha de inicio"
                                valor={formatearFecha(fechaInicio)}
                            />

                            <Dato
                                etiqueta="Fecha de finalización"
                                valor={formatearFecha(fechaFin)}
                            />

                            <Dato
                                etiqueta="Fecha de solicitud"
                                valor={formatearFecha(fechaReserva)}
                            />

                            <Dato
                                etiqueta="Fecha de confirmación"
                                valor={formatearFecha(fechaConfirmacion)}
                            />
                        </View>

                        <ReviewButton
                            reserva={reserva}
                            usuarioId={usuario?.id}
                            resenas={resenas}
                        />

                        {puedeGestionarReserva && (
                            <View style={styles.accionesContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.accionButton,
                                        styles.confirmarButton,
                                    ]}
                                    onPress={confirmarSolicitud}
                                    disabled={procesandoAccion}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.accionButtonText}>
                                        {procesandoAccion
                                            ? 'Procesando...'
                                            : 'Confirmar reserva'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.accionButton,
                                        styles.rechazarButton,
                                    ]}
                                    onPress={rechazarSolicitud}
                                    disabled={procesandoAccion}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.accionButtonText}>
                                        Rechazar reserva
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {(puedeCancelarReserva || puedeFinalizarReserva) && (
                            <View style={styles.accionesContainer}>
                                {puedeCancelarReserva && (
                                    <TouchableOpacity
                                        style={[
                                            styles.accionButton,
                                            styles.rechazarButton,
                                        ]}
                                        onPress={cancelarSolicitud}
                                        disabled={procesandoAccion}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.accionButtonText}>
                                            {procesandoAccion
                                                ? 'Procesando...'
                                                : 'Cancelar solicitud'}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {puedeFinalizarReserva && (
                                    <TouchableOpacity
                                        style={[
                                            styles.accionButton,
                                            styles.finalizarButton,
                                        ]}
                                        onPress={finalizarSolicitud}
                                        disabled={procesandoAccion}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.accionButtonText}>
                                            {procesandoAccion
                                                ? 'Procesando...'
                                                : 'Finalizar reserva'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={() => cargarReserva(true)}
                            disabled={actualizando}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.refreshButtonText}>
                                {actualizando
                                    ? 'Actualizando...'
                                    : 'Actualizar información'}
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : null}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 125,
    },
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 18,
        marginBottom: 16,
    },
    seccionTitulo: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.textDark,
        marginBottom: 14,
    },
    dato: {
        marginBottom: 13,
    },
    etiqueta: {
        fontSize: 13,
        color: theme.colors.textMuted,
        marginBottom: 4,
    },
    valor: {
        fontSize: 15,
        color: theme.colors.textDark,
        lineHeight: 21,
    },
    estadoContainer: {
        alignSelf: 'flex-start',
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginBottom: 16,
    },
    estadoTexto: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    loading: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: theme.colors.textMuted,
    },
    errorCard: {
        backgroundColor: '#FEF3F2',
        borderRadius: 12,
        padding: 16,
    },
    errorText: {
        color: theme.colors.errorText,
        fontSize: 14,
        lineHeight: 20,
    },
    retryButton: {
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingVertical: 8,
    },
    retryText: {
        color: theme.colors.errorText,
        fontWeight: '700',
    },
    refreshButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
    },
    refreshButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    accionesContainer: {
    gap: 12,
    marginBottom: 16,
},

accionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
},

confirmarButton: {
    backgroundColor: '#15803D',
},

rechazarButton: {
    backgroundColor: '#B42318',
},

accionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
},

finalizarButton: {
    backgroundColor: '#175CD3',
},

perfilLink: {
    paddingVertical: 4,
},

perfilLinkText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
},

perfilLinkHint: {
    marginTop: 5,
    color: theme.colors.textMuted,
    fontSize: 13,
},

});