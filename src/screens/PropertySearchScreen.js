import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import PropertyAdvancedFilter from '../components/PropertyAdvancedFilter';
import PropertyCard from '../components/PropertyCard';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';
import { theme } from '../theme/theme';

import { abrirPropiedad } from '../services/propertyNavigation';

const normalizarParametro = (valor) => {
    if (valor === undefined || valor === null) {
        return [];
    }

    if (Array.isArray(valor)) {
        return valor.map(String);
    }

    return [String(valor)];
};

const convertirNumero = (valor) => {
    if (
        valor === undefined ||
        valor === null ||
        valor === ''
    ) {
        return 0;
    }

    const normalizado = String(valor)
        .replace(',', '.')
        .trim();

    const numero = Number(normalizado);

    return Number.isFinite(numero)
        ? numero
        : 0;
};

const obtenerFechaPublicacion = (propiedad) => {
    const fecha = propiedad?.fecha_publicacion;

    if (!fecha) {
        return 0;
    }

    const timestamp = new Date(fecha).getTime();

    return Number.isFinite(timestamp)
        ? timestamp
        : 0;
};

const opcionesOrden = [
    {
        valor: 'antiguedad_desc',
        etiqueta: 'Más recientes',
    },
    {
        valor: 'antiguedad_asc',
        etiqueta: 'Más antiguas',
    },
    {
        valor: 'precio_asc',
        etiqueta: 'Precio: menor a mayor',
    },
    {
        valor: 'precio_desc',
        etiqueta: 'Precio: mayor a menor',
    },
];

