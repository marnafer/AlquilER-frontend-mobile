import { Ionicons } from '@expo/vector-icons';
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
import type { Property } from '../types/property';

type PropertyCardProps = {
    propiedad: Property;
    onPress: () => void;
    compacto?: boolean;
};

const PropertyCard = ({
    propiedad,
    onPress,
    compacto = false,
}: PropertyCardProps) => {
    const { width } = useWindowDimensions();

    const anchoDisponible = width - theme.spacing.md * 2;
    const anchoGrid = (anchoDisponible - theme.spacing.md) / 2;

    const anchoCard = compacto
        ? width * 0.40
        : anchoGrid;

    const alturaCard = compacto
        ? undefined
        : anchoGrid / 1.5 + 165;

    const construirUrlImagen = (
        ruta: string | null | undefined
    ): string | null => {
        if (!ruta) return null;
        const apiBaseUrl = api.defaults.baseURL;
        if (!apiBaseUrl) {
            throw new Error('No está configurada la URL base de la API.');
        }
        const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
        return `${baseUrl}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
    };

    const imagenUrl = construirUrlImagen(propiedad.imagen_url);

    const aceptaMascotas = Boolean(Number(propiedad.acepta_mascotas));
    const aceptaHijos = Boolean(Number(propiedad.acepta_hijos));

    return (
        <TouchableOpacity
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
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View
                style={[
                    styles.imageContainer,
                    compacto && styles.imageContainerCompacta,
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
                        <Ionicons name="home-outline" size={24} color={theme.colors.textMuted} />
                        <Text
                            style={[
                                styles.placeholderLabel,
                                compacto && styles.placeholderLabelCompacto,
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
                    compacto && styles.infoCompacta,
                ]}
            >
                <Text
                    style={[
                        styles.title,
                        compacto && styles.titleCompacto,
                    ]}
                    numberOfLines={2}
                >
                    {propiedad.titulo}
                </Text>

                <Text
                    style={[
                        styles.location,
                        compacto && styles.locationCompacta,
                    ]}
                    numberOfLines={1}
                >
                    <Ionicons name="location-outline" size={12} color={theme.colors.textMuted} /> {propiedad.direccion}
                </Text>

                <Text
                    style={[
                        styles.price,
                        compacto && styles.priceCompacto,
                    ]}
                >
                    ${Number(propiedad.precio || 0).toLocaleString('es-AR')}
                </Text>

                {/* CONTENEDOR DE CARACTERÍSTICAS (Soporta múltiples filas) */}
                <View
                    style={[
                        styles.featuresContainer,
                        compacto && styles.featuresContainerCompacto,
                    ]}
                >
                    {/* FILA 1: Dormitorios, Baños y Capacidad */}
                    <View
                        style={[
                            styles.features,
                            compacto && styles.featuresCompactas,
                        ]}
                    >
                        <Text
                            style={[
                                styles.feature,
                                compacto && styles.featureCompacto,
                            ]}
                        >
                            <Ionicons name="bed-outline" size={12} color={theme.colors.textMuted} />{' '}
                            {propiedad.cantidad_dormitorios || 0}
                        </Text>

                        <Text
                            style={[
                                styles.feature,
                                compacto && styles.featureCompacto,
                            ]}
                        >
                            <Ionicons name="water-outline" size={12} color={theme.colors.textMuted} />{' '}
                            {propiedad.cantidad_banos || 0}
                        </Text>

                        <Text
                            style={[
                                styles.feature,
                                compacto && styles.featureCompacto,
                            ]}
                        >
                            <Ionicons name="people-outline" size={12} color={theme.colors.textMuted} />{' '}
                            {propiedad.capacidad || 0}
                        </Text>
                    </View>

                    {/* FILA 2: Mascotas e Hijos (Aparece abajo si aplica) */}
                    {(aceptaMascotas || aceptaHijos) && (
                        <View
                            style={[
                                styles.features,
                                styles.featuresRow2,
                                compacto && styles.featuresCompactas,
                            ]}
                        >
                            {aceptaMascotas && (
                                <Text
                                    style={[
                                        styles.feature,
                                        compacto && styles.featureCompacto,
                                    ]}
                                >
                                    <Ionicons name="paw-outline" size={12} color={theme.colors.textMuted} /> <Text style={styles.checkVerde}>✓</Text>
                                </Text>
                            )}

                            {aceptaHijos && (
                                <Text
                                    style={[
                                        styles.feature,
                                        compacto && styles.featureCompacto,
                                    ]}
                                >
                                    <Ionicons name="happy-outline" size={12} color={theme.colors.textMuted} /> <Text style={styles.checkVerde}>✓</Text>
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        backgroundColor: theme.colors.inputBg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardCompacta: {
        borderRadius: 12,
        alignSelf: 'stretch',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1.5,
        backgroundColor: theme.colors.border,
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
    featuresContainer: {
        flexDirection: 'column',
        gap: 6,
    },
    featuresContainerCompacto: {
        gap: 4,
    },
    features: {
        flexDirection: 'row',
        gap: 8,
    },
    featuresRow2: {
        marginTop: 2, // Espacio sutil entre la primera y segunda fila
    },
    feature: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },
    featuresCompactas: {
        gap: 6,
        alignItems: 'center',
    },
    featureCompacto: {
        fontSize: 10,
        lineHeight: 16,
    },
    checkVerde: {
        color: theme.colors.success,
        fontWeight: '700',
    },
});

export default PropertyCard;