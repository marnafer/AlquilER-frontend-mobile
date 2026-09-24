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
    View
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/api';
import { theme } from '../theme/theme';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const handleChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value
        });
    };


    const handleSubmit = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        if (!formData.email.trim()) {
            setError('El correo electrónico es obligatorio');
            setLoading(false);
            return;
        }

        if (!formData.password) {
            setError('La contraseña es obligatoria');
            setLoading(false);
            return;
        }

        try {
            const result = await loginApi({
                email: formData.email.trim(),
                contrasena: formData.password
            });

            if (result.success) {
                const token = result.data?.access_token;
                const refreshToken = result.data?.refresh_token || null;

                if (!token) {
                    setError('El servidor no devolvió un token');
                    return;
                }

                await login(token, refreshToken);

                setSuccess('Inicio de sesión correcto');

                setTimeout(() => {
                    router.replace('/home');
                }, 2000);
            } else {
                setError(
                    result.message ||
                    result.error ||
                    'Correo o contraseña incorrectos'
                );
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}

        >
            {success ? (
            <View style={styles.successToast}>
                <Text style={styles.successToastText}>
                    ✓ Inicio de sesión correcto
                </Text>
            </View>
        ) : null}
        
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Iniciar sesión</Text>

                <Text style={styles.subtitle}>
                    Ingresá a tu cuenta para continuar
                </Text>

                {error ? (
                    <View style={styles.alertError}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Correo electrónico</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="ejemplo@correo.com"
                        placeholderTextColor={theme.colors.placeholder}
                        value={formData.email}
                        onChangeText={(text) => handleChange('email', text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contraseña</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Tu contraseña"
                        placeholderTextColor={theme.colors.placeholder}
                        value={formData.password}
                        onChangeText={(text) => handleChange('password', text)}
                        secureTextEntry
                        editable={!loading}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>
                            Iniciar sesión
                        </Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        ¿No tenés una cuenta?{' '}
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.push('/register')}
                        disabled={loading}
                    >
                        <Text style={styles.link}>
                            Registrate
                        </Text>
                    </TouchableOpacity>
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

    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
    },

    title: {
        fontSize: theme.sizes.title,
        fontWeight: 'bold',
        textAlign: 'center',
        color: theme.colors.textDark,
        marginBottom: theme.spacing.sm,
    },

    subtitle: {
        fontSize: theme.sizes.body,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },

    alertError: {
        backgroundColor: theme.colors.errorBg,
        padding: theme.spacing.md,
        borderRadius: 8,
        marginBottom: theme.spacing.lg,
    },

    errorText: {
        color: theme.colors.errorText,
        textAlign: 'center',
        fontWeight: '500',
    },



    successToast: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [
            { translateX: -140 },
            { translateY: -70 },
        ],
        width: 280,
        minHeight: 140,
        zIndex: 1000,

        backgroundColor: '#DCFCE7',
        borderRadius: 12,

        justifyContent: 'center',
        alignItems: 'center',

        paddingHorizontal: 20,
        paddingVertical: 20,

        elevation: 8,

        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },

    successToastText: {
        color: '#166534',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: theme.sizes.body,
    },


    inputGroup: {
        marginBottom: theme.spacing.md,
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
        marginTop: theme.spacing.sm,
    },

    buttonDisabled: {
        backgroundColor: theme.colors.disabled,
    },

    buttonText: {
        color: '#ffffff',
        fontSize: theme.sizes.body,
        fontWeight: '600',
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.lg,
    },

    footerText: {
        color: theme.colors.text,
        fontSize: theme.sizes.body,
    },

    link: {
        color: theme.colors.primary,
        fontSize: theme.sizes.body,
        fontWeight: '600',
    },
});