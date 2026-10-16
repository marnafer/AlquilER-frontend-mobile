
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { crearResena } from '../services/reviewService';
import { theme } from '../theme/theme';

export default function CreateReviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const reservaId = Array.isArray(params.reservaId)
        ? params.reservaId[0]
        : params.reservaId;

    const [calificacion, setCalificacion] = useState(0);
    const [comentario, setComentario] = useState('');
    const [procesando, setProcesando] = useState(false);

    const publicarResena = async () => {
        if (!reservaId) {
            Alert.alert(
                'Error',
                'No se recibió el identificador de la reserva.'
            );
            return;
        }

        if (calificacion < 1 || calificacion > 5) {
            Alert.alert(
                'Calificación requerida',
                'Seleccioná una cantidad de estrellas del 1 al 5.'
            );
            return;
        }

        try {
            setProcesando(true);

            const respuesta = await crearResena(
                reservaId,
                calificacion,
                comentario
            );

            if (!respuesta?.success) {
                throw new Error(
                    respuesta?.message ||
                    respuesta?.error ||
                    'No se pudo publicar la reseña.'
                );
            }

            Alert.alert(
                'Reseña publicada',
                'Tu reseña se publicó correctamente.',
                [
                    {
                        text: 'Aceptar',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (e) {
            Alert.alert(
                'No se pudo publicar',
                e.message || 'Ocurrió un error al publicar la reseña.'
            );
        } finally {
            setProcesando(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Dejar una reseña"
                subtitle="Compartí tu experiencia con la reserva."
            />

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.card}>
                    <Text style={styles.titulo}>
                        ¿Cómo fue tu experiencia?
                    </Text>

                    <Text style={styles.descripcion}>
                        Seleccioná una calificación de una a cinco estrellas.
                    </Text>

                    <View style={styles.estrellasContainer}>
                        {[1, 2, 3, 4, 5].map((valor) => (
                            <TouchableOpacity
                                key={valor}
                                onPress={() => setCalificacion(valor)}
                                disabled={procesando}
                                accessibilityRole="button"
                                accessibilityLabel={`${valor} estrellas`}
                                accessibilityState={{
                                    selected: calificacion === valor,
                                }}
                                activeOpacity={0.7}
                                style={styles.estrellasBoton}
                            >
                                <Text
                                    style={[
                                        styles.estrella,
                                        valor <= calificacion &&
                                            styles.estrellaSeleccionada,
                                    ]}
                                >
                                    ★
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.calificacionTexto}>
                        {calificacion === 0
                            ? 'Sin calificación'
                            : `${calificacion} de 5 estrellas`}
                    </Text>

                    <Text style={styles.label}>
                        Comentario (opcional)
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={comentario}
                        onChangeText={setComentario}
                        placeholder="Contá cómo fue tu experiencia..."
                        placeholderTextColor={theme.colors.textMuted}
                        multiline
                        maxLength={1000}
                        textAlignVertical="top"
                        editable={!procesando}
                    />

                    <Text style={styles.contador}>
                        {comentario.length}/1000
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.publicarBoton,
                            procesando && styles.botonDeshabilitado,
                        ]}
                        onPress={publicarResena}
                        disabled={procesando}
                        activeOpacity={0.8}
                    >
                        {procesando ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.publicarTexto}>
                                Publicar reseña
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelarBoton}
                        onPress={() => router.back()}
                        disabled={procesando}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.cancelarTexto}>
                            Cancelar
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: 20,
        paddingBottom: 125,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 16,
        padding: 20,
    },
    titulo: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.textDark,
        marginBottom: 8,
    },
    descripcion: {
        fontSize: 14,
        lineHeight: 21,
        color: theme.colors.textMuted,
    },
    estrellasContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    estrellasBoton: {
        paddingHorizontal: 4,
        paddingVertical: 6,
    },
    estrella: {
        fontSize: 42,
        color: '#D0D5DD',
    },
    estrellaSeleccionada: {
        color: '#D97706',
    },
    calificacionTexto: {
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textDark,
        marginTop: 6,
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textDark,
        marginBottom: 8,
    },
    input: {
        minHeight: 130,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: theme.colors.textDark,
    },
    contador: {
        textAlign: 'right',
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 6,
        marginBottom: 20,
    },
    publicarBoton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    botonDeshabilitado: {
        opacity: 0.65,
    },
    publicarTexto: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    cancelarBoton: {
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 4,
    },
    cancelarTexto: {
        color: theme.colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
    },
});
