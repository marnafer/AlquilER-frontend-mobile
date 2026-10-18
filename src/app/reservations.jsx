
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { obtenerReservas } from '../services/reservationService';

const COLORES = {
    fondo: '#F7F8FA',
    tarjeta: '#FFFFFF',
    primario: '#2563EB',
    texto: '#172033',
    secundario: '#667085',
    borde: '#E4E7EC',
    error: '#B42318',
};

function obtenerValor(objeto, claves) {
    for (const clave of claves) {
        const valor = clave
            .split('.')
            .reduce((actual, parte) => actual?.[parte], objeto);

        if (valor !== undefined && valor !== null && valor !== '') {
            return valor;
        }
    }

    return null;
}

function formatearFecha(valor) {
    if (!valor) return null;

    const texto = String(valor);
    const coincidencia = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (coincidencia) {
        const [, anio, mes, dia] = coincidencia;
        return `${dia}/${mes}/${anio}`;
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
        return texto;
    }

    return fecha.toLocaleDateString('es-AR');
}

    function ReservaCard({ reserva }) {
        const router = useRouter();

        const titulo =
            obtenerValor(reserva, [
                'propiedad.titulo',
                'propiedad.nombre',
                'propiedad_titulo',
                'titulo_propiedad',
                'titulo',
            ]) || 'Reserva';

        const estado = obtenerValor(reserva, ['estado']);

        const fechaInicio = obtenerValor(reserva, [
            'fecha_inicio_alquiler',
            'fecha_inicio',
            'fecha_desde',
            'fecha_entrada',
        ]);

        const fechaFin = obtenerValor(reserva, [
            'fecha_fin_alquiler',
            'fecha_fin',
            'fecha_hasta',
            'fecha_salida',
        ]);

        const id = obtenerValor(reserva, ['id']);

        const abrirDetalle = () => {
            if (id === null) return;

            router.push(`/reservations/${id}`);
        };

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={abrirDetalle}
                disabled={id === null}
                activeOpacity={0.75}
            >
                <Text style={styles.cardTitle}>{titulo}</Text>

                {estado && (
                    <View style={styles.estadoContainer}>
                        <Text style={styles.estadoTexto}>
                            Estado: {String(estado)}
                        </Text>
                    </View>
                )}

                {(fechaInicio || fechaFin) && (
                    <Text style={styles.cardDetail}>
                        {fechaInicio
                            ? formatearFecha(fechaInicio)
                            : 'Fecha sin especificar'}
                        {' — '}
                        {fechaFin
                            ? formatearFecha(fechaFin)
                            : 'Sin fecha de finalización'}
                    </Text>
                )}

                {id !== null && (
                    <Text style={styles.verDetalle}>
                        Ver detalle →
                    </Text>
                )}
            </TouchableOpacity>
        );
    }

function SeccionReservas({ titulo, reservas, mensajeVacio }) {
    return (
        <View style={styles.seccion}>
            <Text style={styles.sectionTitle}>
                {titulo}
            </Text>

            {reservas.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>
                        No hay reservas
                    </Text>

                    <Text style={styles.emptyText}>
                        {mensajeVacio}
                    </Text>
                </View>
            ) : (
                reservas.map((reserva, indice) => (
                    <ReservaCard
                        key={reserva.id ?? `${titulo}-${indice}`}
                        reserva={reserva}
                    />
                ))
            )}
        </View>
    );
}

