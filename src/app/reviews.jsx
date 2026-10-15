import { useFocusEffect } from 'expo-router';
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
import { useAuth } from '../context/AuthContext';

import ScreenHeader from '../components/ScreenHeader';
import {
    obtenerResenasDeMisPropiedades,
    obtenerResenasRealizadas,
} from '../services/reviewService';

import { theme } from '../theme/theme';


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

function obtenerTituloPropiedad(resena) {
    return obtenerValor(resena, [
        'reserva.propiedad.titulo',
        'reserva.propiedad.nombre',
        'propiedad.titulo',
        'propiedad.nombre',
        'propiedad_titulo',
    ]) || 'Propiedad';
}

function ResenaCard({ resena, recibida }) {
    const calificacion = obtenerValor(resena, ['calificacion']);
    const comentario = obtenerValor(resena, ['comentario']);
    const fecha = obtenerValor(resena, [
        'fecha_publicacion',
        'created_at',
        'fecha',
    ]);

    const nombreAutor = obtenerValor(resena, [
        'calificador.nombre',
    ]);

    const apellidoAutor = obtenerValor(resena, [
        'calificador.apellido',
    ]);

    const nombreInquilino = obtenerValor(resena, [
        'reserva.usuario.nombre',
    ]);

    const apellidoInquilino = obtenerValor(resena, [
        'reserva.usuario.apellido',
    ]);

    const nombrePersona = recibida
        ? [nombreAutor, apellidoAutor].filter(Boolean).join(' ')
        : [nombreInquilino, apellidoInquilino].filter(Boolean).join(' ');

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>
                {obtenerTituloPropiedad(resena)}
            </Text>

            {calificacion !== null && (
                <View style={styles.calificacionContainer}>
                    <Text style={styles.estrellas}>
                        {'★'.repeat(
                            Math.max(
                                0,
                                Math.min(5, Number(calificacion) || 0)
                            )
                        )}
                    </Text>

                    <Text style={styles.calificacionTexto}>
                        {calificacion}/5
                    </Text>
                </View>
            )}

            {nombrePersona !== '' && (
                <Text style={styles.persona}>
                    {recibida
                        ? `Calificador: ${nombrePersona}`
                        : `Inquilino: ${nombrePersona}`}
                </Text>
            )}

            {comentario ? (
                <Text style={styles.comentario}>
                    {comentario}
                </Text>
            ) : (
                <Text style={styles.sinComentario}>
                    Sin comentario.
                </Text>
            )}

            {fecha && (
                <Text style={styles.fecha}>
                    Publicada el {formatearFecha(fecha)}
                </Text>
            )}
        </View>
    );
}

function SeccionResenas({
    titulo,
    resenas,
    mensajeVacio,
    recibida,
}) {
    return (
        <View style={styles.seccion}>
            <Text style={styles.sectionTitle}>
                {titulo}
            </Text>

            {resenas.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>
                        No hay reseñas
                    </Text>

                    <Text style={styles.emptyText}>
                        {mensajeVacio}
                    </Text>
                </View>
            ) : (
                resenas.map((resena, indice) => (
                    <ResenaCard
                        key={resena.id ?? `${titulo}-${indice}`}
                        resena={resena}
                        recibida={recibida}
                    />
                ))
            )}
        </View>
    );
}

export default function ReviewsScreen() {

    const { usuario } = useAuth();
    const [misResenas, setMisResenas] = useState([]);
    const [resenasPropiedades, setResenasPropiedades] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState('');

    
    const cargarResenas = useCallback(async (manual = false) => {
        if (manual) {
            setActualizando(true);
        } else {
            setCargando(true);
        }

        setError('');

        if (!usuario?.id) {
            setError('No se pudo identificar al usuario autenticado.');
            setCargando(false);
            setActualizando(false);
            return;
        }

        try {
            const [respuestaRealizadas, respuestaRecibidas] =
                await Promise.all([
                    obtenerResenasRealizadas(usuario.id),
                    obtenerResenasDeMisPropiedades(),
                ]);

            if (!respuestaRealizadas?.success) {
                throw new Error(
                    respuestaRealizadas?.message ||
                    'No se pudieron cargar las reseñas que realizaste.'
                );
            }

            if (!respuestaRecibidas?.success) {
                throw new Error(
                    respuestaRecibidas?.message ||
                    'No se pudieron cargar las reseñas de tus propiedades.'
                );
            }

            const datosRealizadas = respuestaRealizadas.data;
            const datosRecibidas = respuestaRecibidas.data;

            setMisResenas(
                Array.isArray(datosRealizadas)
                    ? datosRealizadas
                    : Array.isArray(datosRealizadas?.items)
                        ? datosRealizadas.items
                        : []
            );

            setResenasPropiedades(
                Array.isArray(datosRecibidas)
                    ? datosRecibidas
                    : Array.isArray(datosRecibidas?.items)
                        ? datosRecibidas.items
                        : []
            );
        } catch (e) {
            setError(
                e.message || 'Ocurrió un error al cargar las reseñas.'
            );
        } finally {
            setCargando(false);
            setActualizando(false);
        }
    }, [usuario?.id]);

    useFocusEffect(
        useCallback(() => {
            cargarResenas();
        }, [cargarResenas])
    );


    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Mis reseñas"
                subtitle="Consultá las reseñas que realizaste y las de tus propiedades."
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={actualizando}
                        onRefresh={() => cargarResenas(true)}
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
                            Cargando reseñas...
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
                                    onPress={() => cargarResenas(true)}
                                    style={styles.retryButton}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.retryText}>
                                        Reintentar
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <SeccionResenas
                            titulo="Reseñas que realicé"
                            resenas={misResenas}
                            recibida={false}
                            mensajeVacio="Cuando dejes una reseña sobre una propiedad, aparecerá acá."
                        />

                        <SeccionResenas
                            titulo="Reseñas de mis propiedades"
                            resenas={resenasPropiedades}
                            recibida={true}
                            mensajeVacio="Cuando alguien deje una reseña sobre una de tus propiedades, aparecerá acá."
                        />

                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={() => cargarResenas(true)}
                            disabled={actualizando}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.refreshButtonText}>
                                {actualizando
                                    ? 'Actualizando...'
                                    : 'Actualizar reseñas'}
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
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 125,
    },
    seccion: {
        marginBottom: 26,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.textDark,
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 16,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.textDark,
        marginBottom: 10,
    },
    calificacionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    estrellas: {
        fontSize: 20,
        color: '#D97706',
        letterSpacing: 2,
    },
    calificacionTexto: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textDark,
    },
    persona: {
        fontSize: 13,
        color: theme.colors.textMuted,
        marginBottom: 8,
    },
    comentario: {
        fontSize: 14,
        lineHeight: 21,
        color: theme.colors.textDark,
    },
    sinComentario: {
        fontSize: 14,
        fontStyle: 'italic',
        color: theme.colors.textMuted,
    },
    fecha: {
        marginTop: 12,
        fontSize: 12,
        color: theme.colors.textMuted,
    },
    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 20,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textDark,
        marginBottom: 6,
    },
    emptyText: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        color: theme.colors.textMuted,
    },
    loading: {
        paddingVertical: 50,
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
        marginBottom: 20,
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
        fontWeight: '600',
    },
});
