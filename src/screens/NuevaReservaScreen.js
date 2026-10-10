import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import {
    useEffect,
    useRef,
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

const esFechaIsoValida = (valor) => {
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);

    if (!coincidencia) {
        return false;
    }

    const anio = Number(coincidencia[1]);
    const mes = Number(coincidencia[2]);
    const dia = Number(coincidencia[3]);

    if (anio < 1 || mes < 1 || mes > 12) {
        return false;
    }

    const esBisiesto =
        anio % 4 === 0 &&
        (anio % 100 !== 0 || anio % 400 === 0);
    const diasPorMes = [
        31,
        esBisiesto ? 29 : 28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];

    return dia >= 1 && dia <= diasPorMes[mes - 1];
};

export default function NuevaReservaScreen() {
    const { propiedadId } = useLocalSearchParams();

    const router = useRouter();
    const parametroPropiedadId = Array.isArray(propiedadId)
        ? propiedadId[0]
        : propiedadId;
    const idPropiedad =
        typeof parametroPropiedadId === 'string' &&
        /^\d+$/.test(parametroPropiedadId) &&
        Number.isSafeInteger(Number(parametroPropiedadId)) &&
        Number(parametroPropiedadId) > 0
            ? Number(parametroPropiedadId)
            : null;

    const [propiedad, setPropiedad] = useState(null);
    const [loading, setLoading] = useState(true);
    const [intentoCarga, setIntentoCarga] = useState(0);
    const [error, setError] = useState('');

    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [mensajeExito, setMensajeExito] = useState('');
    const [erroresCampos, setErroresCampos] = useState({});
    const envioEnCurso = useRef(false);
    const redireccionTimeout = useRef(null);

    useEffect(() => {
        let activo = true;

        const cargarPropiedad = async () => {
            setLoading(true);
            setError('');
            setPropiedad(null);

            if (!idPropiedad) {
                setError('No se indicó una propiedad válida.');
                setLoading(false);
                return;
            }

            try {
                const res = await api.get(
                    `/propiedades/${idPropiedad}`
                );

                const propiedadCargada = res.data?.data;

                if (!propiedadCargada) {
                    if (activo) {
                        setError(
                            'No se encontró la información de la propiedad.'
                        );
                    }

                    return;
                }

                if (activo) {
                    setPropiedad(propiedadCargada);
                }
            } catch (err) {
                console.error(
                    'NUEVA RESERVA: error al cargar propiedad',
                    err
                );

                if (activo) {
                    setError(
                        'No se pudo cargar la información de la propiedad.'
                    );
                }
            } finally {
                if (activo) {
                    setLoading(false);
                }
            }
        };

        cargarPropiedad();

        return () => {
            activo = false;
        };
    }, [idPropiedad, intentoCarga]);

    useEffect(
        () => () => {
            if (redireccionTimeout.current) {
                clearTimeout(redireccionTimeout.current);
            }
        },
        []
    );

    const actualizarFecha = (campo, valor) => {
        if (campo === 'fechaInicio') {
            setFechaInicio(valor);
        } else {
            setFechaFin(valor);
        }

        setErroresCampos((actuales) => ({
            ...actuales,
            [campo]: undefined,
        }));
        setError('');
    };

    const propiedadNoDisponible =
        propiedad?.disponible === false ||
        propiedad?.disponible === 0 ||
        propiedad?.disponible === '0';

    const enviarReserva = async () => {
        if (
            envioEnCurso.current ||
            mensajeExito ||
            propiedadNoDisponible ||
            !idPropiedad ||
            !propiedad
        ) {
            return;
        }

        const hoy = fechaLocalHoy();
        const inicio = fechaInicio.trim();
        const fin = fechaFin.trim();
        const inicioValido = esFechaIsoValida(inicio);
        const finValido = esFechaIsoValida(fin);

        const errores = {};

        if (!inicio) {
            errores.fechaInicio =
                'La fecha de inicio es requerida';
        } else if (!inicioValido) {
            errores.fechaInicio =
                'Ingresá una fecha válida con el formato AAAA-MM-DD';
        } else if (inicio < hoy) {
            errores.fechaInicio =
                'La fecha de inicio no puede ser anterior a hoy';
        }

        if (!fin) {
            errores.fechaFin =
                'La fecha de fin es requerida';
        } else if (!finValido) {
            errores.fechaFin =
                'Ingresá una fecha válida con el formato AAAA-MM-DD';
        } else if (
            inicioValido &&
            finValido &&
            fin <= inicio
        ) {
            errores.fechaFin =
                'La fecha de fin debe ser posterior a la de inicio';
        }

        if (Object.keys(errores).length > 0) {
            setErroresCampos(errores);

            return;
        }

        setErroresCampos({});
        setError('');
        envioEnCurso.current = true;
        setEnviando(true);
        setMensajeExito('');

        try {
            const result = await crearReserva({
                propiedad_id: idPropiedad,
                fecha_inicio_alquiler: inicio,
                fecha_fin_alquiler: fin,
            });

            if (result?.success) {
                setMensajeExito(
                    result.message ||
                        'Reserva solicitada correctamente. El propietario la revisará en tu panel de reservas.'
                );

                redireccionTimeout.current = setTimeout(() => {
                    router.replace('/reservas');
                }, 1800);
            } else {
                const validationErrors = result?.validation_errors;

                if (
                    validationErrors &&
                    typeof validationErrors === 'object'
                ) {
                    const erroresMap = {};
                    const camposFecha = {
                        fecha_inicio_alquiler: 'fechaInicio',
                        fechaInicio: 'fechaInicio',
                        fecha_fin_alquiler: 'fechaFin',
                        fechaFin: 'fechaFin',
                    };

                    Object.entries(validationErrors).forEach(
                        ([campo, mensajes]) => {
                            const claveVisible = camposFecha[campo];
                            const texto = Array.isArray(mensajes)
                                ? mensajes.join('\n')
                                : String(mensajes ?? '');

                            if (claveVisible) {
                                erroresMap[claveVisible] = texto;
                            }
                        }
                    );

                    setErroresCampos(erroresMap);
                }

                setError(
                    result?.error ||
                    result?.message ||
                        'No se pudo crear la reserva. Revisá los datos e intentá nuevamente.'
                );
            }
        } catch (err) {
            console.error(
                'NUEVA RESERVA: error al crear la reserva',
                err
            );
            setError(
                'Error de conexión al crear la reserva.'
            );
        } finally {
            envioEnCurso.current = false;
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

    if (!propiedad) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyStateTitle}>
                    {error || 'No se pudo cargar la propiedad.'}
                </Text>

                {idPropiedad ? (
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() =>
                            setIntentoCarga((actual) => actual + 1)
                        }
                        activeOpacity={0.85}
                    >
                        <Text style={styles.retryButtonText}>
                            Reintentar
                        </Text>
                    </TouchableOpacity>
                ) : null}
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
                            <Text style={styles.propertyExpensas}>
                                Expensas: $
                                {Number(
                                    propiedad.expensas
                                ).toLocaleString('es-AR')}
                            </Text>
                        ) : null}
                    </View>

                    {propiedadNoDisponible ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>
                                Esta propiedad no está disponible para reservas.
                            </Text>
                        </View>
                    ) : error ? (
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
                            onChangeText={(valor) =>
                                actualizarFecha('fechaInicio', valor)
                            }
                            keyboardType="numbers-and-punctuation"
                            maxLength={10}
                            autoCapitalize="none"
                            editable={
                                !enviando &&
                                !mensajeExito &&
                                !propiedadNoDisponible
                            }
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
                            onChangeText={(valor) =>
                                actualizarFecha('fechaFin', valor)
                            }
                            keyboardType="numbers-and-punctuation"
                            maxLength={10}
                            autoCapitalize="none"
                            editable={
                                !enviando &&
                                !mensajeExito &&
                                !propiedadNoDisponible
                            }
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
                            (enviando ||
                                Boolean(mensajeExito) ||
                                propiedadNoDisponible) &&
                                styles.bookButtonDisabled,
                        ]}
                        onPress={enviarReserva}
                        disabled={
                            enviando ||
                            Boolean(mensajeExito) ||
                            propiedadNoDisponible
                        }
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

    emptyStateTitle: {
        marginHorizontal: theme.spacing.lg,
        color: theme.colors.textDark,
        fontSize: 16,
        textAlign: 'center',
    },

    retryButton: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
    },

    retryButtonText: {
        color: theme.colors.white,
        fontSize: 15,
        fontWeight: '700',
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