export default function PropertySearchScreen() {
    const router = useRouter();

    const {
        categoria_id,
        localidad_id,
        servicio_id,
        precio_min,
        precio_max,
        cantidad_ambientes,
        cantidad_dormitorios,
        cantidad_banos,
        capacidad,
    } = useLocalSearchParams();

    const { width } = useWindowDimensions();

    const [propiedades, setPropiedades] =
        useState([]);

    const [categorias, setCategorias] =
        useState([]);

    const [localidades, setLocalidades] =
        useState([]);

    const [servicios, setServicios] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    const [orden, setOrden] =
        useState('antiguedad_desc');

    const [ordenAbierto, setOrdenAbierto] =
        useState(false);

    const categoriasIniciales = useMemo(
        () => normalizarParametro(categoria_id),
        [categoria_id]
    );

    const localidadesIniciales = useMemo(
        () => normalizarParametro(localidad_id),
        [localidad_id]
    );

    const serviciosIniciales = useMemo(
        () => normalizarParametro(servicio_id),
        [servicio_id]
    );

    const filtrosIniciales = useMemo(
        () => ({
            categoria_id:
                categoriasIniciales,

            localidad_id:
                localidadesIniciales,

            servicio_id:
                serviciosIniciales,

            precio_min:
                precio_min ?? '',

            precio_max:
                precio_max ?? '',

            cantidad_ambientes:
                cantidad_ambientes ?? '',

            cantidad_dormitorios:
                cantidad_dormitorios ?? '',

            cantidad_banos:
                cantidad_banos ?? '',

            capacidad:
                capacidad ?? '',
        }),
        [
            categoriasIniciales,
            localidadesIniciales,
            serviciosIniciales,
            precio_min,
            precio_max,
            cantidad_ambientes,
            cantidad_dormitorios,
            cantidad_banos,
            capacidad,
        ]
    );

    const cargarCatalogos = async () => {
        const [
            categoriasResponse,
            localidadesResponse,
            serviciosResponse,
        ] = await Promise.all([
            api.get('/categorias'),
            api.get('/localidades'),
            api.get('/servicios'),
        ]);

        setCategorias(
            categoriasResponse.data?.data?.items ||
            categoriasResponse.data?.data ||
            categoriasResponse.data ||
            []
        );

        setLocalidades(
            localidadesResponse.data?.data?.items ||
            localidadesResponse.data?.data ||
            localidadesResponse.data ||
            []
        );

        setServicios(
            serviciosResponse.data?.data?.items ||
            serviciosResponse.data?.data ||
            serviciosResponse.data ||
            []
        );
    };

    const construirQuery = (filtros) => {
        const params = [];

        const agregarIds = (
            nombre,
            valores
        ) => {
            if (!Array.isArray(valores)) {
                return;
            }

            valores.forEach((id) => {
                if (
                    id !== undefined &&
                    id !== null &&
                    String(id).trim() !== ''
                ) {
                    params.push(
                        `${nombre}[]=${encodeURIComponent(
                            String(id)
                        )}`
                    );
                }
            });
        };

        agregarIds(
            'categoria_id',
            filtros.categoria_id
        );

        agregarIds(
            'localidad_id',
            filtros.localidad_id
        );

        agregarIds(
            'servicio_id',
            filtros.servicio_id
        );

        const camposSimples = [
            'precio_min',
            'precio_max',
            'cantidad_ambientes',
            'cantidad_dormitorios',
            'cantidad_banos',
            'capacidad',
        ];

        camposSimples.forEach((campo) => {
            const valor = filtros[campo];

            if (
                valor !== undefined &&
                valor !== null &&
                String(valor).trim() !== ''
            ) {
                params.push(
                    `${campo}=${encodeURIComponent(
                        String(valor)
                    )}`
                );
            }
        });

        return params.length > 0
            ? `?${params.join('&')}`
            : '';
    };

    const cargarPropiedades = async (
        filtros = {}
    ) => {
        try {
            setLoading(true);
            setError('');

            const query =
                construirQuery(filtros);

            const response =
                await api.get(
                    `/propiedades${query}`
                );

            setPropiedades(
                response.data?.data?.items ||
                response.data?.data ||
                []
            );
        } catch (error) {
            console.error(
                'PROPERTY SEARCH: ERROR',
                error
            );

            console.error(
                'PROPERTY SEARCH: respuesta',
                error.response?.data
            );

            setError(
                'No se pudieron cargar las propiedades'
            );

            setPropiedades([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoading(true);
                setError('');

                await cargarCatalogos();

                await cargarPropiedades(
                    filtrosIniciales
                );
            } catch (error) {
                console.error(
                    'PROPERTY SEARCH: ERROR INICIAL',
                    error
                );

                console.error(
                    'PROPERTY SEARCH: respuesta',
                    error.response?.data
                );

                setError(
                    'No se pudieron cargar los datos'
                );
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, []);

    const handleBuscar = async (filtros) => {
        await cargarPropiedades(filtros);
    };

    const propiedadesOrdenadas = useMemo(() => {
        const resultado = [
            ...propiedades,
        ];

        resultado.sort((a, b) => {
            switch (orden) {
                case 'precio_asc':
                    return (
                        convertirNumero(
                            a.precio
                        ) -
                        convertirNumero(
                            b.precio
                        )
                    );

                case 'precio_desc':
                    return (
                        convertirNumero(
                            b.precio
                        ) -
                        convertirNumero(
                            a.precio
                        )
                    );

                case 'antiguedad_asc':
                    return (
                        obtenerFechaPublicacion(
                            a
                        ) -
                        obtenerFechaPublicacion(
                            b
                        )
                    );

                case 'antiguedad_desc':
                default:
                    return (
                        obtenerFechaPublicacion(
                            b
                        ) -
                        obtenerFechaPublicacion(
                            a
                        )
                    );
            }
        });

        return resultado;
    }, [
        propiedades,
        orden,
    ]);

    const ordenarSeleccion = (
        nuevoOrden
    ) => {
        setOrden(nuevoOrden);
        setOrdenAbierto(false);
    };

    const ordenActual = opcionesOrden.find(
        (opcion) =>
            opcion.valor === orden
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={
                        theme.colors.primary
                    }
                />

                <Text style={styles.loadingText}>
                    Cargando propiedades...
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : 'height'
            }
            keyboardVerticalOffset={
                Platform.OS === 'ios' ? 90 : 0
            }
        >
            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
            >
                <ScreenHeader
                    title="Encontrá tu próximo hogar"
                    subtitle="Explorá propiedades y encontrá la que mejor se adapte a lo que buscás."
                />

                <View style={styles.filtersContainer}>
                    <PropertyAdvancedFilter
                        categorias={categorias}
                        localidades={localidades}
                        servicios={servicios}
                        initialCategorias={
                            filtrosIniciales.categoria_id
                        }
                        initialLocalidades={
                            filtrosIniciales.localidad_id
                        }
                        initialServicios={
                            filtrosIniciales.servicio_id
                        }
                        onSearch={handleBuscar}
                    />
                </View>

                {error ? (
                    <View style={styles.errorBox}>
                        <Text
                            style={styles.errorText}
                        >
                            {error}
                        </Text>
                    </View>
                ) : null}

                <View style={styles.resultsSection}>
                    <View
                        style={styles.resultsHeader}
                    >
                        <View
                            style={
                                styles.resultsHeaderText
                            }
                        >
                            <Text
                                style={
                                    styles.resultsTitle
                                }
                            >
                                Propiedades
                            </Text>

                            <Text
                                style={
                                    styles.resultsCount
                                }
                            >
                                {propiedadesOrdenadas.length}{' '}
                                {propiedadesOrdenadas.length ===
                                1
                                    ? 'resultado'
                                    : 'resultados'}
                            </Text>
                        </View>

                        <View
                            style={
                                styles.sortContainer
                            }
                        >
                            <TouchableOpacity
                                style={
                                    styles.sortHeader
                                }
                                onPress={() =>
                                    setOrdenAbierto(
                                        (actual) =>
                                            !actual
                                    )
                                }
                                activeOpacity={0.8}
                            >
                                <View
                                    style={
                                        styles.sortHeaderText
                                    }
                                >
                                    <Text
                                        style={
                                            styles.sortLabel
                                        }
                                    >
                                        Ordenar por
                                    </Text>

                                    <Text
                                        style={
                                            styles.sortSummary
                                        }
                                        numberOfLines={1}
                                    >
                                        {
                                            ordenActual
                                                ?.etiqueta
                                        }
                                    </Text>
                                </View>

                                <Text
                                    style={
                                        styles.sortArrow
                                    }
                                >
                                    {ordenAbierto
                                        ? '▲'
                                        : '▼'}
                                </Text>
                            </TouchableOpacity>

                            {ordenAbierto ? (
                                <View
                                    style={
                                        styles.sortDropdown
                                    }
                                >
                                    {opcionesOrden.map(
                                        (opcion) => {
                                            const seleccionada =
                                                opcion.valor ===
                                                orden;

                                            return (
                                                <TouchableOpacity
                                                    key={
                                                        opcion.valor
                                                    }
                                                    style={[
                                                        styles.sortOption,
                                                        seleccionada &&
                                                            styles.sortOptionSelected,
                                                    ]}
                                                    onPress={() =>
                                                        ordenarSeleccion(
                                                            opcion.valor
                                                        )
                                                    }
                                                    activeOpacity={
                                                        0.8
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.sortOptionText,
                                                            seleccionada &&
                                                                styles.sortOptionTextSelected,
                                                        ]}
                                                    >
                                                        {
                                                            opcion.etiqueta
                                                        }
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        }
                                    )}
                                </View>
                            ) : null}
                        </View>
                    </View>

                    {propiedadesOrdenadas.length ===
                    0 ? (
                        <View
                            style={
                                styles.emptyContainer
                            }
                        >
                            <Text
                                style={
                                    styles.emptyTitle
                                }
                            >
                                No se encontraron
                                propiedades
                            </Text>

                            <Text
                                style={
                                    styles.emptyText
                                }
                            >
                                Probá modificando los
                                filtros de búsqueda.
                            </Text>
                        </View>
                    ) : (
                        <View
                            style={
                                styles.propertiesGrid
                            }
                        >
                            {propiedadesOrdenadas.map(
                                (propiedad) => (
                                    <PropertyCard
                                        key={
                                            propiedad.id
                                        }
                                        propiedad={
                                            propiedad
                                        }
                                        onPress={() =>
                                            abrirPropiedad(
                                                router,
                                                propiedad
                                            )
                                        }
                                    />
                                )
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:
            theme.colors.background,
    },

    content: {
        paddingBottom:
            theme.spacing.xl +
            90,
    },

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
            theme.colors.background,
        paddingHorizontal:
            theme.spacing.lg,
    },

    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 14,
    },

    filtersContainer: {
        marginTop: theme.spacing.md,
        marginHorizontal:
            theme.spacing.md,
    },

    errorBox: {
        marginHorizontal:
            theme.spacing.md,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor:
            theme.colors.errorBg,
    },

    errorText: {
        color: theme.colors.errorText,
        fontSize: 14,
        textAlign: 'center',
    },

    resultsSection: {
        marginTop: theme.spacing.sm,
    },

    resultsHeader: {
        paddingHorizontal:
            theme.spacing.md,
        marginBottom:
            theme.spacing.md,
        zIndex: 10,
    },

    resultsHeaderText: {
        marginBottom: theme.spacing.sm,
    },

    resultsTitle: {
        color: theme.colors.textDark,
        fontSize: 24,
        fontWeight: '700',
    },

    resultsCount: {
        marginTop: 2,
        color: theme.colors.textMuted,
        fontSize: 13,
    },

    sortContainer: {
        position: 'relative',
        zIndex: 20,
    },

    sortHeader: {
        minHeight: 54,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor:
            theme.colors.border,
        borderRadius: 10,
        backgroundColor:
            theme.colors.inputBg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
            'space-between',
    },

    sortHeaderText: {
        flex: 1,
    },

    sortLabel: {
        color: theme.colors.textDark,
        fontSize: 13,
        fontWeight: '600',
    },

    sortSummary: {
        marginTop: 2,
        color: theme.colors.textMuted,
        fontSize: 12,
    },

    sortArrow: {
        marginLeft: 12,
        color: theme.colors.text,
        fontSize: 12,
    },

    sortDropdown: {
        marginTop: 6,
        padding: 6,
        borderWidth: 1,
        borderColor:
            theme.colors.border,
        borderRadius: 10,
        backgroundColor:
            theme.colors.background,
    },

    sortOption: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 8,
    },

    sortOptionSelected: {
        backgroundColor:
            theme.colors.primary,
    },

    sortOptionText: {
        color: theme.colors.textDark,
        fontSize: 14,
    },

    sortOptionTextSelected: {
        color: '#ffffff',
        fontWeight: '600',
    },

    propertiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        rowGap: theme.spacing.md,
    },

    propertyRow: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom:
            theme.spacing.md,
        alignItems: 'stretch',
    },

    propertyItem: {
        flexShrink: 0,
    },

    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal:
            theme.spacing.lg,
        paddingVertical:
            theme.spacing.xl,
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
        textAlign: 'center',
    },
});