export default function ReservasScreen() {

    const [misReservas, setMisReservas] = useState([]);
    const [reservasPropiedades, setReservasPropiedades] =
        useState([]);
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState('');

    const cargarReservas = useCallback(async (manual = false) => {
        if (manual) {
            setActualizando(true);
        } else {
            setCargando(true);
        }

        setError('');

        try {
            const respuesta = await obtenerReservas();
            
            if (!respuesta?.success) {
                throw new Error(
                    respuesta?.message ||
                    respuesta?.error ||
                    'No se pudieron cargar las reservas.'
                );
            }

            
            const datos = respuesta.data;

            if (
                !datos ||
                typeof datos !== 'object' ||
                Array.isArray(datos)
            ) {
                throw new Error(
                    'La respuesta del servidor no tiene el formato esperado.'
                );
            }

            setMisReservas(
                Array.isArray(datos.mis_reservas)
                    ? datos.mis_reservas
                    : []
            );

            setReservasPropiedades(
                Array.isArray(datos.reservas_de_mis_propiedades)
                    ? datos.reservas_de_mis_propiedades
                    : []
            );

        } catch (e) {
            setError(
                e.message || 'Ocurrió un error al cargar las reservas.'
            );
        } finally {
            setCargando(false);
            setActualizando(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            cargarReservas();
        }, [cargarReservas])
    );

    
    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Mis reservas"
                subtitle="Consultá tus reservas y las de tus propiedades."
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={actualizando}
                        onRefresh={() => cargarReservas(true)}
                        colors={[COLORES.primario]}
                        tintColor={COLORES.primario}
                    />
                }
            >
                {cargando ? (
                    <View style={styles.loading}>
                        <ActivityIndicator
                            size="large"
                            color={COLORES.primario}
                        />
                        <Text style={styles.loadingText}>
                            Cargando reservas...
                        </Text>
                    </View>
                ) : (
                    <>
                        {error !== '' && (
                            <View style={styles.errorCard}>
                                <Text style={styles.errorText}>
                                    {error}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => cargarReservas(true)}
                                    style={styles.retryButton}
                                >
                                    <Text style={styles.retryText}>
                                        Reintentar
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <SeccionReservas
                            titulo="Reservas que realicé"
                            reservas={misReservas}
                            mensajeVacio="Cuando reserves una propiedad, aparecerá acá."
                        />

                        <SeccionReservas
                            titulo="Reservas de mis propiedades"
                            reservas={reservasPropiedades}
                            mensajeVacio="Cuando alguien reserve una de tus propiedades, aparecerá acá."
                        />

                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={() => cargarReservas(true)}
                            disabled={actualizando}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.refreshButtonText}>
                                {actualizando
                                    ? 'Actualizando...'
                                    : 'Actualizar reservas'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORES.fondo,
    },
    content: {
        padding: 20,
        paddingBottom: 125,
    },
    title: {
        fontSize: 27,
        fontWeight: '700',
        color: COLORES.texto,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: COLORES.secundario,
        lineHeight: 21,
        marginBottom: 24,
    },
    seccion: {
        marginBottom: 26,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORES.texto,
        marginBottom: 12,
    },
    emptyCard: {
        backgroundColor: COLORES.tarjeta,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORES.borde,
        padding: 20,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORES.texto,
        marginBottom: 6,
    },
    emptyText: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        color: COLORES.secundario,
    },
    card: {
        backgroundColor: COLORES.tarjeta,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORES.borde,
        padding: 16,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORES.texto,
        marginBottom: 8,
    },
    cardDetail: {
        fontSize: 14,
        color: COLORES.secundario,
        marginTop: 5,
    },
    estadoContainer: {
        alignSelf: 'flex-start',
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginTop: 4,
    },
    estadoTexto: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORES.primario,
    },
    loading: {
        paddingVertical: 50,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORES.secundario,
    },
    errorCard: {
        backgroundColor: '#FEF3F2',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    errorText: {
        color: COLORES.error,
        fontSize: 14,
    },
    retryButton: {
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingVertical: 8,
    },
    retryText: {
        color: COLORES.error,
        fontWeight: '700',
    },
    refreshButton: {
        backgroundColor: COLORES.primario,
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        marginTop: 2,
    },
    refreshButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    verDetalle: {
        marginTop: 12,
        color: COLORES.primario,
        fontSize: 14,
        fontWeight: '600',
    },
});