import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import ScreenHeader from '../../components/ScreenHeader';
import { obtenerPerfilPublico } from '../../services/userService';
import { theme } from '../../theme/theme';

function FormatearCalificacion({ titulo, valor }) {
    return (
        <View style={styles.calificacion}>
            <Text style={styles.calificacionTitulo}>
                {titulo}
            </Text>

            <Text style={styles.calificacionValor}>
                {valor == null
                    ? 'Sin calificaciones'
                    : `★ ${Number(valor).toFixed(2)} / 5`}
            </Text>
        </View>
    );
}

function TarjetaResena({ resena }) {
    const autor = [
        resena.calificador?.nombre,
        resena.calificador?.apellido,
    ].filter(Boolean).join(' ');

    const fecha = resena.fecha_publicacion
        ? new Date(resena.fecha_publicacion).toLocaleDateString('es-AR')
        : null;

    return (
        <View style={styles.resenaCard}>
            <View style={styles.resenaHeader}>
                <View style={styles.resenaAutorContainer}>
                    <Text style={styles.resenaAutor}>
                        {autor || 'Usuario'}
                    </Text>

                    {fecha ? (
                        <Text style={styles.resenaFecha}>
                            {fecha}
                        </Text>
                    ) : null}
                </View>

                <Text style={styles.resenaPuntuacion}>
                    ★ {Number(resena.calificacion).toFixed(1)}
                </Text>
            </View>

            {resena.comentario ? (
                <Text style={styles.resenaComentario}>
                    {resena.comentario}
                </Text>
            ) : (
                <Text style={styles.resenaSinComentario}>
                    Sin comentario escrito.
                </Text>
            )}
        </View>
    );
}

export default function PublicProfileScreen() {
    const { id } = useLocalSearchParams();

    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargarPerfil = useCallback(async () => {
        if (!id || Array.isArray(id)) {
            setError('El usuario solicitado no es válido.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await obtenerPerfilPublico(id);

            if (response?.success && response.data) {
                setUsuario(response.data);
            } else {
                setUsuario(null);
                setError(
                    response?.message ||
                    response?.error ||
                    'No se pudo cargar el perfil público.'
                );
            }
        } catch (e) {
            setUsuario(null);
            setError('No se pudo cargar el perfil público.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            cargarPerfil();
        }, [cargarPerfil])
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Cargando perfil...
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
                title="Perfil público"
                subtitle="Información y calificaciones"
            />

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                </View>
            ) : null}

            {usuario ? (
                <View style={styles.card}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {usuario.nombre?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>

                    <Text style={styles.nombre}>
                        {[usuario.nombre, usuario.apellido]
                            .filter(Boolean)
                            .join(' ')}
                    </Text>

                    <View style={styles.separador} />

                    <Text style={styles.seccionTitulo}>
                        Calificaciones
                    </Text>

                    <FormatearCalificacion
                        titulo="Como inquilino"
                        valor={usuario.calificaciones?.inquilino}
                    />

                    {usuario.calificaciones?.propiedades != null ? (
                        <FormatearCalificacion
                            titulo="Como propietario"
                            valor={usuario.calificaciones.propiedades}
                        />
                    ) : null}

                    <View style={styles.separador} />

                        <Text style={styles.seccionTitulo}>
                            Reseñas como inquilino
                        </Text>

                        {usuario.resenas?.inquilino?.length > 0 ? (
                            usuario.resenas.inquilino.map((resena) => (
                                <TarjetaResena
                                    key={resena.id}
                                    resena={resena}
                                />
                            ))
                        ) : (
                            <Text style={styles.resenasVacias}>
                                Todavía no tiene reseñas como inquilino.
                            </Text>
                        )}

                        {usuario.calificaciones?.propiedades != null ? (
                            <>
                                <View style={styles.separador} />

                                <Text style={styles.seccionTitulo}>
                                    Reseñas de sus propiedades
                                </Text>

                                {usuario.resenas?.propiedades?.length > 0 ? (
                                    usuario.resenas.propiedades.map((resena) => (
                                        <TarjetaResena
                                            key={resena.id}
                                            resena={resena}
                                        />
                                    ))
                                ) : (
                                    <Text style={styles.resenasVacias}>
                                        Todavía no tiene reseñas sobre sus propiedades.
                                    </Text>
                                )}
                            </>
                        ) : null}
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

    errorBox: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.errorBg,
    },

    errorText: {
        color: theme.colors.errorText,
        fontSize: 14,
        textAlign: 'center',
    },

    card: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        padding: theme.spacing.lg,
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    avatar: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
    },

    avatarText: {
        color: '#ffffff',
        fontSize: 32,
        fontWeight: '700',
    },

    nombre: {
        marginTop: theme.spacing.md,
        color: theme.colors.textDark,
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },

    separador: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.lg,
    },

    seccionTitulo: {
        marginBottom: theme.spacing.sm,
        color: theme.colors.textDark,
        fontSize: 17,
        fontWeight: '700',
    },

    calificacion: {
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },

    calificacionTitulo: {
        marginBottom: 5,
        color: theme.colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
    },

    calificacionValor: {
        color: theme.colors.textDark,
        fontSize: 16,
        fontWeight: '600',
    },

    resenaCard: {
        marginTop: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: 12,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    resenaHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: theme.spacing.sm,
    },

    resenaAutorContainer: {
        flex: 1,
    },

    resenaAutor: {
        color: theme.colors.textDark,
        fontSize: 14,
        fontWeight: '700',
    },

    resenaFecha: {
        marginTop: 4,
        color: theme.colors.textMuted,
        fontSize: 12,
    },

    resenaPuntuacion: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },

    resenaComentario: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textDark,
        fontSize: 14,
        lineHeight: 21,
    },

    resenaSinComentario: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 13,
        fontStyle: 'italic',
    },

    resenasVacias: {
        paddingVertical: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 20,
    },
});