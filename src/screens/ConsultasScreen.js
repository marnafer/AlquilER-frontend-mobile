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
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import {
    obtenerConsultas,
    obtenerConsultasByPropiedad,
    obtenerMisPropiedades,
} from '../services/api';
import { theme } from '../theme/theme';
import {
    construirUrlImagen,
    extraerItems,
} from '../utils/formato';

const FILTROS = [
    { valor: 'todas', etiqueta: 'Todas' },
    { valor: 'recibida', etiqueta: 'Recibidas' },
    { valor: 'enviada', etiqueta: 'Enviadas' },
];

export default function ConsultasScreen() {
    const router = useRouter();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtro, setFiltro] = useState('todas');

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');

        let problemas = 0;
        let enviadas = [];
        let recibidas = [];

        try {
            const enviadasRes = await obtenerConsultas();

            enviadas = extraerItems(enviadasRes).map((c) => ({
                consulta: c,
                origen: 'enviada',
                propiedad: c.propiedad || null,
            }));
        } catch (e) {
            problemas++;
        }

        try {
            const propsRes = await obtenerMisPropiedades();

            const props = extraerItems(propsRes);

            const resultados = await Promise.all(
                props.map(async (p) => {
                    try {
                        const res =
                            await obtenerConsultasByPropiedad(
                                p.id
                            );

                        return extraerItems(res).map((c) => ({
                            consulta: c,
                            origen: 'recibida',
                            propiedad: p,
                        }));
                    } catch (e) {
                        problemas++;

                        return [];
                    }
                })
            );

            resultados.forEach((r) => recibidas.push(...r));
        } catch (e) {
            problemas++;
        }

        if (problemas > 0) {
            setError(
                'Algunas consultas no pudieron cargarse. Probá de nuevo.'
            );
        }

        setItems(
            [...recibidas, ...enviadas].sort((a, b) =>
                String(b.consulta?.fecha_consulta || '')
                    .localeCompare(
                        String(a.consulta?.fecha_consulta || '')
                    )
            )
        );

        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [cargar])
    );

    const nombreDe = (c) =>
        c?.nombre ||
        c?.apellido ||
        c?.email ||
        'Usuario';

    const formatearFecha = (fecha) => {
        if (!fecha) return '';

        return String(fecha).replace('T', ' ').slice(0, 16);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Cargando tus consultas...
                </Text>
            </View>
        );
    }

    const recibidasCount = items.filter(
        (i) => i.origen === 'recibida'
    ).length;

    const enviadasCount = items.filter(
        (i) => i.origen === 'enviada'
    ).length;

    const visibles = items.filter(
        (i) => filtro === 'todas' || i.origen === filtro
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <ScreenHeader
                title="Mis consultas"
                subtitle="Consultá sobre una propiedad o respondé las consultas que recibiste."
            />

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={cargar}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.retryButtonText}>
                            Reintentar
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {items.length > 0 ? (
                <>
                    <View style={styles.filtersRow}>
                        {FILTROS.map((f) => (
                            <TouchableOpacity
                                key={f.valor}
                                style={[
                                    styles.filterChip,
                                    filtro === f.valor &&
                                        styles.filterChipActivo,
                                ]}
                                onPress={() => setFiltro(f.valor)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        filtro === f.valor &&
                                            styles.filterChipTextActivo,
                                    ]}
                                >
                                    {f.etiqueta}
                                </Text>

                                <Text
                                    style={[
                                        styles.filterChipCount,
                                        filtro === f.valor &&
                                            styles.filterChipTextActivo,
                                    ]}
                                >
                                    {f.valor === 'todas'
                                        ? items.length
                                        : f.valor === 'recibida'
                                        ? recibidasCount
                                        : enviadasCount}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {visibles.length > 0 ? (
                        <View style={styles.lista}>
                            {visibles.map((item) => {
                                const c = item.consulta;

                                const img = construirUrlImagen(
                                    item.propiedad?.imagen_url ||
                                        item.propiedad
                                            ?.imagen_principal?.ruta ||
                                        item.propiedad?.imagenes?.[0]
                                            ?.ruta ||
                                        c.propiedad?.imagen_url ||
                                        null
                                );

                                const titulo =
                                    item.propiedad?.titulo ||
                                    c.propiedad?.titulo ||
                                    'Propiedad';

                                return (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={styles.item}
                                        onPress={() =>
                                            router.push(
                                                `/consultas/${c.id}`
                                            )
                                        }
                                        activeOpacity={0.85}
                                    >
                                        <View
                                            style={styles.itemImagen}
                                        >
                                            {img ? (
                                                <Image
                                                    source={{
                                                        uri: img,
                                                    }}
                                                    style={
                                                        styles.itemImagenFull
                                                    }
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <Text
                                                    style={
                                                        styles.itemImagenIcono
                                                    }
                                                >
                                                    🏠
                                                </Text>
                                            )}
                                        </View>

                                        <View
                                            style={styles.itemBody}
                                        >
                                            <View
                                                style={
                                                    styles.itemHeader
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        styles.itemOrigen,
                                                        item.origen ===
                                                        'recibida' &&
                                                            styles.itemOrigenRecibida,
                                                    ]}
                                                >
                                                    {item.origen ===
                                                    'recibida'
                                                        ? 'Recibida'
                                                        : 'Enviada'}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.itemFecha
                                                    }
                                                >
                                                    {formatearFecha(
                                                        c.fecha_consulta
                                                    )}
                                                </Text>
                                            </View>

                                            <Text
                                                style={
                                                    styles.itemTitulo
                                                }
                                                numberOfLines={1}
                                            >
                                                {titulo}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.itemDetalle
                                                }
                                            >
                                                {item.origen ===
                                                'recibida'
                                                    ? `De ${nombreDe(
                                                          c.usuario
                                                      )}`
                                                    : 'Consulta enviada'}
                                            </Text>
                                        </View>

                                        <Text
                                            style={styles.itemArrow}
                                        >
                                            ›
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>
                                🔍
                            </Text>

                            <Text style={styles.emptyTitle}>
                                No hay consultas en este filtro
                            </Text>
                        </View>
                    )}
                </>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>
                        💬
                    </Text>

                    <Text style={styles.emptyTitle}>
                        Todavía no tenés consultas
                    </Text>

                    <Text style={styles.emptyText}>
                        Consultá sobre una propiedad para iniciar
                        una conversación sobre un alquiler.
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    content: {
        paddingBottom: theme.spacing.xl + 90,
    },

    loadingContainer: {
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

    errorBox: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.errorBg,
        alignItems: 'center',
    },

    errorText: {
        color: theme.colors.errorText,
        fontSize: 14,
        textAlign: 'center',
    },

    retryButton: {
        marginTop: theme.spacing.sm,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.errorText,
    },

    retryButtonText: {
        color: theme.colors.errorText,
        fontSize: 13,
        fontWeight: '600',
    },

    filtersRow: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },

    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    filterChipActivo: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },

    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textDark,
    },

    filterChipTextActivo: {
        color: theme.colors.white,
    },

    filterChipCount: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.textMuted,
    },

    lista: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },

    item: {
        minHeight: 88,
        padding: theme.spacing.sm,
        borderRadius: 14,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },

    itemImagen: {
        width: 62,
        height: 62,
        borderRadius: 10,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.border,
    },

    itemImagenFull: {
        width: '100%',
        height: '100%',
    },

    itemImagenIcono: {
        fontSize: 26,
    },

    itemBody: {
        flex: 1,
        marginLeft: theme.spacing.md,
        minWidth: 0,
    },

    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    itemOrigen: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: theme.colors.textMuted,
    },

    itemOrigenRecibida: {
        color: theme.colors.primary,
    },

    itemFecha: {
        fontSize: 11,
        color: theme.colors.textMuted,
    },

    itemTitulo: {
        marginTop: 4,
        color: theme.colors.textDark,
        fontSize: 15,
        fontWeight: '700',
    },

    itemDetalle: {
        marginTop: 2,
        color: theme.colors.textMuted,
        fontSize: 12,
    },

    itemArrow: {
        marginLeft: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 26,
        fontWeight: '300',
    },

    emptyContainer: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },

    emptyIcon: {
        fontSize: 36,
        marginBottom: theme.spacing.sm,
    },

    emptyTitle: {
        color: theme.colors.textDark,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },

    emptyText: {
        marginTop: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
});