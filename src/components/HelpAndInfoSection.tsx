import { useRouter } from 'expo-router';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { theme } from '../theme/theme';

const enlaces = [
    { ruta: '/contacto', icono: '✉️', titulo: 'Contacto' },
    { ruta: '/preguntas-frecuentes', icono: '❔', titulo: 'Preguntas frecuentes' },
    { ruta: '/terminos', icono: '📄', titulo: 'Términos y condiciones' },
    { ruta: '/privacidad', icono: '🛡️', titulo: 'Política de privacidad' },
] as const;

export default function HelpAndInfoSection() {
    const router = useRouter();

    return (
        <View style={styles.section}>
            <Text style={styles.eyebrow}>AYUDA</Text>
            <Text style={styles.title}>Ayuda e información</Text>

            <View style={styles.links}>
                {enlaces.map((enlace) => (
                    <TouchableOpacity
                        key={enlace.ruta}
                        style={styles.link}
                        onPress={() => router.push(enlace.ruta)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.icon}>{enlace.icono}</Text>
                        <Text style={styles.label}>{enlace.titulo}</Text>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },

    eyebrow: {
        marginBottom: 5,
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },

    title: {
        marginBottom: theme.spacing.sm,
        color: theme.colors.textDark,
        fontSize: 21,
        fontWeight: '700',
    },

    links: {
        gap: theme.spacing.sm,
    },

    link: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        backgroundColor: theme.colors.white,
    },

    icon: {
        marginRight: theme.spacing.sm,
        fontSize: 18,
    },

    label: {
        flex: 1,
        color: theme.colors.textDark,
        fontSize: 14,
        fontWeight: '600',
    },

    arrow: {
        color: theme.colors.textMuted,
        fontSize: 24,
    },
});
