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
import { restablecerContrasena } from '../services/authService';
import { theme } from '../theme/theme';

export default function RestablecerContrasenaScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [confirmacion, setConfirmacion] = useState('');
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');
        setMensaje('');

        if (!email.trim() || !token.trim() || !contrasena || !confirmacion) {
            setError('Completá todos los campos');
            return;
        }

        if (contrasena !== confirmacion) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        try {
            const result = await restablecerContrasena({
                email,
                token,
                contrasena,
            });

            if (result.success) {
                setMensaje(
                    result.message || 'Contraseña restablecida correctamente'
                );

                setTimeout(() => {
                    router.replace('/login');
                }, 1800);
            } else {
                setError(
                    result.message || 'No se pudo restablecer la contraseña'
                );
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
                title="Nueva contraseña"
                subtitle="Restablecé el acceso a tu cuenta"
            />

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.description}>
                    Ingresá el correo con el que solicitaste la recuperación,
                    el token recibido por email y tu nueva contraseña.
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
                    placeholderTextColor={theme.colors.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                />

                <Text style={styles.label}>Token recibido por email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Pegá el token"
                    placeholderTextColor={theme.colors.placeholder}
                    value={token}
                    onChangeText={setToken}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                />

                <Text style={styles.label}>Nueva contraseña</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingresá la nueva contraseña"
                    placeholderTextColor={theme.colors.placeholder}
                    value={contrasena}
                    onChangeText={setContrasena}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!loading}
                />

                <Text style={styles.label}>Confirmar contraseña</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Repetí la nueva contraseña"
                    placeholderTextColor={theme.colors.placeholder}
                    value={confirmacion}
                    onChangeText={setConfirmacion}
                    secureTextEntry
                    autoCapitalize="none"
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
                            Restablecer contraseña
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
        color: theme.colors.text,
        fontSize: theme.sizes.body,
        lineHeight: 23,
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.sizes.body,
        fontWeight: '600',
        color: theme.colors.textDark,
        marginBottom: 6,
        marginTop: theme.spacing.sm,
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
