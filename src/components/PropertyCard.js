import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import api from '../services/api';
import { theme } from '../theme/theme';

const PropertyCard = ({
    propiedad,
    onPress,
    compacto = false,
    ancho,
    altura,
}) => {
    const { width } = useWindowDimensions();

    const anchoCard =
        ancho ??
        (
            compacto
                ? width * 0.48
                : 260
        );

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

    console.log(
        'PROPERTY CARD:',
        propiedad.id,
        'imagen_url:',
        propiedad.imagen_url,
        'URL final:',
        imagenUrl
    );

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    width: anchoCard,
                    marginRight:
                        ancho !== undefined
                            ? 0
                            : compacto
                                ? 0
                                : 14,
                    ...(altura !== undefined && {
                        height: altura,
                    }),
                },
                compacto &&
                    styles.cardCompacta,
            ]}
            onPress={onPress}
            activeOpacity={0.9}
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
            </View>
        </TouchableOpacity>
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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
            theme.colors.border,
    },

    placeholderText: {
        fontSize: 48,
    },

    placeholderTextCompacto: {
        fontSize: 32,
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
        color: theme.colors.text,
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
        color: theme.colors.text,
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
});

export default PropertyCard;