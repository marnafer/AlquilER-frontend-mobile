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
import { esFechaISO, GARANTIAS } from '../utils/precalificacion';

export default function NuevaConsultaScreen() {
    const { propiedadId } = useLocalSearchParams();

    const router = useRouter();

    const [propiedad, setPropiedad] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [mensaje, setMensaje] = useState('');
    const [fechaMudanza, setFechaMudanza] = useState('');
    const [cantidadOcupantes, setCantidadOcupantes] = useState('');
    const [tieneMascotas, setTieneMascotas] = useState(null);
    const [cantidadMascotas, setCantidadMascotas] = useState('');
    const [garantias, setGarantias] = useState([]);
    const [enviando, setEnviando] = useState(false);
    const [exito, setExito] = useState('');
    const [errores, setErrores] = useState({});

    const alternarGarantia = (garantia) => {
        setGarantias((actuales) =>
            actuales.includes(garantia)
                ? actuales.filter((item) => item !== garantia)
                : [...actuales, garantia]
        );
    };

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
        const erroresValidacion = {};

        if (!texto) {
            erroresValidacion.mensaje = 'El mensaje es requerido';
        } else if (texto.length < 5) {
            erroresValidacion.mensaje =
                'El mensaje debe tener al menos 5 caracteres';
        }
        if (!esFechaISO(fechaMudanza)) {
            erroresValidacion.fecha_mudanza =
                'Ingresá una fecha válida con formato AAAA-MM-DD';
        }
        const ocupantes = Number(cantidadOcupantes);
        if (
            !Number.isInteger(ocupantes) ||
            ocupantes < 1 ||
            ocupantes > 50
        ) {
            erroresValidacion.cantidad_ocupantes =
                'Indicá entre 1 y 50 ocupantes';
        }
        if (tieneMascotas === null) {
            erroresValidacion.tiene_mascotas =
                'Indicá si tenés mascotas';
        }
        const mascotas = Number(cantidadMascotas);
        if (
            tieneMascotas &&
            (!Number.isInteger(mascotas) || mascotas < 1 || mascotas > 20)
        ) {
            erroresValidacion.cantidad_mascotas =
                'Indicá entre 1 y 20 mascotas';
        }

        setErrores(erroresValidacion);
        if (Object.keys(erroresValidacion).length > 0) {
            return;
        }

        setEnviando(true);
        setExito('');

        try {
            const result = await crearConsulta({
                propiedad_id: Number(propiedadId),
                mensaje: texto,
                perfil_interesado: {
                    fecha_mudanza: fechaMudanza,
                    cantidad_ocupantes: ocupantes,
                    tiene_mascotas: tieneMascotas,
                    cantidad_mascotas: tieneMascotas ? mascotas : 0,
                    garantias,
                },
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
        } catch (_err) {
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
                            Completá estos datos para que el propietario pueda revisar tu consulta.
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

                    <Text style={styles.helperText}>
                        Estos datos se comparten con el propietario para gestionar
                        la consulta. Sirven como referencia y no generan un
                        rechazo automático.
                    </Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>¿Cuándo querés mudarte? *</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="AAAA-MM-DD"
                            placeholderTextColor={theme.colors.textMuted}
                            value={fechaMudanza}
                            onChangeText={setFechaMudanza}
                            autoCapitalize="none"
                        />
                        {errores.fecha_mudanza ? (
                            <Text style={styles.fieldError}>{errores.fecha_mudanza}</Text>
                        ) : null}
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Cantidad de ocupantes *</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ej: 2"
                            placeholderTextColor={theme.colors.textMuted}
                            value={cantidadOcupantes}
                            onChangeText={setCantidadOcupantes}
                            keyboardType="number-pad"
                        />
                        {errores.cantidad_ocupantes ? (
                            <Text style={styles.fieldError}>{errores.cantidad_ocupantes}</Text>
                        ) : null}
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>¿Tenés mascotas? *</Text>
                        <View style={styles.choiceRow}>
                            {[true, false].map((valor) => (
                                <TouchableOpacity
                                    key={String(valor)}
                                    style={[
                                        styles.choiceButton,
                                        tieneMascotas === valor && styles.choiceButtonSelected,
                                    ]}
                                    onPress={() => {
                                        setTieneMascotas(valor);
                                        if (!valor) setCantidadMascotas('');
                                    }}
                                    accessibilityRole="radio"
                                    accessibilityState={{ selected: tieneMascotas === valor }}
                                >
                                    <Text
                                        style={[
                                            styles.choiceText,
                                            tieneMascotas === valor && styles.choiceTextSelected,
                                        ]}
                                    >
                                        {valor ? 'Sí' : 'No'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errores.tiene_mascotas ? (
                            <Text style={styles.fieldError}>{errores.tiene_mascotas}</Text>
                        ) : null}
                        {tieneMascotas ? (
                            <View style={styles.petCountField}>
                                <Text style={styles.label}>¿Cuántas? *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Ej: 1"
                                    placeholderTextColor={theme.colors.textMuted}
                                    value={cantidadMascotas}
                                    onChangeText={setCantidadMascotas}
                                    keyboardType="number-pad"
                                />
                                {errores.cantidad_mascotas ? (
                                    <Text style={styles.fieldError}>{errores.cantidad_mascotas}</Text>
                                ) : null}
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>¿Qué garantías podrías presentar?</Text>
                        {GARANTIAS.map(({ valor, etiqueta }) => {
                            const seleccionada = garantias.includes(valor);
                            return (
                                <TouchableOpacity
                                    key={valor}
                                    style={styles.guaranteeOption}
                                    onPress={() => alternarGarantia(valor)}
                                    accessibilityRole="checkbox"
                                    accessibilityState={{ checked: seleccionada }}
                                >
                                    <View
                                        style={[
                                            styles.checkbox,
                                            seleccionada && styles.checkboxSelected,
                                        ]}
                                    >
                                        {seleccionada ? (
                                            <Text style={styles.checkboxMark}>✓</Text>
                                        ) : null}
                                    </View>
                                    <Text style={styles.guaranteeText}>{etiqueta}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Tu consulta
                        </Text>

                        <TextInput
                            style={[styles.input, errores.mensaje && styles.inputError]}
                            placeholder="Ej: ¿Está disponible para mudarse en marzo?"
                            placeholderTextColor={
                                theme.colors.textMuted
                            }
                            value={mensaje}
                            onChangeText={setMensaje}
                            multiline
                            textAlignVertical="top"
                        />

                        {errores.mensaje ? (
                            <Text style={styles.fieldError}>
                                {errores.mensaje}
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

    propertyDireccion: {
        marginTop: 4,
        color: theme.colors.textMuted,
        fontSize: 13,
    },

    field: {
        marginBottom: theme.spacing.md,
    },

    helperText: {
        color: theme.colors.textMuted,
        fontSize: 13,
        lineHeight: 19,
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

    textInput: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
        paddingHorizontal: 14,
        color: theme.colors.textDark,
        fontSize: 15,
    },

    inputError: {
        borderColor: theme.colors.errorText,
    },

    choiceRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },

    choiceButton: {
        flex: 1,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
    },

    choiceButtonSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryBg,
    },

    choiceText: {
        color: theme.colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
    },

    choiceTextSelected: {
        color: theme.colors.primary,
    },

    petCountField: {
        marginTop: theme.spacing.md,
    },

    guaranteeOption: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },

    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },

    checkboxSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary,
    },

    checkboxMark: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },

    guaranteeText: {
        color: theme.colors.textDark,
        fontSize: 14,
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
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});