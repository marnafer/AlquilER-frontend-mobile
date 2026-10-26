import { Ionicons } from '@expo/vector-icons';
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

const limitar = (
  valor: number,
  minimo: number,
  maximo: number
): number => Math.min(Math.max(valor, minimo), maximo);

const colorConOpacidad = (
  color: string,
  opacidad: number
): string => {
    if (!color) return 'rgba(0, 0, 0, 0)';
    const hex = color.replace('#', '');
    if (hex.length !== 6) return color;
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
                <Text style={styles.sectionBadge}>Publicá</Text>
                <Text style={styles.sectionTitle}>
                    ¿Tenés una propiedad para alquilar?
                </Text>
                <Text style={styles.sectionDescription}>
                    Sumala a AlquilER y empezá a recibir consultas de personas interesadas.
                </Text>
            </View>

            <TouchableOpacity
                style={styles.publishCard}
                activeOpacity={0.8}
                onPress={handlePublicarPropiedad}
            >
                <View style={[styles.publishIconContainer, { backgroundColor: colorConOpacidad(theme.colors.primary || '#2563EB', 0.1) }]}>
                    <Ionicons name="home" size={24} color={theme.colors.primary || '#2563EB'} />
                </View>

                <View style={styles.publishContent}>
                    <Text style={styles.publishTitle}>
                        Publicar una propiedad
                    </Text>
                    <Text style={styles.publishDescription}>
                        Agregá un nuevo inmueble al catálogo
                    </Text>
                </View>

                <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted || '#6B7280'} />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginTop: 24,
        marginBottom: 32,
    },
    sectionHeader: {
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionBadge: {
        color: '#2563EB',
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    sectionTitle: {
        color: '#1F2937',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
        lineHeight: 30,
    },
    sectionDescription: {
        color: '#4B5563',
        fontSize: 15,
        lineHeight: 22,
    },
    publishCard: {
        width: '90%',
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    publishIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    publishContent: {
        flex: 1,
        marginLeft: 16,
    },
    publishTitle: {
        color: '#1F2937',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    publishDescription: {
        color: '#6B7280',
        fontSize: 13,
        lineHeight: 18,
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
});