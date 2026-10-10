import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { isAxiosError } from 'axios';

import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';
import { theme } from '../theme/theme';

type Campo = 'nombre' | 'email' | 'asunto' | 'mensaje';
type Formulario = Record<Campo, string>;
type Errores = Partial<Record<Campo, string>>;

const formularioVacio: Formulario = {
    nombre: '',
    email: '',
    asunto: '',
    mensaje: '',
};

export default function ContactScreen() {
    const [formulario, setFormulario] = useState(formularioVacio);
    const [errores, setErrores] = useState<Errores>({});
    const [errorApi, setErrorApi] = useState('');
    const [enviado, setEnviado] = useState(false);
    const [enviando, setEnviando] = useState(false);

    const actualizarCampo = (campo: Campo, valor: string) => {
        setFormulario((actual) => ({ ...actual, [campo]: valor }));
        setErrores((actual) => ({ ...actual, [campo]: undefined }));
        setEnviado(false);
    };

    const validar = (): Errores => {
        const nuevosErrores: Errores = {};

        if (!formulario.nombre.trim()) {
            nuevosErrores.nombre = 'Ingresá tu nombre.';
        }
        if (!formulario.email.trim()) {
            nuevosErrores.email = 'Ingresá tu correo electrónico.';
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email.trim())
        ) {
            nuevosErrores.email = 'El correo electrónico no es válido.';
        }
        if (formulario.asunto.trim().length < 3) {
            nuevosErrores.asunto = 'El asunto debe tener al menos 3 caracteres.';
        }
        if (formulario.mensaje.trim().length < 10) {
            nuevosErrores.mensaje =
                'El mensaje debe tener al menos 10 caracteres.';
        }

        return nuevosErrores;
    };

    const enviar = async () => {
        setErrorApi('');
        setEnviado(false);
        const nuevosErrores = validar();
        setErrores(nuevosErrores);

        if (Object.keys(nuevosErrores).length > 0) {
            return;
        }

        setEnviando(true);
        try {
            const response = await api.post('/contacto', {
                nombre: formulario.nombre.trim(),
                email: formulario.email.trim(),
                asunto: formulario.asunto.trim(),
                mensaje: formulario.mensaje.trim(),
            });

            if (!response.data?.success) {
                setErrorApi(
                    response.data?.message ||
                        'No se pudo enviar el mensaje. Intentá de nuevo.'
                );
                return;
            }

            setFormulario(formularioVacio);
            setEnviado(true);
        } catch (error) {
            if (isAxiosError(error)) {
                const data = error.response?.data;
                const erroresServidor = data?.errors;
                const campos: Campo[] = [
                    'nombre',
                    'email',
                    'asunto',
                    'mensaje',
                ];
                const erroresMapeados: Errores = {};

                campos.forEach((campo) => {
                    const mensaje = erroresServidor?.[campo];
                    if (typeof mensaje === 'string') {
                        erroresMapeados[campo] = mensaje;
                    } else if (Array.isArray(mensaje)) {
                        erroresMapeados[campo] = mensaje[0];
                    }
                });

                setErrores(erroresMapeados);
                setErrorApi(
                    data?.message ||
                        data?.error ||
                        'No se pudo enviar el mensaje. Revisá tu conexión e intentá de nuevo.'
                );
            } else {
                console.error('CONTACTO: error inesperado al enviar', error);
                setErrorApi(
                    'Ocurrió un error inesperado. Intentá de nuevo.'
                );
            }
        } finally {
            setEnviando(false);
        }
    };

    const abrirEnlace = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.error('CONTACTO: no se pudo abrir el enlace', error);
            Alert.alert(
                'No se pudo abrir',
                'No hay una aplicación disponible para completar esta acción.'
            );
        }
    };

    const renderCampo = (
        campo: Campo,
        etiqueta: string,
        placeholder: string,
        multilinea = false
    ) => (
        <View style={styles.field}>
            <Text style={styles.label}>{etiqueta}</Text>
            <TextInput
                style={[
                    styles.input,
                    multilinea && styles.messageInput,
                    errores[campo] && styles.inputError,
                ]}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.textMuted}
                value={formulario[campo]}
                onChangeText={(valor) => actualizarCampo(campo, valor)}
                autoCapitalize={campo === 'email' ? 'none' : 'sentences'}
                autoCorrect={campo !== 'email'}
                keyboardType={campo === 'email' ? 'email-address' : 'default'}
                multiline={multilinea}
                textAlignVertical={multilinea ? 'top' : 'center'}
                maxLength={campo === 'mensaje' ? 5000 : 150}
                accessibilityLabel={etiqueta}
            />
            {errores[campo] ? (
                <Text style={styles.fieldError}>{errores[campo]}</Text>
            ) : null}
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <ScreenHeader
                    title="Contacto"
                    subtitle="¿En qué podemos ayudarte?"
                    showBackButton
                />

                <View style={styles.body}>
                    <Text style={styles.intro}>
                        Resolvé tus dudas sobre alquileres, reservas o publicación
                        de propiedades. Escribinos y te responderemos a la
                        brevedad.
                    </Text>

                    <View style={styles.contactCard}>
                        <Text style={styles.contactTitle}>También podés contactarnos</Text>
                        <TouchableOpacity
                            style={styles.contactLink}
                            onPress={() =>
                                abrirEnlace('mailto:contacto@alquiler.com.ar')
                            }
                            activeOpacity={0.8}
                        >
                            <Text style={styles.contactLinkText}>
                                ✉️  contacto@alquiler.com.ar
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.contactLink}
                            onPress={() => abrirEnlace('tel:+5491155550001')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.contactLinkText}>
                                ☎️  +54 9 11 5555-0001
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.contactLinkText}>
                            📍  Av. Entre Ríos 1234, CABA
                        </Text>
                        <Text style={styles.contactHint}>
                            Horario de atención: lunes a viernes, de 9:00 a 18:00.
                        </Text>
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Escribinos un mensaje</Text>
                        {renderCampo('nombre', 'Nombre', 'Tu nombre y apellido')}
                        {renderCampo(
                            'email',
                            'Correo electrónico',
                            'tucorreo@ejemplo.com'
                        )}
                        {renderCampo(
                            'asunto',
                            'Asunto',
                            '¿Sobre qué querés escribirnos?'
                        )}
                        {renderCampo(
                            'mensaje',
                            'Mensaje',
                            'Escribí tu mensaje...',
                            true
                        )}

                        {errorApi ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{errorApi}</Text>
                            </View>
                        ) : null}
                        {enviado ? (
                            <View style={styles.successBox}>
                                <Text style={styles.successText}>
                                    Tu mensaje fue enviado. ¡Gracias por escribirnos!
                                </Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                enviando && styles.submitButtonDisabled,
                            ]}
                            onPress={enviar}
                            disabled={enviando}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.submitButtonText}>
                                {enviando ? 'Enviando...' : 'Enviar mensaje'}
                            </Text>
                        </TouchableOpacity>
                    </View>
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
        paddingBottom: 100,
    },
    body: {
        padding: theme.spacing.md,
    },
    intro: {
        marginBottom: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 21,
    },
    contactCard: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 14,
        backgroundColor: theme.colors.primaryBg,
    },
    contactTitle: {
        marginBottom: theme.spacing.sm,
        color: theme.colors.textDark,
        fontSize: 16,
        fontWeight: '700',
    },
    contactLink: {
        minHeight: 38,
        justifyContent: 'center',
    },
    contactLinkText: {
        color: theme.colors.primaryDark,
        fontSize: 14,
        fontWeight: '600',
    },
    contactHint: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 12,
        lineHeight: 18,
    },
    formCard: {
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 14,
        backgroundColor: theme.colors.white,
    },
    formTitle: {
        marginBottom: theme.spacing.md,
        color: theme.colors.textDark,
        fontSize: 18,
        fontWeight: '700',
    },
    field: {
        marginBottom: theme.spacing.md,
    },
    label: {
        marginBottom: 6,
        color: theme.colors.textDark,
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        minHeight: 46,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
        color: theme.colors.textDark,
        fontSize: 15,
    },
    inputError: {
        borderColor: theme.colors.errorText,
    },
    messageInput: {
        minHeight: 120,
        paddingTop: 12,
    },
    fieldError: {
        marginTop: 5,
        color: theme.colors.errorText,
        fontSize: 12,
    },
    errorBox: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.sm,
        borderRadius: 8,
        backgroundColor: theme.colors.errorBg,
    },
    errorText: {
        color: theme.colors.errorText,
        fontSize: 13,
    },
    successBox: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.sm,
        borderRadius: 8,
        backgroundColor: theme.colors.successBg,
    },
    successText: {
        color: theme.colors.successText,
        fontSize: 13,
        fontWeight: '600',
    },
    submitButton: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
    },
    submitButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },
    submitButtonText: {
        color: theme.colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
});
