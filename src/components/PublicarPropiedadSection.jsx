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
                style={styles.publishButton}
                activeOpacity={0.8}
                onPress={handlePublicarPropiedad}
            >
                <View style={styles.publishIconContainer}>
                    <Text style={styles.publishIcon}>
                        🏠
                    </Text>
                </View>

                <View style={styles.publishContent}>
                    <Text style={styles.publishTitle}>
                        Publicar una propiedad
                    </Text>

                    <Text style={styles.publishDescription}>
                        Agregá una nueva propiedad a AlquilER
                    </Text>
                </View>

                <Text style={styles.menuArrow}>
                    ›
                </Text>
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

    publishButton: {
        minHeight: 76,
        width: '90%',
        alignSelf: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },

    publishIconContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
    },

    publishIcon: {
        fontSize: 20,
    },

    publishContent: {
        flex: 1,
        minWidth: 0,
        marginLeft: theme.spacing.md,
    },

    publishTitle: {
        color: theme.colors.textDark,
        fontSize: 15,
        fontWeight: '700',
    },

    publishDescription: {
        marginTop: 3,
        color: theme.colors.textMuted,
        fontSize: 12,
        lineHeight: 17,
    },

    menuArrow: {
        marginLeft: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 28,
        fontWeight: '300',
    },
});