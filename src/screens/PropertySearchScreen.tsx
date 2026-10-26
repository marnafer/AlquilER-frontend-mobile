import axios from 'axios';
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
    View,
} from 'react-native';

import PropertyAdvancedFilter from '../components/PropertyAdvancedFilter';
import PropertyCard from '../components/PropertyCard';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';
import { abrirPropiedad } from '../services/propertyNavigation';
import { theme } from '../theme/theme';
import type {
    Property,
    PropertyCatalogResponse,
    PropertyCategory,
    PropertyFilters,
    PropertyLocation,
    PropertyOrder,
    PropertySearchResponse,
    PropertyService,
} from '../types/property';

const POR_PAGINA = 10;

type SearchParams = {
    categoria_id?: string | string[];
    localidad_id?: string | string[];
    servicio_id?: string | string[];
    precio_min?: string | string[];
    precio_max?: string | string[];
    cantidad_ambientes?: string | string[];
    cantidad_dormitorios?: string | string[];
    cantidad_banos?: string | string[];
    capacidad?: string | string[];
    acepta_mascotas?: string | string[];
    acepta_hijos?: string | string[];
};

const normalizarParametro = (
    valor: string | string[] | undefined
): string[] => {
    if (valor === undefined) return [];
    return Array.isArray(valor) ? valor.map(String) : [String(valor)];
};

const normalizarCampo = (
    valor: string | string[] | undefined
): string => {
    if (valor === undefined) return '';
    return Array.isArray(valor) ? valor[0] ?? '' : valor;
};

