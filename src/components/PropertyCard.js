import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useState } from 'react';

import api, {
    agregarFavorito,
    eliminarFavorito,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';

const estaAceptado = (valor) =>
    valor === true ||
    valor === 1 ||
    valor === '1' ||
    valor === 'true';

const PropertyCard = ({
    propiedad,
    onPress,
    compacto = false,
    mostrarFavorito = false,
    esFavoritoInicial = false,
    onCambioFavorito,
}) => {
    const { width } = useWindowDimensions();
    const { isAuthenticated } = useAuth();
    const [guardandoFavorito, setGuardandoFavorito] = useState(false);
    const [errorFavorito, setErrorFavorito] = useState('');
    const esFavorito = esFavoritoInicial;

    const cambiarFavorito = async () => {
        if (guardandoFavorito) {
            return;
        }

        setGuardandoFavorito(true);
        setErrorFavorito('');

        try {
            const respuesta = esFavorito
                ? await eliminarFavorito(propiedad.id)
                : await agregarFavorito(propiedad.id);

            if (!respuesta?.success) {
                setErrorFavorito(
                    respuesta?.error ||
                        respuesta?.message ||
                        'No se pudo actualizar el favorito.'
                );
                return;
            }

            const nuevoEstado = !esFavorito;
            onCambioFavorito?.(propiedad.id, nuevoEstado);
        } catch (error) {
            console.error(
                'PROPERTY CARD: error al actualizar favorito',
                error
            );
            setErrorFavorito('No se pudo actualizar el favorito.');
        } finally {
            setGuardandoFavorito(false);
        }
    };

    const anchoDisponible =
    width - theme.spacing.md * 2;

    const anchoGrid =
        (anchoDisponible - theme.spacing.md) / 2;

    const anchoCard = compacto
        ? width * 0.48
        : anchoGrid;

    const alturaCard = compacto
        ? undefined
        : anchoGrid / 1.5 + 210;

    const construirUrlImagen = (ruta) => {
        if (!ruta) {
            return null;
        }

        const baseUrl =
            api.defaults.baseURL.replace(
                /\/api\/?$/,
                ''
            );

        return `${baseUrl}${
            ruta.startsWith('/')
                ? ruta
                : `/${ruta}`
        }`;
    };

    const imagenUrl = construirUrlImagen(
        propiedad.imagen_url
    );

    const aceptaMascotas = estaAceptado(propiedad.acepta_mascotas);
    const aceptaHijos = estaAceptado(propiedad.acepta_hijos);

    return (
        <View
            style={[
                styles.card,
                {
                    width: anchoCard,
                    ...(alturaCard !== undefined && {
                        height: alturaCard,
                    }),
                },
                compacto && styles.cardCompacta,
            ]}
        >
            <TouchableOpacity
                style={styles.cardContent}
                onPress={onPress}
                activeOpacity={0.9}
                accessibilityRole="button"
            >
           <View
                style={[
                    styles.imageContainer,
                    compacto &&
                        styles.imageContainerCompacta,
                ]}
            >
                {imagenUrl ? (
                    <Image
                        source={{ uri: imagenUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholder}>
                        <Text
                            style={[
                                styles.placeholderText,
                                compacto &&
                                    styles.placeholderTextCompacto,
                            ]}
                        >
                            🏠
                        </Text>

                        <Text
                            style={[
                                styles.placeholderLabel,
                                compacto &&
                                    styles.placeholderLabelCompacto,
                            ]}
                        >
                            Sin imágenes
                        </Text>
                    </View>
                )}
            </View>
            <View
                style={[
                    styles.info,
                    compacto &&
                        styles.infoCompacta,
                ]}
            >
                <Text
                    style={[
                        styles.title,
                        compacto &&
                            styles.titleCompacto,
                    ]}
                    numberOfLines={2}
                >
                    {propiedad.titulo}
                </Text>

                <Text
                    style={[
                        styles.location,
                        compacto &&
                            styles.locationCompacta,
                    ]}
                    numberOfLines={1}
                >
                    📍 {propiedad.direccion}
                </Text>

                <Text
                    style={[
                        styles.price,
                        compacto &&
                            styles.priceCompacto,
                    ]}
                >
                    $
                    {Number(
                        propiedad.precio || 0
                    ).toLocaleString('es-AR')}
                </Text>

                <View
                    style={[
                        styles.features,
                        compacto &&
                            styles.featuresCompactas,
                    ]}
                >
                    <Text
                        style={[
                            styles.feature,
                            compacto &&
                                styles.featureCompacto,
                        ]}
                    >
                        🛏{' '}
                        {propiedad.cantidad_dormitorios ||
                            0}
                    </Text>

                    <Text
                        style={[
                            styles.feature,
                            compacto &&
                                styles.featureCompacto,
                        ]}
                    >
                        🚿{' '}
                        {propiedad.cantidad_banos ||
                            0}
                    </Text>

                    <Text
                        style={[
                            styles.feature,
                            compacto &&
                                styles.featureCompacto,
                        ]}
                    >
                        👥{' '}
                        {propiedad.capacidad || 0}
                    </Text>
                </View>

                <View
                    style={[
                        styles.policies,
                        compacto && styles.policiesCompactas,
                    ]}
                >
                    <View
                        style={[
                            styles.policyBadge,
                            aceptaMascotas
                                ? styles.policyAccepted
                                : styles.policyRejected,
                        ]}
                    >
                        <Text
                            style={[
                                styles.policyText,
                                aceptaMascotas
                                    ? styles.policyTextAccepted
                                    : styles.policyTextRejected,
                                compacto && styles.policyTextCompacto,
                            ]}
                            numberOfLines={1}
                        >
                            🐾 Mascotas: {aceptaMascotas ? 'Sí' : 'No'}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.policyBadge,
                            aceptaHijos
                                ? styles.policyAccepted
                                : styles.policyRejected,
                        ]}
                    >
                        <Text
                            style={[
                                styles.policyText,
                                aceptaHijos
                                    ? styles.policyTextAccepted
                                    : styles.policyTextRejected,
                                compacto && styles.policyTextCompacto,
                            ]}
                            numberOfLines={1}
                        >
                            👶 Hijos: {aceptaHijos ? 'Sí' : 'No'}
                        </Text>
                    </View>
                </View>
            </View>
            </TouchableOpacity>

            {mostrarFavorito && isAuthenticated ? (
                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={cambiarFavorito}
                    disabled={guardandoFavorito}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={
                        esFavorito
                            ? 'Quitar de favoritos'
                            : 'Agregar a favoritos'
                    }
                    accessibilityState={{
                        disabled: guardandoFavorito,
                        selected: esFavorito,
                    }}
                >
                    {guardandoFavorito ? (
                        <ActivityIndicator
                            size="small"
                            color={theme.colors.primary}
                        />
                    ) : (
                        <Text
                            style={[
                                styles.favoriteIcon,
                                esFavorito && styles.favoriteIconActive,
                            ]}
                        >
                            {esFavorito ? '♥' : '♡'}
                        </Text>
                    )}
                </TouchableOpacity>
            ) : null}

            {errorFavorito ? (
                <View
                    style={styles.favoriteError}
                    accessibilityLiveRegion="polite"
                >
                    <Text style={styles.favoriteErrorText} numberOfLines={2}>
                        {errorFavorito}
                    </Text>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        backgroundColor:
            theme.colors.inputBg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor:
            theme.colors.border,
    },

    cardContent: {
        flex: 1,
    },

    cardCompacta: {
        borderRadius: 12,
        alignSelf: 'stretch',
    },

    imageContainer: {
        width: '100%',
        aspectRatio: 1.5,
        backgroundColor:
            theme.colors.border,
    },

    imageContainerCompacta: {
        aspectRatio: 1.5,
    },

    image: {
        width: '100%',
        height: '100%',
    },

    placeholder: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    placeholderLabel: {
        marginTop: 6,
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textMuted,
        textAlign: 'center',
    },

    placeholderLabelCompacto: {
        marginTop: 4,
        fontSize: 11,
    },

    info: {
        padding: 14,
    },
    
    infoCompacta: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.md + 4,
    },

    title: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.textDark,
        marginBottom: 7,
    },

    titleCompacto: {
        fontSize: 14,
        marginBottom: 5,
    },

    location: {
        fontSize: 13,
        color: theme.colors.textMuted,
        marginBottom: 8,
    },

    locationCompacta: {
        fontSize: 11,
        marginBottom: 5,
    },

    price: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 10,
    },

    priceCompacto: {
        fontSize: 15,
        marginBottom: 7,
    },

    features: {
        flexDirection: 'row',
        gap: 8,
    },

    feature: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },

    featuresCompactas: {
        gap: 5,
        flexWrap: 'nowrap',
        minHeight: 20,
        alignItems: 'center',
    },

    featureCompacto: {
        fontSize: 10,
        lineHeight: 18,
        flexShrink: 1,
    },

    policies: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },

    policiesCompactas: {
        gap: 5,
        marginTop: 7,
    },

    policyBadge: {
        maxWidth: '100%',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 999,
    },

    policyAccepted: {
        backgroundColor: theme.colors.successBg,
    },

    policyRejected: {
        backgroundColor: theme.colors.errorBg,
    },

    policyText: {
        fontSize: 11,
        fontWeight: '700',
    },

    policyTextAccepted: {
        color: theme.colors.successText,
    },

    policyTextRejected: {
        color: theme.colors.errorText,
    },

    policyTextCompacto: {
        fontSize: 10,
    },

    favoriteButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 21,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        elevation: 3,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },

    favoriteIcon: {
        color: theme.colors.textMuted,
        fontSize: 29,
        lineHeight: 34,
    },

    favoriteIconActive: {
        color: theme.colors.errorText,
    },

    favoriteError: {
        position: 'absolute',
        top: 58,
        right: 8,
        maxWidth: '75%',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: theme.colors.errorBg,
    },

    favoriteErrorText: {
        color: theme.colors.errorText,
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default PropertyCard;