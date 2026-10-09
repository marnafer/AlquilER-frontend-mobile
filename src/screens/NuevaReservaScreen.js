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
    crearReserva,
} from '../services/api';
import { theme } from '../theme/theme';
import {
    fechaLocalHoy,
} from '../utils/formato';

export default function NuevaReservaScreen() {
    const { propiedadId } = useLocalSearchParams();

    const router = useRouter();

    const [propiedad, setPropiedad] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [mensajeExito, setMensajeExito] = useState('');
    const [erroresCampos, setErroresCampos] = useState({});

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
                    'NUEVA RESERVA: error al cargar propiedad',
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

    const enviarReserva = async () => {
        const hoy = fechaLocalHoy();

        const errores = {};

        if (!fechaInicio.trim()) {
            errores.fechaInicio =
                'La fecha de inicio es requerida';
        } else if (fechaInicio.trim() < hoy) {
            errores.fechaInicio =
                'La fecha de inicio no puede ser anterior a hoy';
        }

        if (!fechaFin.trim()) {
            errores.fechaFin =
                'La fecha de fin es requerida';
        } else if (
            fechaInicio.trim() &&
            fechaFin.trim() <= fechaInicio.trim()
        ) {
            errores.fechaFin =
                'La fecha de fin debe ser posterior a la de inicio';
        }

        if (Object.keys(errores).length > 0) {
            setErroresCampos(errores);

            return;
        }

        setErroresCampos({});
        setEnviando(true);
        setMensajeExito('');

        try {
            const result = await crearReserva({
                propiedad_id: Number(propiedadId),
                fecha_inicio_alquiler: fechaInicio.trim(),
                fecha_fin_alquiler: fechaFin.trim(),
            });

            if (result.success) {
                setMensajeExito(
                    result.message ||
                        'Reserva solicitada correctamente. El propietario la revisará en tu panel de reservas.'
                );

                setTimeout(() => {
                    router.replace('/reservas');
                }, 1800);
            } else {
                const validationErrors =
                    result.validation_errors;

                if (
                    validationErrors &&
                    typeof validationErrors === 'object'
                ) {
                    const erroresMap = {};

                    Object.entries(validationErrors).forEach(
                        ([campo, mensajes]) => {
                            erroresMap[campo] = Array.isArray(
                                mensajes
                            )
                                ? mensajes.join('\n')
                                : String(mensajes);
                        }
                    );

                    setErroresCampos(erroresMap);
                } else {
                    setError(
                        result.message ||
                        'No se pudo crear la reserva.'
                    );
                }
            }
        } catch (err) {
            setError(
                'Error de conexión al crear la reserva.'
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
                        Reservar propiedad
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Elegí las fechas de tu alquiler
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

                            <Text style={styles.propertyPrice}>
                                ${Number(propiedad.precio || 0).toLocaleString(
                                    'es-AR'
                                )}
                            </Text>

                            {propiedad.expensas > 0 ? (
                                <Text
                                    style={styles.propertyExpensas}
                                >
                                    Expensas: $
                                    {Number(
                                        propiedad.expensas
                                    ).toLocaleString('es-AR')}
                                </Text>
                            ) : null}
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
                            Fecha de inicio
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="AAAA-MM-DD"
                            placeholderTextColor={
                                theme.colors.textMuted
                            }
                            value={fechaInicio}
                            onChangeText={setFechaInicio}
                            autoCapitalize="none"
                        />

                        {erroresCampos.fechaInicio ? (
                            <Text style={styles.fieldError}>
                                {erroresCampos.fechaInicio}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Fecha de fin
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="AAAA-MM-DD"
                            placeholderTextColor={
                                theme.colors.textMuted
                            }
                            value={fechaFin}
                            onChangeText={setFechaFin}
                            autoCapitalize="none"
                        />

                        {erroresCampos.fechaFin ? (
                            <Text style={styles.fieldError}>
                                {erroresCampos.fechaFin}
                            </Text>
                        ) : null}
                    </View>

                    {mensajeExito ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>
                                ✓ {mensajeExito}
                            </Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[
                            styles.bookButton,
                            enviando && styles.bookButtonDisabled,
                        ]}
                        onPress={enviarReserva}
                        disabled={enviando}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.bookButtonText}>
                            {enviando
                                ? 'Enviando solicitud...'
                                : 'Solicitar reserva'}
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
        color: theme.colors.white,
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
    },

    headerSubtitle: {
        marginTop: theme.spacing.sm,
        color: theme.colors.white,
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

    propertyPrice: {
        marginTop: theme.spacing.sm,
        color: theme.colors.primary,
        fontSize: 22,
        fontWeight: '700',
    },

    propertyExpensas: {
        marginTop: 3,
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
        minHeight: 48,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
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
        backgroundColor: theme.colors.successBg,
        marginBottom: theme.spacing.md,
    },

    successText: {
        color: theme.colors.successText,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },

    bookButton: {
        minHeight: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
    },

    bookButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },

    bookButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});