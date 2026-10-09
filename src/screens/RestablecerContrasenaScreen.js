import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

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
    restablecerContrasena,
} from '../services/api';
import { theme } from '../theme/theme';

export default function RestablecerContrasenaScreen() {
    const router = useRouter();

    const { token, email } = useLocalSearchParams();

    const [contrasena, setContrasena] = useState('');
    const [confirmacion, setConfirmacion] = useState('');
    const [erroresCampos, setErroresCampos] = useState({});
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [exito, setExito] = useState('');

    const contrasenaValida = (valor) => {
        if (typeof valor !== 'string' || valor.length < 6) {
            return false;
        }

        return /[A-Za-z]/.test(valor) && /[0-9]/.test(valor);
    };

    const enviar = async () => {
        setError('');
        setExito('');
        setErroresCampos({});

        if (!token || !email) {
            setError(
                'El enlace es inválido o expiró. Solicitá un nuevo enlace de recuperación.'
            );

            return;
        }

        const errores = {};

        if (!contrasenaValida(contrasena)) {
            errores.contrasena =
                'La contraseña debe tener al menos 6 caracteres e incluir letras y números.';
        }

        if (contrasena !== confirmacion) {
            errores.confirmacion =
                'Las contraseñas no coinciden.';
        }

        if (Object.keys(errores).length > 0) {
            setErroresCampos(errores);

            return;
        }

        setEnviando(true);

        const result = await restablecerContrasena({
            email: String(email),
            token: String(token),
            contrasena,
        });

        if (result.success) {
            setExito(
                result.message ||
                    'Contraseña restablecida correctamente'
            );

            setTimeout(() => {
                router.replace('/login');
            }, 1800);
        } else {
            setError(
                result.message ||
                    'No se pudo restablecer la contraseña.'
            );

            if (result.validation_errors) {
                const erroresServidor = {};

                Object.entries(
                    result.validation_errors
                ).forEach(([campo, mensajes]) => {
                    erroresServidor[campo] = Array.isArray(
                        mensajes
                    )
                        ? mensajes.join('\n')
                        : String(mensajes);
                });

                setErroresCampos(erroresServidor);
            }
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
                    title="Nueva contraseña"
                    subtitle="Definí una nueva contraseña para tu cuenta"
                />

                <View style={styles.content}>
                    {exito ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>
                                ✓ {exito}
                            </Text>
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
                                <View style={styles.field}>
                                    <Text style={styles.label}>
                                        Nueva contraseña
                                    </Text>

                                    <TextInput
                                        style={styles.input}
                                        placeholder="Mínimo 6 caracteres"
                                        placeholderTextColor={
                                            theme.colors.textMuted
                                        }
                                        secureTextEntry
                                        autoCapitalize="none"
                                        value={contrasena}
                                        onChangeText={setContrasena}
                                    />

                                    {erroresCampos.contrasena ? (
                                        <Text style={styles.fieldError}>
                                            {
                                                erroresCampos
                                                    .contrasena
                                            }
                                        </Text>
                                    ) : null}
                                </View>

                                <View style={styles.field}>
                                    <Text style={styles.label}>
                                        Confirmar contraseña
                                    </Text>

                                    <TextInput
                                        style={styles.input}
                                        placeholder="Repetí la contraseña"
                                        placeholderTextColor={
                                            theme.colors.textMuted
                                        }
                                        secureTextEntry
                                        autoCapitalize="none"
                                        value={confirmacion}
                                        onChangeText={setConfirmacion}
                                    />

                                    {erroresCampos.confirmacion ? (
                                        <Text style={styles.fieldError}>
                                            {
                                                erroresCampos
                                                    .confirmacion
                                            }
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
                                            ? 'Guardando...'
                                            : 'Restablecer contraseña'}
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
});