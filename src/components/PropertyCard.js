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

const limitar = (valor, minimo, maximo) =>
    Math.min(Math.max(valor, minimo), maximo);

const PropertyCard = ({
    propiedad,
    onPress,
    compacto = false,
}) => {
    const { width } = useWindowDimensions();

    const escala = limitar(
        width / 375,
        0.88,
        1.2
    );

    const anchoCard = compacto
        ? limitar(width * 0.48, 170, 205)
        : 260;

    const altoImagen = compacto
        ? limitar(100 * escala, 88, 120)
        : 150;

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
                },
                compacto &&
                    styles.cardCompacta,
            ]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            {!compacto && (
                <View
                    style={[
                        styles.imageContainer,
                        {
                            height: altoImagen,
                        },
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
                            <Text style={styles.placeholderText}>
                                🏠
                            </Text>
                        </View>
                    )}
                </View>
            )}

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
                    numberOfLines={
                        compacto ? 1 : 2
                    }
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

                {!compacto && (
                    <View style={styles.features}>
                        <Text style={styles.feature}>
                            🛏{' '}
                            {propiedad.cantidad_dormitorios ||
                                0}
                        </Text>

                        <Text style={styles.feature}>
                            🚿{' '}
                            {propiedad.cantidad_banos ||
                                0}
                        </Text>

                        <Text style={styles.feature}>
                            👥{' '}
                            {propiedad.capacidad || 0}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        marginRight: 14,
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
    },

    imageContainer: {
        width: '100%',
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
        padding: 10,
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
        marginBottom: 0,
    },

    features: {
        flexDirection: 'row',
        gap: 12,
    },

    feature: {
        fontSize: 12,
        color: theme.colors.text,
    },
});

export default PropertyCard;