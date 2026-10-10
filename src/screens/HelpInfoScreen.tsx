import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { theme } from '../theme/theme';

type InfoKind = 'faq' | 'terms' | 'privacy';

interface InfoSection {
    title: string;
    paragraphs?: string[];
    bullets?: string[];
}

const preguntas = [
    {
        pregunta: '¿Cómo hago para alquilar una propiedad?',
        respuesta:
            'Buscá en el catálogo la propiedad que te guste, entrá en su detalle y tocá “Reservar”. Completá las fechas y el propietario recibirá tu solicitud. Cuando la acepte, la reserva queda confirmada.',
    },
    {
        pregunta: '¿Cuánto cuesta publicar una propiedad?',
        respuesta:
            'Publicar una propiedad en AlquilER es gratis. Registrate, elegí “Publicar propiedad” y completá los datos del inmueble.',
    },
    {
        pregunta: '¿Cómo sé si mi reserva fue aceptada?',
        respuesta:
            'Podés consultar el estado de tus solicitudes en “Mis reservas”: pendiente, confirmada, rechazada, cancelada o finalizada.',
    },
    {
        pregunta: '¿Puedo cancelar una reserva?',
        respuesta:
            'Sí. Si la reserva está pendiente o confirmada, tanto el inquilino como el propietario pueden cancelarla desde “Mis reservas”.',
    },
    {
        pregunta: '¿Cómo califico a un propietario o inquilino?',
        respuesta:
            'Una vez que la reserva queda finalizada, podés dejar una calificación y un comentario desde “Mis reservas”. Ambas partes pueden calificarse.',
    },
    {
        pregunta: '¿Qué son los servicios de una propiedad?',
        respuesta:
            'Son las comodidades que ofrece el inmueble, como wifi, aire acondicionado, cochera o seguridad. Se pueden indicar al publicar y consultar en el detalle.',
    },
    {
        pregunta: '¿Necesito crear una cuenta para consultar?',
        respuesta:
            'Para consultar a propietarios o guardar favoritos necesitás registrarte e iniciar sesión. La búsqueda y el catálogo están disponibles para todos.',
    },
];

const contenidos: Record<Exclude<InfoKind, 'faq'>, InfoSection[]> = {
    terms: [
        {
            title: '1. Aceptación de los términos',
            paragraphs: [
                'Al utilizar AlquilER aceptás estos términos y condiciones. Si no estás de acuerdo, te pedimos que no utilices la plataforma.',
            ],
        },
        {
            title: '2. Descripción del servicio',
            paragraphs: [
                'AlquilER funciona como un punto de encuentro entre propietarios e inquilinos. La plataforma permite publicar propiedades, gestionar reservas, realizar consultas y calificar experiencias. AlquilER no interviene en los contratos de alquiler celebrados entre las partes.',
            ],
        },
        {
            title: '3. Cuentas y responsabilidad del usuario',
            bullets: [
                'Sos responsable de mantener la confidencialidad de tu contraseña.',
                'Debés proporcionar datos reales y mantenerlos actualizados.',
                'La información publicada debe ser veraz y no infringir derechos de terceros.',
            ],
        },
        {
            title: '4. Publicación de propiedades',
            paragraphs: [
                'Al publicar una propiedad declarás que tenés derecho a ofrecerla en alquiler. Las imágenes, el precio y las características deben reflejar fielmente el inmueble. La plataforma puede retirar publicaciones que incumplan estas reglas.',
            ],
        },
        {
            title: '5. Reservas y cancelaciones',
            paragraphs: [
                'Las reservas se gestionan entre las partes dentro de la plataforma. Las condiciones particulares del alquiler, como un depósito en garantía, se acuerdan directamente entre propietario e inquilino.',
            ],
        },
        {
            title: '6. Limitación de responsabilidad',
            paragraphs: [
                'AlquilER no garantiza que los anuncios estén libres de errores ni es responsable por daños derivados de acuerdos entre propietarios e inquilinos. La plataforma actúa como canal de publicación y contacto.',
            ],
        },
        {
            title: '7. Modificaciones',
            paragraphs: [
                'Podemos modificar estos términos. El uso continuado de la plataforma implica la aceptación de los cambios.',
            ],
        },
    ],
    privacy: [
        {
            title: '1. Datos que recopilamos',
            bullets: [
                'Datos de registro: nombre, apellido, correo electrónico, teléfono y domicilio.',
                'Datos generados por tu actividad: propiedades publicadas, reservas, consultas, favoritos y reseñas.',
                'Datos técnicos, como dirección IP y navegador, para seguridad y diagnóstico.',
            ],
        },
        {
            title: '2. Uso de la información',
            paragraphs: [
                'Utilizamos tus datos para operar la plataforma, procesar reservas y consultas, mostrar tus publicaciones, mantener tu sesión y mejorar la experiencia. La contraseña se almacena cifrada y no se muestra a terceros.',
            ],
        },
        {
            title: '3. Compartir información',
            paragraphs: [
                'Tu nombre y correo pueden ser visibles para las personas con las que interactuás en la plataforma. No vendemos tus datos personales a terceros.',
            ],
        },
        {
            title: '4. Seguridad',
            paragraphs: [
                'Aplicamos medidas técnicas y organizativas razonables para proteger tus datos. Ningún sistema es infalible; te recomendamos usar una contraseña segura y no compartirla.',
            ],
        },
        {
            title: '5. Retención y borrado',
            paragraphs: [
                'Mantenemos tus datos mientras tu cuenta esté activa. Podés solicitar la eliminación de tu cuenta y sus datos asociados a través de Contacto.',
            ],
        },
        {
            title: '6. Tus derechos',
            bullets: [
                'Acceder a tus datos personales desde tu perfil.',
                'Corregir datos inexactos.',
                'Solicitar el borrado de tu cuenta y de los datos asociados.',
            ],
        },
        {
            title: '7. Cambios en la política',
            paragraphs: [
                'Esta política puede actualizarse. Ante cambios sustanciales, te avisaremos por correo electrónico.',
            ],
        },
    ],
};

