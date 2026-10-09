import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import {
    useEffect,
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

import api, {
    crearConsulta,
} from '../services/api';
import { theme } from '../theme/theme';

export default function NuevaConsultaScreen() {
    const { propiedadId } = useLocalSearchParams();

    const router = useRouter();

    const [propiedad, setPropiedad] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [mensaje, setMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [exito, setExito] = useState('');
    const [errorCampo, setErrorCampo] = useState('');

    useEffect(() => {
        const cargarPropiedad = async () => {
            if (!propiedadId) {
                setError('No se indicó una propiedad.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');

                const res = await api.get(
                    `/propiedades/${propiedadId}`
                );

                setPropiedad(res.data?.data ?? null);
            } catch (err) {
                console.error(
                    'NUEVA CONSULTA: error al cargar propiedad',
                    err
                );

                setError(
                    'No se pudo cargar la información de la propiedad.'
                );
            } finally {
                setLoading(false);
            }
        };

        cargarPropiedad();
    }, [propiedadId]);

    const enviarConsulta = async () => {
        const texto = mensaje.trim();

        if (!texto) {
            setErrorCampo('El mensaje es requerido');

            return;
        }

        if (texto.length < 5) {
            setErrorCampo(
                'El mensaje debe tener al menos 5 caracteres'
            );

            return;
        }

        setErrorCampo('');
        setEnviando(true);
        setExito('');

        try {
            const result = await crearConsulta({
                propiedad_id: Number(propiedadId),
                mensaje: texto,
            });

            if (result.success) {
                setExito(
                    result.message ||
                        'Consulta enviada correctamente. El propietario la podrá ver en su panel de consultas.'
                );

                setTimeout(() => {
                    router.replace('/consultas');
                }, 1800);
            } else {
                setError(
                    result.error ||
                    result.message ||
                    'No se pudo enviar la consulta.'
                );
            }
        } catch (err) {
            setError(
                'Error de conexión al enviar la consulta.'
            );
        } finally {
            setEnviando(false);
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
                    Cargando propiedad...
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
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        Consultar propiedad
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Escribile al propietario tu consulta
                    </Text>
                </View>

                <View style={styles.content}>
                    {propiedad ? (
                        <View style={styles.propertyCard}>
                            <Text
                                style={styles.propertyTitle}
                                numberOfLines={2}
                            >
                                {propiedad.titulo}
                            </Text>

                            <Text style={styles.propertyDireccion}>
                                {propiedad.direccion}
                            </Text>
                        </View>
                    ) : null}

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>
                                {error}
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Tu consulta
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Ej: ¿Está disponible para mudarse en marzo?"
                            placeholderTextColor={
                                theme.colors.textMuted
                            }
                            value={mensaje}
                            onChangeText={setMensaje}
                            multiline
                            textAlignVertical="top"
                        />

                        {errorCampo ? (
                            <Text style={styles.fieldError}>
                                {errorCampo}
                            </Text>
                        ) : null}
                    </View>

                    {exito ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>
                                ✓ {exito}
                            </Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            enviando && styles.sendButtonDisabled,
                        ]}
                        onPress={enviarConsulta}
                        disabled={enviando}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.sendButtonText}>
                            {enviando
                                ? 'Enviando consulta...'
                                : 'Enviar consulta'}
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

    header: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
        backgroundColor: theme.colors.primary,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },

    headerTitle: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
    },

    headerSubtitle: {
        marginTop: theme.spacing.sm,
        color: '#ffffff',
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.9,
    },

    content: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: 100,
    },

    propertyCard: {
        padding: theme.spacing.md,
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.lg,
    },

    propertyTitle: {
        color: theme.colors.textDark,
        fontSize: 17,
        fontWeight: '700',
    },

    propertyDireccion: {
        marginTop: 4,
        color: theme.colors.textMuted,
        fontSize: 13,
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
        minHeight: 120,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 12,
        color: theme.colors.textDark,
        fontSize: 15,
    },

    fieldError: {
        marginTop: 5,
        fontSize: 12,
        color: theme.colors.errorText,
    },

    errorBox: {
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.errorBg,
        marginBottom: theme.spacing.md,
    },

    errorText: {
        color: theme.colors.errorText,
        fontSize: 14,
        textAlign: 'center',
    },

    successBox: {
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: '#dcfce7',
        marginBottom: theme.spacing.md,
    },

    successText: {
        color: '#16a34a',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },

    sendButton: {
        minHeight: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
    },

    sendButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },

    sendButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});