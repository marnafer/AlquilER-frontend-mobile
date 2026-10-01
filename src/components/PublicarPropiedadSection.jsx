import { useRouter } from 'expo-router';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';

const limitar = (valor, minimo, maximo) =>
    Math.min(Math.max(valor, minimo), maximo);

const colorConOpacidad = (color, opacidad) => {
    if (!color) {
        return 'rgba(0, 0, 0, 0)';
    }

    const hex = color.replace('#', '');

    if (hex.length !== 6) {
        return color;
    }

    const rojo = parseInt(hex.substring(0, 2), 16);
    const verde = parseInt(hex.substring(2, 4), 16);
    const azul = parseInt(hex.substring(4, 6), 16);

    return `rgba(${rojo}, ${verde}, ${azul}, ${opacidad})`;
};

export default function PublicarPropiedadSection() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { width } = useWindowDimensions();

    const escala = limitar(width / 375, 0.88, 1.2);

    const separacionPequena = limitar(
        6 * escala,
        5,
        8
    );

    const separacionMedia = limitar(
        12 * escala,
        10,
        16
    );

    const separacionGrande = limitar(
        18 * escala,
        14,
        24
    );

    const radioMedio = limitar(
        16 * escala,
        14,
        20
    );

    const fontBody = limitar(
        14 * escala,
        13,
        16
    );

    const fontSmall = limitar(
        12 * escala,
        11,
        14
    );

    const iconCategory = limitar(
        30 * escala,
        26,
        36
    );

    const categorySize = limitar(
        68 * escala,
        60,
        78
    );

    const handlePublicarPropiedad = () => {
        if (isAuthenticated) {
            router.push('/publicar-propiedad');
            return;
        }

        router.push('/login');
    };

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionBadge}>
                    Publicá
                </Text>

                <Text style={styles.sectionTitle}>
                    ¿Tenés una propiedad para alquilar?
                </Text>

                <Text style={styles.sectionDescription}>
                    Sumala a AlquilER y empezá a recibir
                    consultas de personas interesadas.
                </Text>
            </View>

            <TouchableOpacity
                style={styles.publishCard}
                activeOpacity={0.85}
                onPress={handlePublicarPropiedad}
            >
                <View style={styles.publishIconContainer}>
                    <Text style={styles.publishIcon}>
                        🏠
                    </Text>
                </View>

                <View style={styles.publishContent}>
                    <Text style={styles.publishTitle}>
                        Publicar propiedad →
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginTop: 24,
        marginBottom: 24,
    },

    sectionHeader: {
        width: '100%',
        paddingHorizontal: 16,
        marginBottom: 18,
    },

    sectionBadge: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 6,
    },

    sectionTitle: {
        color: theme.colors.textDark,
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 6,
    },

    sectionDescription: {
        color: theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 20,
    },

    publishCard: {
        width: '90%',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primaryDark,
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 6,
        marginTop: 6,
    },

    publishIconContainer: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colorConOpacidad(
            theme.colors.background,
            0.15
        ),
        marginRight: 6,
    },

    publishIcon: {
        fontSize: 30,
    },

    publishContent: {
        flex: 1,
    },

    publishTitle: {
        color: theme.colors.background,
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
});