const opcionesOrden: { valor: PropertyOrder; etiqueta: string }[] = [
    { valor: 'antiguedad_desc', etiqueta: 'Más recientes' },
    { valor: 'antiguedad_asc', etiqueta: 'Más antiguas' },
    { valor: 'precio_asc', etiqueta: 'Precio: menor a mayor' },
    { valor: 'precio_desc', etiqueta: 'Precio: mayor a menor' },
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
        acepta_mascotas,
        acepta_hijos,
    } = useLocalSearchParams<SearchParams>();

    const [propiedades, setPropiedades] = useState<Property[]>([]);
    const [categorias, setCategorias] = useState<PropertyCategory[]>([]);
    const [localidades, setLocalidades] = useState<PropertyLocation[]>([]);
    const [servicios, setServicios] = useState<PropertyService[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [orden, setOrden] = useState<PropertyOrder>('antiguedad_desc');
    const [ordenAbierto, setOrdenAbierto] = useState(false);

    const [pagina, setPagina] = useState(1);
    const [total, setTotal] = useState(0);
    const [ultimaPagina, setUltimaPagina] = useState(1);

    const filtrosIniciales = useMemo<PropertyFilters>(
        () => ({
            categoria_id: normalizarParametro(categoria_id),
            localidad_id: normalizarParametro(localidad_id),
            servicio_id: normalizarParametro(servicio_id),
            precio_min: normalizarCampo(precio_min),
            precio_max: normalizarCampo(precio_max),
            cantidad_ambientes: normalizarCampo(cantidad_ambientes),
            cantidad_dormitorios: normalizarCampo(cantidad_dormitorios),
            cantidad_banos: normalizarCampo(cantidad_banos),
            capacidad: normalizarCampo(capacidad),
            acepta_mascotas: normalizarCampo(acepta_mascotas),
            acepta_hijos: normalizarCampo(acepta_hijos),
        }),
        [
            categoria_id,
            localidad_id,
            servicio_id,
            precio_min,
            precio_max,
            cantidad_ambientes,
            cantidad_dormitorios,
            cantidad_banos,
            capacidad,
            acepta_mascotas,
            acepta_hijos,
        ]
    );

    const [filtrosActivos, setFiltrosActivos] =
        useState<PropertyFilters>(filtrosIniciales);

        const cargarCatalogos = async (): Promise<void> => {
        const [
            categoriasResponse,
            localidadesResponse,
            serviciosResponse,
        ] = await Promise.all([
            api.get<PropertyCatalogResponse<PropertyCategory>>('/categorias'),
            api.get<PropertyCatalogResponse<PropertyLocation>>('/localidades'),
            api.get<PropertyCatalogResponse<PropertyService>>('/servicios'),
        ]);

        const respuestas = [
            categoriasResponse.data,
            localidadesResponse.data,
            serviciosResponse.data,
        ];

        const respuestaFallida = respuestas.find(
            (respuesta) => !respuesta.success
        );

        if (respuestaFallida && !respuestaFallida.success) {
            throw new Error(
                respuestaFallida.message ||
                    respuestaFallida.error ||
                    'No se pudieron cargar los filtros.'
            );
        }

        if (
            !categoriasResponse.data.success ||
            !localidadesResponse.data.success ||
            !serviciosResponse.data.success
        ) {
            throw new Error('No se pudieron cargar los filtros.');
        }

        setCategorias(categoriasResponse.data.data.items);
        setLocalidades(localidadesResponse.data.data.items);
        setServicios(serviciosResponse.data.data.items);
    };

        const construirQuery = (
        filtros: PropertyFilters,
        paginaSolicitada: number,
        ordenSolicitado: PropertyOrder
    ): string => {
        const params: string[] = [];

        const agregarIds = (
            nombre: 'categoria_id' | 'localidad_id' | 'servicio_id',
            valores: string[]
        ): void => {
            valores.forEach((id) => {
                if (id.trim() !== '') {
                    params.push(
                        `${nombre}[]=${encodeURIComponent(id)}`
                    );
                }
            });
        };

        agregarIds('categoria_id', filtros.categoria_id);
        agregarIds('localidad_id', filtros.localidad_id);
        agregarIds('servicio_id', filtros.servicio_id);

        const camposSimples: (keyof Omit<
            PropertyFilters,
            'categoria_id' | 'localidad_id' | 'servicio_id'
        >)[] = [
            'precio_min',
            'precio_max',
            'cantidad_ambientes',
            'cantidad_dormitorios',
            'cantidad_banos',
            'capacidad',
            'acepta_mascotas',
            'acepta_hijos',
        ];

        camposSimples.forEach((campo) => {
            const valor = filtros[campo];

            if (valor.trim() !== '') {
                params.push(
                    `${campo}=${encodeURIComponent(valor)}`
                );
            }
        });

        params.push(`orden=${encodeURIComponent(ordenSolicitado)}`);
        params.push(`page=${paginaSolicitada}`);
        params.push(`per_page=${POR_PAGINA}`);

        return `?${params.join('&')}`;
    };

        const cargarPropiedades = async (
        filtros: PropertyFilters,
        paginaSolicitada: number,
        ordenSolicitado: PropertyOrder
    ): Promise<void> => {
        try {
            setLoading(true);
            setError('');

            const query = construirQuery(
                filtros,
                paginaSolicitada,
                ordenSolicitado
            );

            const response = await api.get<PropertySearchResponse>(
                `/propiedades${query}`
            );

            if (!response.data.success) {
                throw new Error(
                    response.data.message ||
                        response.data.error ||
                        'No se pudieron cargar las propiedades.'
                );
            }

            const resultado = response.data.data;

            setPropiedades(resultado.items);
            setTotal(resultado.total);
            setPagina(resultado.pagination.current_page);
            setUltimaPagina(resultado.pagination.last_page);
        } catch (error) {
            console.error('PROPERTY SEARCH: ERROR', error);

            if (axios.isAxiosError(error)) {
                console.error(
                    'PROPERTY SEARCH: respuesta',
                    error.response?.data
                );
            }

            setError('No se pudieron cargar las propiedades');
            setPropiedades([]);
            setTotal(0);
            setPagina(1);
            setUltimaPagina(1);
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
                    filtrosIniciales,
                    1,
                    'antiguedad_desc'
                );
             } catch (error) {
                console.error('PROPERTY SEARCH: ERROR INICIAL', error);

                if (axios.isAxiosError(error)) {
                    console.error(
                        'PROPERTY SEARCH: respuesta',
                        error.response?.data
                    );
                }

                setError('No se pudieron cargar los datos');
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, []);

    const handleBuscar = async (filtros: PropertyFilters) => {
        // Una búsqueda nueva siempre comienza en la página 1.
        setFiltrosActivos(filtros);
        setPagina(1);

        await cargarPropiedades(filtros, 1, orden);
    };

        const cambiarPagina = async (nuevaPagina: number) => {
        if (
            loading ||
            nuevaPagina < 1 ||
            nuevaPagina > ultimaPagina ||
            nuevaPagina === pagina
        ) {
            return;
        }

        await cargarPropiedades(
            filtrosActivos,
            nuevaPagina,
            orden
        );
    };

        const ordenarSeleccion = async (nuevoOrden: PropertyOrder) => {
        setOrden(nuevoOrden);
        setOrdenAbierto(false);
        setPagina(1);

        await cargarPropiedades(
            filtrosActivos,
            1,
            nuevoOrden
        );
    };

    const ordenActual = opcionesOrden.find(
        (opcion) => opcion.valor === orden
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
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
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.content}
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
                        initialCategorias={filtrosIniciales.categoria_id}
                        initialLocalidades={filtrosIniciales.localidad_id}
                        initialServicios={filtrosIniciales.servicio_id}
                        initialAceptaMascotas={filtrosIniciales.acepta_mascotas}
                        initialAceptaHijos={filtrosIniciales.acepta_hijos}
                        onSearch={handleBuscar}
                    />
                </View>

                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>
                            {error}
                        </Text>

                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() =>
                                cargarPropiedades(
                                    filtrosActivos,
                                    pagina,
                                    orden
                                )
                            }
                            activeOpacity={0.8}
                        >
                            <Text style={styles.retryButtonText}>
                                Reintentar
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View style={styles.resultsSection}>
                    <View style={styles.resultsHeader}>
                        <View style={styles.resultsHeaderText}>
                            <Text style={styles.resultsTitle}>
                                Propiedades
                            </Text>

                            <Text style={styles.resultsCount}>
                                {total}{' '}
                                {total === 1 ? 'resultado' : 'resultados'}
                            </Text>
                        </View>

                        <View style={styles.sortContainer}>
                            <TouchableOpacity
                                style={styles.sortHeader}
                                onPress={() =>
                                    setOrdenAbierto((actual) => !actual)
                                }
                                activeOpacity={0.8}
                            >
                                <View style={styles.sortHeaderText}>
                                    <Text style={styles.sortLabel}>
                                        Ordenar por
                                    </Text>

                                    <Text
                                        style={styles.sortSummary}
                                        numberOfLines={1}
                                    >
                                        {ordenActual?.etiqueta}
                                    </Text>
                                </View>

                                <Text style={styles.sortArrow}>
                                    {ordenAbierto ? '▲' : '▼'}
                                </Text>
                            </TouchableOpacity>

                            {ordenAbierto ? (
                                <View style={styles.sortDropdown}>
                                    {opcionesOrden.map((opcion) => {
                                        const seleccionada =
                                            opcion.valor === orden;

                                        return (
                                            <TouchableOpacity
                                                key={opcion.valor}
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
                                                activeOpacity={0.8}
                                            >
                                                <Text
                                                    style={[
                                                        styles.sortOptionText,
                                                        seleccionada &&
                                                            styles.sortOptionTextSelected,
                                                    ]}
                                                >
                                                    {opcion.etiqueta}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ) : null}
                        </View>
                    </View>

                    {propiedades.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>
                                No se encontraron propiedades
                            </Text>

                            <Text style={styles.emptyText}>
                                Probá modificando los filtros de búsqueda.
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.propertiesGrid}>
                                {propiedades.map((propiedad) => (
                                    <PropertyCard
                                        key={propiedad.id}
                                        propiedad={propiedad}
                                        onPress={() =>
                                            abrirPropiedad(
                                                router,
                                                propiedad
                                            )
                                        }
                                    />
                                ))}
                            </View>

                            <View style={styles.paginationContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.paginationButton,
                                        pagina <= 1 &&
                                            styles.paginationButtonDisabled,
                                    ]}
                                    onPress={() =>
                                        cambiarPagina(pagina - 1)
                                    }
                                    disabled={pagina <= 1 || loading}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.paginationButtonText,
                                            pagina <= 1 &&
                                                styles.paginationButtonTextDisabled,
                                        ]}
                                    >
                                        Anterior
                                    </Text>
                                </TouchableOpacity>

                                <View style={styles.paginationInfo}>
                                    <Text style={styles.paginationPage}>
                                        {pagina} de {ultimaPagina}
                                    </Text>

                                    <Text style={styles.paginationCaption}>
                                        Página
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.paginationButton,
                                        pagina >= ultimaPagina &&
                                            styles.paginationButtonDisabled,
                                    ]}
                                    onPress={() =>
                                        cambiarPagina(pagina + 1)
                                    }
                                    disabled={
                                        pagina >= ultimaPagina || loading
                                    }
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.paginationButtonText,
                                            pagina >= ultimaPagina &&
                                                styles.paginationButtonTextDisabled,
                                        ]}
                                    >
                                        Siguiente
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
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
        paddingBottom: theme.spacing.xl + 90,
    },

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.lg,
    },

    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 14,
    },

    filtersContainer: {
        marginTop: theme.spacing.md,
        marginHorizontal: theme.spacing.md,
    },

    errorBox: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
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
        marginTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
    },

    retryButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },

    resultsSection: {
        marginTop: theme.spacing.sm,
    },

    resultsHeader: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
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
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        color: theme.colors.textDark,
        fontSize: 12,
    },

    sortDropdown: {
        marginTop: 6,
        padding: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.background,
    },

    sortOption: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 8,
    },

    sortOptionSelected: {
        backgroundColor: theme.colors.primary,
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

    paginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.xl,
        marginHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },

    paginationButton: {
        minHeight: 44,
        minWidth: 100,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
    },

    paginationButtonDisabled: {
        backgroundColor: theme.colors.border,
    },

    paginationButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },

    paginationButtonTextDisabled: {
        color: theme.colors.textMuted,
    },

    paginationInfo: {
        flex: 1,
        alignItems: 'center',
    },

    paginationPage: {
        color: theme.colors.textDark,
        fontSize: 15,
        fontWeight: '700',
    },

    paginationCaption: {
        marginTop: 2,
        color: theme.colors.textMuted,
        fontSize: 12,
    },

    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
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