const configuracion: Record<
    InfoKind,
    { title: string; subtitle: string }
> = {
    faq: {
        title: 'Preguntas frecuentes',
        subtitle: 'Respuestas sobre alquileres, reservas y publicaciones.',
    },
    terms: {
        title: 'Términos y condiciones',
        subtitle: `Última actualización: ${new Date().getFullYear()}`,
    },
    privacy: {
        title: 'Política de privacidad',
        subtitle: `Última actualización: ${new Date().getFullYear()}`,
    },
};

export default function HelpInfoScreen({ kind }: { kind: InfoKind }) {
    const router = useRouter();
    const [preguntaAbierta, setPreguntaAbierta] = useState<number | null>(
        null
    );
    const config = configuracion[kind];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <ScreenHeader
                title={config.title}
                subtitle={config.subtitle}
                showBackButton
            />

            <View style={styles.body}>
                {kind === 'faq' ? (
                    <>
                        {preguntas.map((item, index) => {
                            const abierto = preguntaAbierta === index;

                            return (
                                <View key={item.pregunta} style={styles.faqItem}>
                                    <TouchableOpacity
                                        style={styles.faqQuestion}
                                        onPress={() =>
                                            setPreguntaAbierta(
                                                abierto ? null : index
                                            )
                                        }
                                        accessibilityRole="button"
                                        accessibilityState={{ expanded: abierto }}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.faqQuestionText}>
                                            {item.pregunta}
                                        </Text>
                                        <Text style={styles.faqArrow}>
                                            {abierto ? '−' : '+'}
                                        </Text>
                                    </TouchableOpacity>
                                    {abierto ? (
                                        <Text style={styles.paragraph}>
                                            {item.respuesta}
                                        </Text>
                                    ) : null}
                                </View>
                            );
                        })}
                    </>
                ) : (
                    <>
                        {contenidos[kind].map((section) => (
                            <View key={section.title} style={styles.legalSection}>
                                <Text style={styles.sectionTitle}>
                                    {section.title}
                                </Text>
                                {section.paragraphs?.map((paragraph) => (
                                    <Text
                                        key={paragraph}
                                        style={styles.paragraph}
                                    >
                                        {paragraph}
                                    </Text>
                                ))}
                                {section.bullets?.map((bullet) => (
                                    <View key={bullet} style={styles.bulletRow}>
                                        <Text style={styles.bullet}>•</Text>
                                        <Text style={styles.paragraph}>
                                            {bullet}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </>
                )}

                <View style={styles.contactCard}>
                    <Text style={styles.contactTitle}>
                        ¿No encontraste lo que buscabas?
                    </Text>
                    <Text style={styles.paragraph}>
                        Escribinos y te ayudamos con tu consulta.
                    </Text>
                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => router.push('/contacto')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.contactButtonText}>
                            Ir a contacto
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
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
    faqItem: {
        marginBottom: theme.spacing.sm,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        backgroundColor: theme.colors.white,
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    faqQuestionText: {
        flex: 1,
        paddingRight: theme.spacing.sm,
        color: theme.colors.textDark,
        fontSize: 15,
        fontWeight: '600',
    },
    faqArrow: {
        color: theme.colors.primary,
        fontSize: 22,
        fontWeight: '700',
    },
    legalSection: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        marginBottom: theme.spacing.sm,
        color: theme.colors.textDark,
        fontSize: 17,
        fontWeight: '700',
    },
    paragraph: {
        color: theme.colors.textDark,
        fontSize: 14,
        lineHeight: 22,
    },
    bulletRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    bullet: {
        marginRight: theme.spacing.sm,
        color: theme.colors.primary,
        fontSize: 16,
    },
    contactCard: {
        marginTop: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: 14,
        backgroundColor: theme.colors.primaryBg,
    },
    contactTitle: {
        marginBottom: 5,
        color: theme.colors.textDark,
        fontSize: 16,
        fontWeight: '700',
    },
    contactButton: {
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
    },
    contactButtonText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
});
