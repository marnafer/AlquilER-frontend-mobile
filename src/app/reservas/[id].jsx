
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
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

import ScreenHeader from '../../components/ScreenHeader';
import { obtenerReserva } from '../../services/api';

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
    if (!valor) return 'No especificada';

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
        return String(valor);
    }

    return fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function Dato({ etiqueta, valor }) {
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

export default function DetalleReservaScreen() {
    const { id } = useLocalSearchParams();

    const reservaId = Array.isArray(id) ? id[0] : id;

    const [reserva, setReserva] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState('');

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
        } catch (e) {
            setError(
                e.message || 'Ocurrió un error al cargar la reserva.'
            );
        } finally {
            setCargando(false);
            setActualizando(false);
        }
    }, [reservaId]);

    useFocusEffect(
        useCallback(() => {
            cargarReserva();
        }, [cargarReserva])
    );

    const propiedad = reserva?.propiedad;
    const usuario = reserva?.usuario;

    const tituloPropiedad = obtenerValor(propiedad, [
        'titulo'
    ]) || 'Propiedad reservada';

    const estado = obtenerValor(reserva, ['estado']);

    const fechaInicio = obtenerValor(reserva, [
        'fecha_inicio_alquiler',
    ]);

    const fechaFin = obtenerValor(reserva, [
        'fecha_fin_alquiler',
    ]);

    const fechaReserva = obtenerValor(reserva, [
        'fecha_reserva',
    ]);

    const fechaConfirmacion = obtenerValor(reserva, [
        'fecha_confirmacion',
    ]);

    const nombreUsuario = obtenerValor(usuario, [
        'nombre'
    ]);

     const apellidoUsuario = obtenerValor(usuario, [
        'apellido'
    ]);


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
                            <Text style={styles.seccionTitulo}>
                                Propiedad
                            </Text>

                            <Text style={styles.tituloPropiedad}>
                                {obtenerValor(propiedad, ['titulo', 'nombre']) ||
                                    'Propiedad reservada'}
                            </Text>

                            <Dato
                                etiqueta="Dirección"
                                valor={obtenerValor(propiedad, ['direccion'])}
                            />

                            <Dato
                                etiqueta="Localidad"
                                valor={propiedad?.localidad?.nombre}
                            />
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

                        <View style={styles.card}>
                            <Text style={styles.seccionTitulo}>
                                Usuario
                            </Text>

                            <Dato
                                etiqueta="Nombre"
                                valor={ `${nombreUsuario} ${apellidoUsuario}` }
                            />
                        </View>

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
        backgroundColor: COLORES.fondo,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 125,
    },
    card: {
        backgroundColor: COLORES.tarjeta,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORES.borde,
        padding: 18,
        marginBottom: 16,
    },
    seccionTitulo: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORES.texto,
        marginBottom: 14,
    },
    tituloPropiedad: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORES.texto,
        marginBottom: 12,
    },
    dato: {
        marginBottom: 13,
    },
    etiqueta: {
        fontSize: 13,
        color: COLORES.secundario,
        marginBottom: 4,
    },
    valor: {
        fontSize: 15,
        color: COLORES.texto,
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
        color: COLORES.primario,
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
        color: COLORES.secundario,
    },
    errorCard: {
        backgroundColor: '#FEF3F2',
        borderRadius: 12,
        padding: 16,
    },
    errorText: {
        color: COLORES.error,
        fontSize: 14,
        lineHeight: 20,
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
    },
    refreshButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});