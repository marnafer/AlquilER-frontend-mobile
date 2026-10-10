import {
    useFocusEffect,
    useRouter,
} from 'expo-router';

import {
    useCallback,
    useState,
} from 'react';

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
import {
    actualizarPerfil,
    obtenerPerfil,
} from '../services/api';
import { theme } from '../theme/theme';

export default function EditarPerfilScreen() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [erroresCampos, setErroresCampos] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [exito, setExito] = useState('');
    const [contrasenaNueva, setContrasenaNueva] = useState('');
    const [repetirContrasena, setRepetirContrasena] = useState('');
    const [erroresContrasena, setErroresContrasena] = useState({});
    const [errorContrasena, setErrorContrasena] = useState('');
    const [exitoContrasena, setExitoContrasena] = useState('');
    const [guardandoContrasena, setGuardandoContrasena] = useState(false);

    const [usuario, setUsuario] = useState(null);

    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [domicilio, setDomicilio] = useState('');

    const cargarPerfil = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await obtenerPerfil();

            if (response?.success && response.data) {
                setUsuario(response.data);

                setNombre(response.data.nombre || '');
                setApellido(response.data.apellido || '');
                setEmail(response.data.email || '');
                setTelefono(response.data.telefono || '');
                setDomicilio(response.data.domicilio || '');
            } else {
                setError(
                    response?.error ||
                    response?.message ||
                        'No se pudo cargar tu perfil'
                );
            }
        } catch (_err) {
            setError('No se pudo cargar tu perfil');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            cargarPerfil();
        }, [cargarPerfil])
    );

    const guardar = async () => {
        const errores = {};

        if (!nombre.trim()) {
            errores.nombre = 'El nombre es obligatorio.';
        }

        if (!email.trim()) {
            errores.email = 'El email es obligatorio.';
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email.trim()
            )
        ) {
            errores.email = 'El email no es válido.';
        }

        if (Object.keys(errores).length > 0) {
            setErroresCampos(errores);

            return;
        }

        setErroresCampos({});
        setError('');
        setExito('');
        setGuardando(true);

        const result = await actualizarPerfil(usuario.id, {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            email: email.trim(),
            telefono: telefono.trim(),
            domicilio: domicilio.trim(),
        });

        if (result.success) {
            setExito(
                result.message ||
                    'Perfil actualizado correctamente'
            );

            setTimeout(() => {
                router.replace('/profile');
            }, 1600);
        } else {
            setError(
                result.error ||
                result.message ||
                    'No se pudo guardar los cambios.'
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

        setGuardando(false);
    };

    const cambiarContrasena = async () => {
        const errores = {};

        if (!contrasenaNueva) {
            errores.nueva = 'Ingresá la nueva contraseña.';
        } else if (contrasenaNueva.length < 8) {
            errores.nueva =
                'La contraseña debe tener al menos 8 caracteres.';
        }

        if (repetirContrasena !== contrasenaNueva) {
            errores.repetir = 'Las contraseñas no coinciden.';
        }

        setErroresContrasena(errores);
        setErrorContrasena('');
        setExitoContrasena('');

        if (Object.keys(errores).length > 0) {
            return;
        }

        setGuardandoContrasena(true);

        try {
            const result = await actualizarPerfil(usuario.id, {
                contrasena: contrasenaNueva,
            });

            if (!result?.success) {
                setErrorContrasena(
                    result?.error ||
                        result?.message ||
                        'No se pudo cambiar la contraseña.'
                );

                if (result?.validation_errors) {
                    setErroresContrasena((actuales) => ({
                        ...actuales,
                        ...result.validation_errors,
                    }));
                }

                return;
            }

            setContrasenaNueva('');
            setRepetirContrasena('');
            setErroresContrasena({});
            setExitoContrasena(
                result.message ||
                    'Contraseña cambiada correctamente.'
            );
        } catch (err) {
            console.error(
                'EDIT PROFILE: error al cambiar contraseña',
                err
            );
            setErrorContrasena(
                'No se pudo cambiar la contraseña. Intentá nuevamente.'
            );
        } finally {
            setGuardandoContrasena(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Cargando tu perfil...
                </Text>
            </View>
        );
    }

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
                    title="Editar perfil"
                    subtitle="Actualizá tus datos personales"
                />

                <View style={styles.content}>
                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>
                                {error}
                            </Text>
                        </View>
                    ) : null}

                    {exito ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>
                                ✓ {exito}
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.card}>
                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Nombre
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Tu nombre"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                value={nombre}
                                onChangeText={setNombre}
                            />

                            {erroresCampos.nombre ? (
                                <Text style={styles.fieldError}>
                                    {erroresCampos.nombre}
                                </Text>
                            ) : null}
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Apellido
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Tu apellido"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                value={apellido}
                                onChangeText={setApellido}
                            />

                            {erroresCampos.apellido ? (
                                <Text style={styles.fieldError}>
                                    {erroresCampos.apellido}
                                </Text>
                            ) : null}
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Email
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="tucorreo@ejemplo.com"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />

                            {erroresCampos.email ? (
                                <Text style={styles.fieldError}>
                                    {erroresCampos.email}
                                </Text>
                            ) : null}
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Teléfono
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ej: 11 1234 5678"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                keyboardType="phone-pad"
                                value={telefono}
                                onChangeText={setTelefono}
                            />

                            {erroresCampos.telefono ? (
                                <Text style={styles.fieldError}>
                                    {erroresCampos.telefono}
                                </Text>
                            ) : null}
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Domicilio
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Av. Siempre Viva 742"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                value={domicilio}
                                onChangeText={setDomicilio}
                            />

                            {erroresCampos.domicilio ? (
                                <Text style={styles.fieldError}>
                                    {erroresCampos.domicilio}
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            guardando && styles.saveButtonDisabled,
                        ]}
                        onPress={guardar}
                        disabled={guardando}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.saveButtonText}>
                            {guardando
                                ? 'Guardando...'
                                : 'Guardar cambios'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.card, styles.passwordCard]}>
                    <Text style={styles.sectionTitle}>
                        Cambiar contraseña
                    </Text>
                    <Text style={styles.passwordHelp}>
                        Definí una nueva contraseña de al menos 8
                        caracteres.
                    </Text>

                    {errorContrasena ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>
                                {errorContrasena}
                            </Text>
                        </View>
                    ) : null}

                    {exitoContrasena ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>
                                ✓ {exitoContrasena}
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Nueva contraseña
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Mínimo 8 caracteres"
                            placeholderTextColor={theme.colors.textMuted}
                            value={contrasenaNueva}
                            onChangeText={setContrasenaNueva}
                            secureTextEntry
                            autoCapitalize="none"
                            textContentType="newPassword"
                        />
                        {erroresContrasena.nueva ? (
                            <Text style={styles.fieldError}>
                                {erroresContrasena.nueva}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Repetir contraseña
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Repetí la nueva contraseña"
                            placeholderTextColor={theme.colors.textMuted}
                            value={repetirContrasena}
                            onChangeText={setRepetirContrasena}
                            secureTextEntry
                            autoCapitalize="none"
                            textContentType="newPassword"
                        />
                        {erroresContrasena.repetir ? (
                            <Text style={styles.fieldError}>
                                {erroresContrasena.repetir}
                            </Text>
                        ) : null}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            guardandoContrasena &&
                                styles.saveButtonDisabled,
                        ]}
                        onPress={cambiarContrasena}
                        disabled={guardandoContrasena}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.saveButtonText}>
                            {guardandoContrasena
                                ? 'Actualizando...'
                                : 'Actualizar contraseña'}
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

    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },

    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 14,
    },

    content: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: 100,
    },

    card: {
        padding: theme.spacing.md,
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    passwordCard: {
        marginTop: theme.spacing.lg,
    },

    sectionTitle: {
        marginBottom: theme.spacing.xs,
        color: theme.colors.textDark,
        fontSize: 18,
        fontWeight: '700',
    },

    passwordHelp: {
        marginBottom: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 13,
        lineHeight: 19,
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
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.successBg,
    },

    successText: {
        fontSize: 14,
        color: theme.colors.successText,
        fontWeight: '600',
        textAlign: 'center',
    },

    saveButton: {
        minHeight: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
    },

    saveButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },

    saveButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});