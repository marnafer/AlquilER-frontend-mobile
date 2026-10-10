import { useRouter } from 'expo-router';

import { useState } from 'react';

import {
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
import {
    recuperarContrasena,
} from '../services/api';
import { theme } from '../theme/theme';

export default function RecuperarContrasenaScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [errorCampo, setErrorCampo] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [exito, setExito] = useState('');

    const enviar = async () => {
        setError('');
        setExito('');

        if (!email.trim()) {
            setErrorCampo(
                'Ingresá tu correo electrónico.'
            );
            return;
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email.trim()
            )
        ) {
            setErrorCampo(
                'El correo electrónico no es válido.'
            );
            return;
        }

        setErrorCampo('');
        setEnviando(true);

        const result = await recuperarContrasena(
            email.trim()
        );

        if (result.success) {
            setExito(
                result.message ||
                    'Si el correo existe, recibirás un email con instrucciones para restablecer tu contraseña.'
            );
        } else {
            setError(
                result.error ||
                result.message ||
                    'No se pudo procesar la solicitud.'
            );
        }

        setEnviando(false);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === 'ios' ? 'padding' : 'height'
            }
            keyboardVerticalOffset={
                Platform.OS === 'ios' ? 90 : 0
            }
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <ScreenHeader
                    title="Recuperar contraseña"
                    subtitle="Te enviamos un email para restablecerla"
                />

                <View style={styles.content}>
                    {exito ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>
                                ✓ {exito}
                            </Text>

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={() =>
                                    router.replace('/login')
                                }
                                activeOpacity={0.85}
                            >
                                <Text style={styles.loginButtonText}>
                                    Volver al inicio de sesión
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {error ? (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>
                                        {error}
                                    </Text>
                                </View>
                            ) : null}

                            <View style={styles.card}>
                                <Text style={styles.description}>
                                    Ingresá el correo con el que te
                                    registraste y te enviaremos un
                                    enlace para restablecer tu
                                    contraseña.
                                </Text>

                                <View style={styles.field}>
                                    <Text style={styles.label}>
                                        Correo electrónico
                                    </Text>

                                    <TextInput
                                        style={styles.input}
                                        placeholder="tucorreo@ejemplo.com"
                                        placeholderTextColor={
                                            theme.colors.textMuted
                                        }
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        value={email}
                                        onChangeText={setEmail}
                                    />

                                    {errorCampo ? (
                                        <Text style={styles.fieldError}>
                                            {errorCampo}
                                        </Text>
                                    ) : null}
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.enviarButton,
                                        enviando &&
                                            styles.enviarButtonDisabled,
                                    ]}
                                    onPress={enviar}
                                    disabled={enviando}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.enviarButtonText}>
                                        {enviando
                                            ? 'Enviando...'
                                            : 'Enviar enlace'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
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
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: 100,
    },

    card: {
        padding: theme.spacing.lg,
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    description: {
        marginBottom: theme.spacing.lg,
        color: theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 20,
    },

    field: {
        marginBottom: theme.spacing.md,
    },

    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textDark,
        marginBottom: 7,
    },

    input: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.background,
        paddingHorizontal: 14,
        color: theme.colors.textDark,
        fontSize: 15,
    },

    fieldError: {
        marginTop: 5,
        fontSize: 12,
        color: theme.colors.errorText,
    },

    errorBox: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.errorBg,
    },

    errorText: {
        fontSize: 14,
        color: theme.colors.errorText,
        textAlign: 'center',
    },

    successBox: {
        padding: theme.spacing.lg,
        borderRadius: 16,
        backgroundColor: theme.colors.successBg,
        borderWidth: 1,
        borderColor: theme.colors.successBorder,
    },

    successText: {
        fontSize: 14,
        color: theme.colors.successText,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 20,
    },

    enviarButton: {
        minHeight: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
    },

    enviarButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },

    enviarButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: '700',
    },

    loginButton: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
    },

    loginButtonText: {
        color: theme.colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
});