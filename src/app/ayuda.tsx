import { useRouter } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { theme } from '../theme/theme';

const opciones = [
    {
        ruta: '/contacto',
        icono: '✉️',
        titulo: 'Contacto',
        descripcion: 'Escribinos o consultá nuestros canales de atención.',
    },
    {
        ruta: '/preguntas-frecuentes',
        icono: '❔',
        titulo: 'Preguntas frecuentes',
        descripcion: 'Encontrá respuestas sobre alquileres y reservas.',
    },
    {
        ruta: '/terminos',
        icono: '📄',
        titulo: 'Términos y condiciones',
        descripcion: 'Conocé las condiciones de uso de AlquilER.',
    },
    {
        ruta: '/privacidad',
        icono: '🛡️',
        titulo: 'Política de privacidad',
        descripcion: 'Consultá cómo cuidamos y usamos tus datos.',
    },
] as const;

export default function AyudaScreen() {
    const router = useRouter();

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <ScreenHeader
                title="Ayuda e información"
                subtitle="Estamos para acompañarte en tu experiencia con AlquilER."
                showBackButton
            />

            <View style={styles.options}>
                {opciones.map((opcion) => (
                    <TouchableOpacity
                        key={opcion.ruta}
                        style={styles.option}
                        onPress={() => router.push(opcion.ruta)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.icon}>{opcion.icono}</Text>
                        <View style={styles.optionContent}>
                            <Text style={styles.title}>{opcion.titulo}</Text>
                            <Text style={styles.description}>
                                {opcion.descripcion}
                            </Text>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        paddingBottom: 100,
    },
    options: {
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    option: {
        minHeight: 84,
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 14,
        backgroundColor: theme.colors.white,
    },
    icon: {
        marginRight: theme.spacing.md,
        fontSize: 24,
    },
    optionContent: {
        flex: 1,
    },
    title: {
        marginBottom: 4,
        color: theme.colors.textDark,
        fontSize: 15,
        fontWeight: '700',
    },
    description: {
        color: theme.colors.textMuted,
        fontSize: 13,
        lineHeight: 18,
    },
    arrow: {
        marginLeft: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 26,
    },
});
