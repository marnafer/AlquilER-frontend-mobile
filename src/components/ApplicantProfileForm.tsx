import { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { theme } from '@/theme/theme';
import { crearConsulta } from '../services/messageService';

interface PerfilInteresado {
    fecha_mudanza: string;
    cantidad_ocupantes: number;
    tiene_mascotas: boolean;
    cantidad_mascotas: number;
    garantias: string[];
}

interface ErroresPerfil {
    fecha_mudanza?: string;
    cantidad_ocupantes?: string;
    tiene_mascotas?: string;
    cantidad_mascotas?: string;
    garantias?: string;
    general?: string;
}

interface Props {
    propiedadId: number;
    onCancel: () => void;
    onConsultaCreada: (consultaId: number) => void;
}

const OPCIONES_GARANTIA = [
    { value: 'recibo_sueldo', label: 'Recibo de sueldo' },
    { value: 'garantia_propietaria', label: 'Garantía propietaria' },
    { value: 'seguro_caucion', label: 'Seguro de caución' },
    { value: 'garante', label: 'Garante' },
];

export default function PerfilInteresadoForm({
    propiedadId,
    onCancel,
    onConsultaCreada,
}: Props) {
    const [fechaMudanza, setFechaMudanza] = useState('');
    const [cantidadOcupantes, setCantidadOcupantes] = useState('1');
    const [tieneMascotas, setTieneMascotas] = useState(false);
    const [cantidadMascotas, setCantidadMascotas] = useState('0');
    const [garantias, setGarantias] = useState<string[]>([]);
    const [errores, setErrores] = useState<ErroresPerfil>({});
    const [enviando, setEnviando] = useState(false);

    const enviarConsulta = async () => {
        if (enviando) return;

        setErrores({});

        const erroresValidacion: ErroresPerfil = {};

        const fechaValida =
            /^\d{4}-\d{2}-\d{2}$/.test(fechaMudanza) &&
            !Number.isNaN(Date.parse(`${fechaMudanza}T00:00:00`)) &&
            new Date(`${fechaMudanza}T00:00:00`)
                .toISOString()
                .slice(0, 10) === fechaMudanza;

        if (!fechaValida) {
            erroresValidacion.fecha_mudanza =
                'Ingresá una fecha válida en formato AAAA-MM-DD.';
        }

        const ocupantes = Number(cantidadOcupantes);
        const mascotas = Number(cantidadMascotas);

        if (
            !Number.isInteger(ocupantes) ||
            ocupantes < 1 ||
            ocupantes > 50
        ) {
            erroresValidacion.cantidad_ocupantes =
                'La cantidad de ocupantes debe estar entre 1 y 50.';
        }

        if (
            !Number.isInteger(mascotas) ||
            mascotas < 0 ||
            mascotas > 20 ||
            (tieneMascotas && mascotas < 1) ||
            (!tieneMascotas && mascotas !== 0)
        ) {
            erroresValidacion.cantidad_mascotas = tieneMascotas
                ? 'Indicá entre 1 y 20 mascotas.'
                : 'La cantidad de mascotas debe ser 0 si no tenés mascotas.';
        }

        if (Object.keys(erroresValidacion).length > 0) {
            setErrores(erroresValidacion);
            return;
        }

        const perfilInteresado: PerfilInteresado = {
            fecha_mudanza: fechaMudanza,
            cantidad_ocupantes: ocupantes,
            tiene_mascotas: tieneMascotas,
            cantidad_mascotas: tieneMascotas ? mascotas : 0,
            garantias,
        };

        try {
            setEnviando(true);

            const response = await crearConsulta(
                propiedadId,
                perfilInteresado
            );

            if (!response?.success || !response?.data?.id) {
                const erroresApi =
                    response?.validation_errors?.perfil_interesado;

                setErrores({
                    fecha_mudanza: erroresApi?.fecha_mudanza,
                    cantidad_ocupantes: erroresApi?.cantidad_ocupantes,
                    tiene_mascotas: erroresApi?.tiene_mascotas,
                    cantidad_mascotas: erroresApi?.cantidad_mascotas,
                    garantias: erroresApi?.garantias,
                    general: !erroresApi
                        ? response?.message ||
                          response?.error ||
                          'No se pudo iniciar la consulta.'
                        : undefined,
                });

                return;
            }

            onConsultaCreada(Number(response.data.id));
        } catch (error) {
            console.error('Error al iniciar consulta:', error);

            setErrores({
                general: 'Ocurrió un error al iniciar la consulta.',
            });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <View style={styles.formulario}>
            <Text style={styles.titulo}>
                Perfil del interesado
            </Text>

            <Text style={styles.textoSecundario}>
                Completá estos datos para acompañar tu consulta al propietario.
            </Text>

            <Text style={styles.label}>
                Fecha estimada de mudanza
            </Text>

            <TextInput
                style={styles.input}
                value={fechaMudanza}
                onChangeText={setFechaMudanza}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
            />

            {errores.fecha_mudanza && (
                <Text style={styles.error}>
                    {errores.fecha_mudanza}
                </Text>
            )}

            <Text style={styles.label}>
                Cantidad de ocupantes
            </Text>

            <TextInput
                style={styles.input}
                value={cantidadOcupantes}
                onChangeText={setCantidadOcupantes}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="Ej.: 3"
                placeholderTextColor={theme.colors.textMuted}
            />

            {errores.cantidad_ocupantes && (
                <Text style={styles.error}>
                    {errores.cantidad_ocupantes}
                </Text>
            )}

            <View style={styles.filaMascotas}>
                <Text style={styles.label}>
                    ¿Tenés mascotas?
                </Text>

                <Switch
                    value={tieneMascotas}
                    onValueChange={(valor) => {
                        setTieneMascotas(valor);
                        setCantidadMascotas(valor ? '1' : '0');
                    }}
                    trackColor={{
                        true: theme.colors.primary,
                    }}
                />
            </View>

            {tieneMascotas && (
                <>
                    <Text style={styles.label}>
                        Cantidad de mascotas
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={cantidadMascotas}
                        onChangeText={setCantidadMascotas}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="Ej.: 1"
                        placeholderTextColor={theme.colors.textMuted}
                    />
                </>
            )}

            {errores.cantidad_mascotas && (
                <Text style={styles.error}>
                    {errores.cantidad_mascotas}
                </Text>
            )}

            <Text style={styles.label}>
                ¿Qué garantías podés presentar?
            </Text>

            {OPCIONES_GARANTIA.map((opcion) => {
                const seleccionada = garantias.includes(opcion.value);

                return (
                    <TouchableOpacity
                        key={opcion.value}
                        style={styles.opcionGarantia}
                        onPress={() => {
                            setGarantias((actuales) =>
                                seleccionada
                                    ? actuales.filter(
                                          (item) => item !== opcion.value
                                      )
                                    : [...actuales, opcion.value]
                            );
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.checkbox}>
                            {seleccionada ? '☑' : '□'}
                        </Text>

                        <Text style={styles.textoGarantia}>
                            {opcion.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}

            {errores.garantias && (
                <Text style={styles.error}>
                    {errores.garantias}
                </Text>
            )}

            {errores.general && (
                <Text style={styles.error}>
                    {errores.general}
                </Text>
            )}

            <TouchableOpacity
                style={[
                    styles.botonEnviar,
                    enviando && styles.botonDeshabilitado,
                ]}
                onPress={enviarConsulta}
                disabled={enviando}
                activeOpacity={0.8}
            >
                {enviando ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.textoBoton}>
                        Enviar perfil y abrir chat
                    </Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.botonCancelar}
                onPress={onCancel}
                disabled={enviando}
            >
                <Text style={styles.textoCancelar}>
                    Cancelar
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    formulario: {
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        backgroundColor: theme.colors.background,
    },

    titulo: {
        marginBottom: theme.spacing.sm,
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.textDark,
    },

    textoSecundario: {
        fontSize: 14,
        color: theme.colors.textMuted,
    },

    label: {
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textDark,
    },

    input: {
        minHeight: 46,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        color: theme.colors.textDark,
        fontSize: 15,
    },

    filaMascotas: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
    },

    opcionGarantia: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },

    checkbox: {
        width: 28,
        fontSize: 22,
        color: theme.colors.primary,
    },

    textoGarantia: {
        fontSize: 15,
        color: theme.colors.textDark,
    },

    error: {
        color: theme.colors.errorText,
        fontSize: 13,
        marginTop: 4,
        marginBottom: 4,
    },

    botonEnviar: {
        marginTop: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        elevation: 2,
    },

    botonDeshabilitado: {
        opacity: 0.7,
    },

    textoBoton: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    botonCancelar: {
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
    },

    textoCancelar: {
        color: theme.colors.textMuted,
        fontSize: 15,
        fontWeight: '600',
    },
});
