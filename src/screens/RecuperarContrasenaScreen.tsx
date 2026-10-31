import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { solicitarRecuperacion } from '../services/authService';
import { theme } from '../theme/theme';

export default function RecuperarContrasenaScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');
        setMensaje('');

        if (!email.trim()) {
            setError('El correo electrónico es obligatorio');
            return;
        }

        setLoading(true);

        try {
            const result = await solicitarRecuperacion(email);

            if (result.success) {
                setMensaje(
                    result.message ||
                    'Si el correo existe, recibirás un enlace para restablecer tu contraseña.'
                );
            } else {
                setError(result.message || 'No se pudo procesar la solicitud');
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScreenHeader
                title="Recuperar contraseña"
                subtitle="Te ayudamos a recuperar el acceso"
            />

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.description}>
                    Ingresá el correo asociado a tu cuenta. Si existe,
                    recibirás un email con las instrucciones para restablecer
                    tu contraseña.
                </Text>

                {error ? (
                    <View style={styles.alertError}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {mensaje ? (
                    <View style={styles.alertSuccess}>
                        <Text style={styles.successText}>{mensaje}</Text>
                    </View>
                ) : null}

                <Text style={styles.label}>Correo electrónico</Text>

                <TextInput
                    style={styles.input}
                    placeholder="ejemplo@correo.com"
                    placeholderTextColor={theme.colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.disabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>
                            Enviar instrucciones
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace('/login')}
                    disabled={loading}
                >
                    <Text style={styles.link}>Volver al inicio de sesión</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push('/restablecer-contrasena')}
                    disabled={loading}
                >
                    <Text style={styles.link}>
                        Ya tengo el token
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
        paddingBottom: 120,
    },
    description: {
        color: theme.colors.textDark,
        fontSize: theme.sizes.body,
        lineHeight: 23,
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.sizes.body,
        fontWeight: '600',
        color: theme.colors.textDark,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.inputBg,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: theme.sizes.input,
        color: theme.colors.textDark,
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: theme.spacing.lg,
    },
    disabled: {
        backgroundColor: theme.colors.disabled,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: theme.sizes.body,
        fontWeight: '600',
    },
    alertError: {
        backgroundColor: theme.colors.errorBg,
        padding: theme.spacing.md,
        borderRadius: 8,
        marginBottom: theme.spacing.md,
    },
    errorText: {
        color: theme.colors.errorText,
        textAlign: 'center',
    },
    alertSuccess: {
        backgroundColor: '#DCFCE7',
        padding: theme.spacing.md,
        borderRadius: 8,
        marginBottom: theme.spacing.md,
    },
    successText: {
        color: '#166534',
        textAlign: 'center',
    },
    backButton: {
        alignItems: 'center',
        marginTop: theme.spacing.lg,
    },
    link: {
        color: theme.colors.primary,
        fontSize: theme.sizes.body,
        fontWeight: '600',
        textAlign: 'center',
    },
});
