import {
    useFocusEffect,
    useRouter,
} from 'expo-router';

import {
    useCallback,
    useState,
} from 'react';

import {
    FlatList,
    ListRenderItem,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { obtenerTodasLasConsultas } from '../services/messageService';
import {
    obtenerPerfil,
    obtenerPerfilPublico,
} from '../services/userService';
import { theme } from '../theme/theme';

import type { Consultation } from '../types/conversation';

function agruparConversaciones(
    consultas: Consultation[]
    ): Consultation[] {
    const unicas = new Map<string, Consultation>();

    for (const consulta of consultas) {
        const propiedadId =
            consulta.propiedad_id ?? consulta.propiedad?.id;

        const solicitanteId = consulta.usuario_id;
        const propietarioId = consulta.propiedad?.usuario_id;

        // Si faltan datos para identificar a los participantes,
        // conservamos la consulta sin agruparla.
        if (
            propiedadId == null ||
            solicitanteId == null ||
            propietarioId == null
        ) {
            unicas.set(`consulta-${consulta.id}`, consulta);
            continue;
        }

        const participantes = [
            Number(solicitanteId),
            Number(propietarioId),
        ].sort((a, b) => a - b);

        const clave = [
            propiedadId,
            ...participantes,
        ].join('-');

        const existente = unicas.get(clave);

        if (
            !existente ||
            new Date(consulta.fecha_consulta || 0).getTime() >
                new Date(existente.fecha_consulta || 0).getTime()
        ) {
            unicas.set(clave, consulta);
        }
    }

    return [...unicas.values()].sort(
        (a, b) =>
            new Date(b.fecha_consulta || 0).getTime() -
            new Date(a.fecha_consulta || 0).getTime()
    );
}

export default function MensajesScreen() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const [consultas, setConsultas] = useState<Consultation[]>([]);
    const [usuarioActualId, setUsuarioActualId] = useState<number | null>(null);
    const [nombresContactos, setNombresContactos] =
        useState<Record<number, string>>({});
    
    const cargarConsultas = async (actualizar = false) => {
        try {
            if (actualizar) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError('');

            const perfilResponse = await obtenerPerfil();
            const idActual = perfilResponse.success
                ? perfilResponse.data.id
                : usuarioActualId;

            if (perfilResponse.success) {
                setUsuarioActualId(idActual);
            }

            const response = await obtenerTodasLasConsultas();

            if (!response?.success) {
                throw new Error(
                    response?.message ||
                    'No se pudieron cargar las conversaciones.'
                );
            }

            const consultasAgrupadas = agruparConversaciones(
                response.data?.items || []
            );

            setConsultas(consultasAgrupadas);

            if (idActual !== null) {
                const idsSinNombre = [
                    ...new Set(
                        consultasAgrupadas
                            .filter((consulta) => {
                                const contactoId = obtenerIdContacto(consulta, idActual);
                                if (contactoId === null) return false;

                                const contacto = Number(consulta.usuario_id) === idActual
                                    ? consulta.propiedad?.usuario
                                    : consulta.usuario;

                                const nombreIncluido = [
                                    contacto?.nombre,
                                    contacto?.apellido,
                                ]
                                    .filter((parte) => Boolean(parte?.trim()))
                                    .join(' ')
                                    .trim();

                                return !nombreIncluido && !nombresContactos[contactoId];
                            })
                            .map((consulta) => obtenerIdContacto(consulta, idActual))
                            .filter((id): id is number => id !== null)
                    ),
                ];

                const perfiles = await Promise.all(
                    idsSinNombre.map(async (id) => {
                        try {
                            const perfil = await obtenerPerfilPublico(id);

                            if (!perfil.success) {
                                console.warn(
                                    `MESSAGES: no se pudo cargar el perfil público ${id}`,
                                    perfil.message
                                );
                                return null;
                            }

                            const nombre = [
                                perfil.data.nombre,
                                perfil.data.apellido,
                            ]
                                .filter((parte) => Boolean(parte?.trim()))
                                .join(' ')
                                .trim();

                            return nombre ? { id, nombre } : null;
                        } catch (error) {
                            console.error(
                                `MESSAGES: error al cargar el perfil público ${id}`,
                                error
                            );
                            return null;
                        }
                    })
                );

                const nuevosNombres: Record<number, string> = {};

                for (const perfil of perfiles) {
                    if (perfil) {
                        nuevosNombres[perfil.id] = perfil.nombre;
                    }
                }

                setNombresContactos((actuales) => ({
                    ...actuales,
                    ...nuevosNombres,
                }));
            }
        } catch (err) {
            console.error(
                'MESSAGES: error al cargar conversaciones',
                err
            );

            setError(
                err instanceof Error
                ? err.message
                : 'No se pudieron cargar las conversaciones.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarConsultas();
        }, [])
    );

    const obtenerNombrePropiedad = (consulta: Consultation): string => {
        const propiedad = consulta.propiedad;

        return (
            propiedad?.titulo ||
            propiedad?.direccion ||
            'Propiedad'
        );
    };

    function obtenerIdContacto(
        consulta: Consultation,
        idActual = usuarioActualId
    ): number | null {
        if (idActual === null) {
            return null;
        }

        const interesadoId = Number(consulta.usuario_id);
        const propietarioId = Number(consulta.propiedad?.usuario_id);

        if (idActual === interesadoId) {
            return Number.isFinite(propietarioId) && propietarioId > 0
                && propietarioId !== idActual
                ? propietarioId
                : null;
        }

        if (idActual === propietarioId) {
            return Number.isFinite(interesadoId) && interesadoId > 0
                && interesadoId !== idActual
                ? interesadoId
                : null;
        }

        return null;
    }

    function obtenerNombreContacto(consulta: Consultation): string {
        if (usuarioActualId === null) {
            return 'Cargando contacto...';
        }

        const contactoId = obtenerIdContacto(consulta);
        if (contactoId === null) {
            return 'Contacto';
        }

        const contacto = Number(consulta.usuario_id) === usuarioActualId
            ? consulta.propiedad?.usuario
            : consulta.usuario;

        const nombreIncluido = [contacto?.nombre, contacto?.apellido]
            .filter((parte) => Boolean(parte?.trim()))
            .join(' ')
            .trim();

        return nombreIncluido || nombresContactos[contactoId] || 'Contacto';
    }

    const formatearFechaActividad = (
        fecha: string | null | undefined
    ): string => {
        if (!fecha) {
            return '';
        }

        const date = new Date(fecha);

        if (Number.isNaN(date.getTime())) {
            return '';
        }

        const ahora = new Date();

        if (date.toDateString() === ahora.toDateString()) {
            return `Hoy, ${date.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
            })}`;
        }

        const ayer = new Date(ahora);
        ayer.setDate(ahora.getDate() - 1);

        if (date.toDateString() === ayer.toDateString()) {
            return `Ayer, ${date.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
            })}`;
        }

        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };


        const renderConsulta: ListRenderItem<Consultation> = ({ item }) => {
            const nombreContacto = obtenerNombreContacto(item);
            const contactoId = obtenerIdContacto(item);

            return (
                <View style={styles.conversationCard}>
                    {/* Acceso al perfil público */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.profileRow,
                            pressed && styles.cardPressed,
                        ]}
                        disabled={!contactoId}
                        onPress={() => {
                            router.push({
                                pathname: '/public-profile/[id]',
                                params: { id: String(contactoId) },
                            });
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver perfil de ${nombreContacto}`}
                    >
                        <Text
                            style={styles.profileText}
                            numberOfLines={1}
                        >
                            Ver perfil de {nombreContacto}
                        </Text>

                        <Text style={styles.arrow}>›</Text>
                    </Pressable>

                    <View style={styles.separator} />

                    {/* Acceso al chat */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.chatRow,
                            pressed && styles.cardPressed,
                        ]}
                        onPress={() => router.push(`/messages/${item.id}`)}
                        accessibilityRole="button"
                        accessibilityLabel={`Abrir conversación sobre ${obtenerNombrePropiedad(item)}`}
                    >
                        <View style={styles.conversationInfo}>
                            <Text
                                style={styles.propertyName}
                                numberOfLines={1}
                            >
                                {obtenerNombrePropiedad(item)}
                            </Text>

                            <Text style={styles.conversationDate}>
                                {formatearFechaActividad(
                                    item.fecha_consulta
                                )}
                            </Text>

                            <Text
                                style={styles.ultimoMensaje}
                                numberOfLines={1}
                            >
                                {item.ultimo_mensaje ||
                                    'Iniciá la conversación'}
                            </Text>
                        </View>

                        <Text style={styles.arrow}>›</Text>
                    </Pressable>
                </View>
            );
        };

    return (
        <View style={styles.container}>
            <FlatList
                data={consultas}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderConsulta}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => cargarConsultas(true)}
                        colors={[theme.colors.primary]}
                    />
                }
                ListHeaderComponent={
                    <ScreenHeader
                        title="Mensajes"
                        subtitle="Tus consultas y conversaciones"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>💬</Text>

                        <Text style={styles.emptyTitle}>
                            Todavía no tenés conversaciones
                        </Text>

                        <Text style={styles.emptyText}>
                            Cuando consultes por una propiedad
                            o alguien consulte por una tuya,
                            la conversación aparecerá acá.
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>
                                {error}
                            </Text>

                            <Pressable
                                style={styles.retryButton}
                                onPress={() => cargarConsultas()}
                            >
                                <Text style={styles.retryText}>
                                    Reintentar
                                </Text>
                            </Pressable>
                        </View>
                    ) : undefined
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    content: {
        paddingBottom: theme.spacing.xl + 90,
        flexGrow: 1,
    },

  conversationCard: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        padding: theme.spacing.sm,
        borderRadius: 14,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    cardPressed: {
        opacity: 0.7,
    },

    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        marginRight: theme.spacing.md,
    },

    avatarText: {
        fontSize: 23,
    },

    conversationInfo: {
        flex: 1,
    },

    propertyName: {
        color: theme.colors.textDark,
        fontSize: 16,
        fontWeight: '700',
    },

    conversationDate: {
        marginTop: 4,
        color: theme.colors.textMuted,
        fontSize: 12,
    },

    arrow: {
        marginLeft: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 28,
    },
    
    emptyContainer: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.xl,
        padding: theme.spacing.lg,
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    emptyIcon: {
        fontSize: 38,
        marginBottom: theme.spacing.md,
    },

    emptyTitle: {
        color: theme.colors.textDark,
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
    },

    emptyText: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
    },

    errorBox: {
        margin: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.errorBg,
    },

    errorText: {
        color: theme.colors.errorText,
        fontSize: 14,
        textAlign: 'center',
    },

    retryButton: {
        alignSelf: 'center',
        marginTop: theme.spacing.md,
        paddingVertical: 8,
        paddingHorizontal: theme.spacing.lg,
    },

    retryText: {
        color: theme.colors.primary,
        fontWeight: '700',
    },

    ultimoMensaje: {
        fontSize: 13,
        color: theme.colors.textMuted,
        marginTop: 4,
    },

    contactoLink: {
        alignSelf: 'flex-start',
        marginTop: 6,
    },

    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm / 2,
    },

    profileText: {
        flex: 1,
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },

    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.border,
    },

    chatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm / 2,
    },
});