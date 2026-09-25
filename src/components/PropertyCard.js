import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import api from '../services/api';
import { theme } from '../theme/theme';

const PropertyCard = ({ propiedad, onPress }) => {
    const construirUrlImagen = (ruta) => {
        if (!ruta) {
            return null;
        }

        const baseUrl = api.defaults.baseURL.replace(/\/api\/?$/, '');

        return `${baseUrl}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
    };

    const imagenUrl = construirUrlImagen(propiedad.imagen_url);

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
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
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

            <View style={styles.info}>
                <Text
                    style={styles.title}
                    numberOfLines={2}
                >
                    {propiedad.titulo}
                </Text>

                <Text
                    style={styles.location}
                    numberOfLines={1}
                >
                    📍 {propiedad.direccion}
                </Text>

                <Text style={styles.price}>
                    ${Number(
                        propiedad.precio || 0
                    ).toLocaleString('es-AR')}
                </Text>

                <View style={styles.features}>
                <Text style={styles.feature}>
                    🛏 {propiedad.cantidad_dormitorios || 0}
                </Text>

                <Text style={styles.feature}>
                    🚿 {propiedad.cantidad_banos || 0}
                </Text>

                <Text style={styles.feature}>
                    👥 {propiedad.capacidad || 0}
                </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 260,
        marginRight: 14,
        borderRadius: 14,
        backgroundColor: theme.colors.inputBg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    imageContainer: {
        width: '100%',
        height: 150,
    },

    image: {
        width: '100%',
        height: '100%',
    },

    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.border,
    },

    placeholderText: {
        fontSize: 48,
    },

    info: {
        padding: 14,
    },

    title: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.textDark,
        marginBottom: 7,
    },

    location: {
        fontSize: 13,
        color: theme.colors.text,
        marginBottom: 8,
    },

    price: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 10,
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