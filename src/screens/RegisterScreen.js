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

import { register } from '../services/api';
import { theme } from '../theme/theme';

export default function RegisterScreen() {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        password_confirm: '',
        telefono: '',
        domicilio: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const router = useRouter();

    const primerErrorValidacion = (result) => {
        const validationErrors = result?.validation_errors;

        if (!validationErrors) {
            return '';
        }

        const primerCampo = Object.values(validationErrors)[0];

        return Array.isArray(primerCampo) && primerCampo.length > 0
            ? primerCampo[0]
            : '';
    };

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

        if (formData.password !== formData.password_confirm) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        const telefonoDigitos = (formData.telefono || '').replace(/\D/g, '');

        if (telefonoDigitos.length < 6) {
            setError('El teléfono debe tener al menos 6 dígitos');
            setLoading(false);
            return;
        }

        if (telefonoDigitos.length > 15) {
            setError('El teléfono no puede superar los 15 dígitos');
            setLoading(false);
            return;
        }

        if ((formData.domicilio || '').trim().length < 5) {
            setError('El domicilio debe tener al menos 5 caracteres');
            setLoading(false);
            return;
        }

        const dataToSend = {
            nombre: formData.nombre,
            apellido: formData.apellido,
            email: formData.email,
            contrasena: formData.password,
            telefono: formData.telefono,
            domicilio: formData.domicilio
        };

        try {
            const result = await register(dataToSend);

            if (result.success) {
                setSuccess('Usuario registrado correctamente');

                setTimeout(() => {
                    router.replace('/login');
                }, 2000);
            } else {
                setError(
                    primerErrorValidacion(result) ||
                    result.error ||
                    result.message ||
                    'Error al registrarse'
                );
            }
        } catch (error) {
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
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Crear cuenta</Text>

                <Text style={styles.subtitle}>
                    Registrate para alquilar o publicar propiedades
                </Text>

                {success ? (
                    <View style={styles.alertSuccess}>
                        <Text style={styles.successText}>{success}</Text>
                    </View>
                ) : null}

                {error ? (
                    <View style={styles.alertError}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <View style={styles.row}>
                    <View style={styles.inputGroupHalf}>
                        <Text style={styles.label}>Nombre</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Tu nombre"
                            placeholderTextColor={theme.colors.placeholder}
                            value={formData.nombre}
                            onChangeText={(text) =>
                                handleChange('nombre', text)
                            }
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.inputGroupHalf}>
                        <Text style={styles.label}>Apellido</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Tu apellido"
                            placeholderTextColor={theme.colors.placeholder}
                            value={formData.apellido}
                            onChangeText={(text) =>
                                handleChange('apellido', text)
                            }
                            autoCapitalize="words"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Correo electrónico</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="ejemplo@correo.com"
                        placeholderTextColor={theme.colors.placeholder}
                        value={formData.email}
                        onChangeText={(text) =>
                            handleChange('email', text)
                        }
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contraseña</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Mínimo 6 caracteres"
                        placeholderTextColor={theme.colors.placeholder}
                        value={formData.password}
                        onChangeText={(text) =>
                            handleChange('password', text)
                        }
                        secureTextEntry
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirmar contraseña</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Repetí tu contraseña"
                        placeholderTextColor={theme.colors.placeholder}
                        value={formData.password_confirm}
                        onChangeText={(text) =>
                            handleChange('password_confirm', text)
                        }
                        secureTextEntry
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Teléfono</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Ej: 341 1234567"
                        placeholderTextColor={theme.colors.placeholder}
                        value={formData.telefono}
                        onChangeText={(text) =>
                            handleChange('telefono', text)
                        }
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Domicilio</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Ej: Av. San Martín 123"
                        placeholderTextColor={theme.colors.placeholder}
                        value={formData.domicilio}
                        onChangeText={(text) =>
                            handleChange('domicilio', text)
                        }
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.button,
                        loading && styles.buttonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>
                            Crear cuenta
                        </Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        ¿Ya tenés cuenta?{' '}
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.push('/')}
                    >
                        <Text style={styles.link}>
                            Iniciá sesión
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

    alertSuccess: {
    backgroundColor: '#DCFCE7',
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.lg,
    },

    successText: {
        color: '#166534',
        textAlign: 'center',
        fontWeight: '500',
    },

    row: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },

    inputGroup: {
        marginBottom: theme.spacing.md,
    },

    inputGroupHalf: {
        flex: 1,
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