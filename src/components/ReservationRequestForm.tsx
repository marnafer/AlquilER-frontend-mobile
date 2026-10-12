import { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { theme } from '../theme/theme';

interface ReservationRequestFormProps {
    onCancel: () => void;
    onSubmit: (
        fechaInicio: string,
        fechaFin: string
    ) => Promise<void>;
}

export default function ReservationRequestForm({
    onCancel,
    onSubmit,
}: ReservationRequestFormProps) {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);

    const validarFecha = (fecha: string): boolean => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            return false;
        }

        const [anio, mes, dia] = fecha.split('-').map(Number);
        const fechaObjeto = new Date(anio, mes - 1, dia);

        return (
            fechaObjeto.getFullYear() === anio &&
            fechaObjeto.getMonth() === mes - 1 &&
            fechaObjeto.getDate() === dia
        );
    };

    const enviarFormulario = async () => {
        setError('');

        if (!validarFecha(fechaInicio)) {
            setError('Ingresá una fecha de inicio válida (AAAA-MM-DD).');
            return;
        }

        if (!validarFecha(fechaFin)) {
            setError('Ingresá una fecha de finalización válida (AAAA-MM-DD).');
            return;
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const inicio = new Date(`${fechaInicio}T00:00:00`);
        const fin = new Date(`${fechaFin}T00:00:00`);

        if (inicio < hoy) {
            setError('La fecha de inicio no puede ser anterior a hoy.');
            return;
        }

        if (fin <= inicio) {
            setError('La fecha de finalización debe ser posterior al inicio.');
            return;
        }

        try {
            setEnviando(true);
            await onSubmit(fechaInicio, fechaFin);
        } catch {
            setError('No se pudo enviar la solicitud. Intentá nuevamente.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <View style={styles.contenedor}>
            <Text style={styles.titulo}>Solicitar reserva</Text>

            <Text style={styles.descripcion}>
                Indicá el período durante el cual te gustaría alquilar
                la propiedad. La solicitud quedará pendiente de aprobación
                del propietario.
            </Text>

            <Text style={styles.label}>Fecha de inicio</Text>
            <TextInput
                style={styles.input}
                value={fechaInicio}
                onChangeText={setFechaInicio}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numbers-and-punctuation"
                editable={!enviando}
                maxLength={10}
            />

            <Text style={styles.label}>Fecha de finalización</Text>
            <TextInput
                style={styles.input}
                value={fechaFin}
                onChangeText={setFechaFin}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numbers-and-punctuation"
                editable={!enviando}
                maxLength={10}
            />

            {error !== '' && (
                <Text style={styles.error}>{error}</Text>
            )}

            <TouchableOpacity
                style={[
                    styles.botonEnviar,
                    enviando && styles.botonDeshabilitado,
                ]}
                onPress={enviarFormulario}
                disabled={enviando}
                activeOpacity={0.8}
            >
                {enviando ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.textoBotonEnviar}>
                        Enviar solicitud
                    </Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.botonCancelar}
                onPress={onCancel}
                disabled={enviando}
                activeOpacity={0.8}
            >
                <Text style={styles.textoBotonCancelar}>
                    Cancelar
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    titulo: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.textDark,
        marginBottom: 8,
    },
    descripcion: {
        fontSize: 14,
        color: theme.colors.textMuted,
        lineHeight: 20,
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textMuted,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: theme.colors.textMuted,
        marginBottom: 14,
    },
    error: {
        color: '#DC2626',
        fontSize: 14,
        marginBottom: 12,
    },
    botonEnviar: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 13,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botonDeshabilitado: {
        opacity: 0.6,
    },
    textoBotonEnviar: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    botonCancelar: {
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 4,
    },
    textoBotonCancelar: {
        color: theme.colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
    },
});