import {
    useLocalSearchParams,
    useRouter,
    useFocusEffect,
} from 'expo-router';

import {
    useCallback,
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
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import PropertyAdvancedFilter from '../components/PropertyAdvancedFilter';
import PropertyCard from '../components/PropertyCard';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import api, { obtenerFavoritos } from '../services/api';
import { extraerIdsFavoritos } from '../utils/formato';
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

const obtenerNombreProvincia = (provincia) =>
    String(provincia?.nombre || '').replace(/\s+New$/, '');

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
    const { isAuthenticated } = useAuth();

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
        q,
        provincia_id,
        pagina: paginaParametro,
    } = useLocalSearchParams();
    const busquedaInicial = Array.isArray(q) ? q[0] : q;
    const provinciaInicial = Array.isArray(provincia_id)
        ? provincia_id[0]
        : provincia_id;
    const paginaInicial = Array.isArray(paginaParametro)
        ? paginaParametro[0]
        : paginaParametro;

    const aceptaMascotasInicial =
        (Array.isArray(acepta_mascotas)
            ? acepta_mascotas[0]
            : acepta_mascotas) ?? '';
    const aceptaHijosInicial =
        (Array.isArray(acepta_hijos)
            ? acepta_hijos[0]
            : acepta_hijos) ?? '';

    const [propiedades, setPropiedades] =
        useState([]);

    const [favoritosIds, setFavoritosIds] =
        useState(() => new Set());

    const [categorias, setCategorias] =
        useState([]);

    const [localidades, setLocalidades] =
        useState([]);

    const [servicios, setServicios] =
        useState([]);

    const [provincias, setProvincias] =
        useState([]);

    const [busqueda, setBusqueda] =
        useState(busquedaInicial || '');

    const [provinciaSeleccionada, setProvinciaSeleccionada] =
        useState(provinciaInicial || '');

    const [provinciasAbierto, setProvinciasAbierto] =
        useState(false);

    const [pagina, setPagina] = useState(() => {
        const valor = Number(paginaInicial);
        return Number.isInteger(valor) && valor > 0 ? valor : 1;
    });

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    const [orden, setOrden] =
        useState('antiguedad_desc');

    const [ordenAbierto, setOrdenAbierto] =
        useState(false);

    const [aceptaMascotas, setAceptaMascotas] = useState(
        () =>
            aceptaMascotasInicial === '1' ||
            aceptaMascotasInicial === 'true'
    );
    const [aceptaHijos, setAceptaHijos] = useState(
        () =>
            aceptaHijosInicial === '1' ||
            aceptaHijosInicial === 'true'
    );

    const cargarFavoritos = useCallback(async () => {
        if (!isAuthenticated) {
            setFavoritosIds(new Set());
            return;
        }

        try {
            const response = await obtenerFavoritos();

            if (!response?.success) {
                throw new Error(
                    response?.error ||
                        response?.message ||
                        'No se pudieron obtener los favoritos'
                );
            }

            setFavoritosIds(
                new Set(extraerIdsFavoritos(response))
            );
        } catch (error) {
            console.error(
                'PROPERTY SEARCH: error al cargar favoritos',
                error
            );
        }
    }, [isAuthenticated]);

    const actualizarFavorito = useCallback(
        (propiedadId, esFavorito) => {
            setFavoritosIds((actuales) => {
                const nuevos = new Set(actuales);
                const id = Number(propiedadId);

                if (esFavorito) {
                    nuevos.add(id);
                } else {
                    nuevos.delete(id);
                }

                return nuevos;
            });
        },
        []
    );

    useFocusEffect(
        useCallback(() => {
            cargarFavoritos();
        }, [cargarFavoritos])
    );

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

            acepta_mascotas:
                aceptaMascotasInicial,

            acepta_hijos:
                aceptaHijosInicial,
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
            aceptaMascotasInicial,
            aceptaHijosInicial,
        ]
    );

    const cargarCatalogos = useCallback(async () => {
        const [
            categoriasResponse,
            localidadesResponse,
            serviciosResponse,
            provinciasResponse,
        ] = await Promise.all([
            api.get('/categorias'),
            api.get('/localidades'),
            api.get('/servicios'),
            api.get('/provincias'),
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

        setProvincias(
            provinciasResponse.data?.data?.items ||
            provinciasResponse.data?.data ||
            provinciasResponse.data ||
            []
        );
    }, []);

    const construirQuery = useCallback((filtros) => {
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

        if (filtros.acepta_mascotas) {
            params.push('acepta_mascotas=1');
        }

        if (filtros.acepta_hijos) {
            params.push('acepta_hijos=1');
        }

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
    }, []);

    const cargarPropiedades = useCallback(async (
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
    }, [construirQuery]);

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
    }, [cargarCatalogos, cargarPropiedades, filtrosIniciales]);

    const handleBuscar = useCallback(async (filtros) => {
        setPagina(1);
        await cargarPropiedades({
            ...filtros,
            acepta_mascotas: aceptaMascotas,
            acepta_hijos: aceptaHijos,
        });
    }, [aceptaMascotas, aceptaHijos, cargarPropiedades]);

    const propiedadesOrdenadas = useMemo(() => {
        const termino = busqueda.trim().toLocaleLowerCase('es');
        const resultado = propiedades.filter((propiedad) => {
            const disponible =
                propiedad.disponible !== false &&
                propiedad.disponible !== 0 &&
                propiedad.disponible !== '0';

            if (!disponible) {
                return false;
            }

            if (termino) {
                const coincideTexto = [
                    propiedad.titulo,
                    propiedad.direccion,
                    propiedad.descripcion,
                ].some((texto) =>
                    String(texto || '')
                        .toLocaleLowerCase('es')
                        .includes(termino)
                );

                if (!coincideTexto) {
                    return false;
                }
            }

            if (provinciaSeleccionada) {
                const localidad = localidades.find(
                    (item) =>
                        String(item.id) ===
                        String(propiedad.localidad_id)
                );
                const provinciaId =
                    localidad?.provincia_id ??
                    propiedad.localidad?.provincia_id;

                if (String(provinciaId) !== String(provinciaSeleccionada)) {
                    return false;
                }
            }

            return true;
        });

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
        busqueda,
        provinciaSeleccionada,
        localidades,
        orden,
    ]);

    const propiedadesPorPagina = 9;
    const totalPaginas = Math.max(
        1,
        Math.ceil(propiedadesOrdenadas.length / propiedadesPorPagina)
    );
    const paginaActual = Math.min(pagina, totalPaginas);
    const propiedadesPaginadas = propiedadesOrdenadas.slice(
        (paginaActual - 1) * propiedadesPorPagina,
        paginaActual * propiedadesPorPagina
    );
    const inicioPaginaVisible = Math.max(
        1,
        Math.min(paginaActual - 2, totalPaginas - 4)
    );
    const paginasVisibles = Array.from(
        {
            length: Math.min(5, totalPaginas),
        },
        (_, indice) => inicioPaginaVisible + indice
    );

    const ordenarSeleccion = (
        nuevoOrden
    ) => {
        setOrden(nuevoOrden);
        setPagina(1);
        setOrdenAbierto(false);
    };

    const ordenActual = opcionesOrden.find(
        (opcion) =>
            opcion.valor === orden
    );
    const provinciaActual = provincias.find(
        (provincia) =>
            String(provincia.id) === String(provinciaSeleccionada)
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
                    <View style={styles.searchField}>
                        <Text style={styles.searchFieldLabel}>
                            Buscar por título o dirección
                        </Text>
                        <TextInput
                            style={styles.searchInput}
                            value={busqueda}
                            onChangeText={(valor) => {
                                setBusqueda(valor);
                                setPagina(1);
                            }}
                            placeholder="Ej.: casa en Crespo"
                            placeholderTextColor={theme.colors.textMuted}
                            autoCapitalize="none"
                            returnKeyType="search"
                            accessibilityLabel="Buscar propiedades por título o dirección"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.provinceHeader}
                        onPress={() =>
                            setProvinciasAbierto((actual) => !actual)
                        }
                        activeOpacity={0.8}
                        accessibilityRole="button"
                    >
                        <View style={styles.provinceHeaderText}>
                            <Text style={styles.provinceLabel}>Provincia</Text>
                            <Text style={styles.provinceSummary}>
                                {provinciaActual
                                    ? obtenerNombreProvincia(provinciaActual)
                                    : 'Todas'}
                            </Text>
                        </View>
                        <Text style={styles.provinceArrow}>
                            {provinciasAbierto ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>

                    {provinciasAbierto ? (
                        <View style={styles.provinceOptions}>
                            <ScrollView
                                nestedScrollEnabled
                                style={styles.provinceOptionsScroll}
                                showsVerticalScrollIndicator
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.provinceOption,
                                        !provinciaSeleccionada &&
                                            styles.provinceOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setProvinciaSeleccionada('');
                                        setProvinciasAbierto(false);
                                        setPagina(1);
                                    }}
                                    accessibilityRole="button"
                                >
                                    <Text
                                        style={[
                                            styles.provinceOptionText,
                                            !provinciaSeleccionada &&
                                                styles.provinceOptionTextSelected,
                                        ]}
                                    >
                                        Todas las provincias
                                    </Text>
                                </TouchableOpacity>
                                {provincias.map((provincia) => {
                                    const seleccionada =
                                        String(provincia.id) ===
                                        String(provinciaSeleccionada);

                                    return (
                                        <TouchableOpacity
                                            key={provincia.id}
                                            style={[
                                                styles.provinceOption,
                                                seleccionada &&
                                                    styles.provinceOptionSelected,
                                            ]}
                                            onPress={() => {
                                                setProvinciaSeleccionada(
                                                    String(provincia.id)
                                                );
                                                setProvinciasAbierto(false);
                                                setPagina(1);
                                            }}
                                            accessibilityRole="button"
                                        >
                                            <Text
                                                style={[
                                                    styles.provinceOptionText,
                                                    seleccionada &&
                                                        styles.provinceOptionTextSelected,
                                                ]}
                                            >
                                                {obtenerNombreProvincia(
                                                    provincia
                                                )}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    ) : null}

                    <PropertyAdvancedFilter
                        key={JSON.stringify(filtrosIniciales)}
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
                        initialPrecioMin={
                            filtrosIniciales.precio_min
                        }
                        initialPrecioMax={
                            filtrosIniciales.precio_max
                        }
                        initialCantidadAmbientes={
                            filtrosIniciales.cantidad_ambientes
                        }
                        initialCantidadDormitorios={
                            filtrosIniciales.cantidad_dormitorios
                        }
                        initialCantidadBanos={
                            filtrosIniciales.cantidad_banos
                        }
                        initialCapacidad={
                            filtrosIniciales.capacidad
                        }
                        onSearch={handleBuscar}
                    />
                    <View style={styles.filtroAdicional}>
                        <TouchableOpacity
                            style={styles.filtroAdicionalItem}
                            onPress={() => {
                                setAceptaMascotas((actual) => !actual)
                                setPagina(1);
                            }}
                        >
                            <Text style={styles.filtroAdicionalTexto}>
                                {aceptaMascotas ? 'Dejá de filtrar mascotas' : 'Filtrar mascotas'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.filtroAdicionalItem}
                            onPress={() => {
                                setAceptaHijos((actual) => !actual)
                                setPagina(1);
                            }}
                        >
                            <Text style={styles.filtroAdicionalTexto}>
                                {aceptaHijos ? 'Dejá de filtrar hijos' : 'Filtrar hijos'}
                            </Text>
                        </TouchableOpacity>
                    </View>
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
                            <Text style={styles.pageSummary}>
                                Página {paginaActual} de {totalPaginas}
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

                    {propiedadesPaginadas.length === 0 ? (
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
                            {propiedadesPaginadas.map(
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
                                        mostrarFavorito
                                        esFavoritoInicial={
                                            favoritosIds.has(
                                                Number(propiedad.id)
                                            )
                                        }
                                        onCambioFavorito={
                                            actualizarFavorito
                                        }
                                    />
                                )
                            )}
                        </View>
                    )}

                    {totalPaginas > 1 ? (
                        <View style={styles.pagination}>
                            <TouchableOpacity
                                style={[
                                    styles.pageButton,
                                    paginaActual === 1 &&
                                        styles.pageButtonDisabled,
                                ]}
                                onPress={() => setPagina(paginaActual - 1)}
                                disabled={paginaActual === 1}
                                accessibilityRole="button"
                                accessibilityLabel="Página anterior"
                            >
                                <Text
                                    style={[
                                        styles.pageButtonText,
                                        paginaActual === 1 &&
                                            styles.pageButtonTextDisabled,
                                    ]}
                                >
                                    ‹ Anterior
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.pageNumbers}>
                                {paginasVisibles.map((numero) => {
                                    const activa = numero === paginaActual;

                                    return (
                                        <TouchableOpacity
                                            key={numero}
                                            style={[
                                                styles.pageNumber,
                                                activa &&
                                                    styles.pageNumberActive,
                                            ]}
                                            onPress={() => setPagina(numero)}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Página ${numero}`}
                                            accessibilityState={{
                                                selected: activa,
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.pageNumberText,
                                                    activa &&
                                                        styles.pageNumberTextActive,
                                                ]}
                                            >
                                                {numero}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.pageButton,
                                    paginaActual === totalPaginas &&
                                        styles.pageButtonDisabled,
                                ]}
                                onPress={() => setPagina(paginaActual + 1)}
                                disabled={paginaActual === totalPaginas}
                                accessibilityRole="button"
                                accessibilityLabel="Página siguiente"
                            >
                                <Text
                                    style={[
                                        styles.pageButtonText,
                                        paginaActual === totalPaginas &&
                                            styles.pageButtonTextDisabled,
                                    ]}
                                >
                                    Siguiente ›
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
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

    searchField: {
        marginBottom: theme.spacing.sm,
    },

    searchFieldLabel: {
        marginBottom: theme.spacing.xs,
        color: theme.colors.textDark,
        fontSize: 13,
        fontWeight: '600',
    },

    searchInput: {
        minHeight: 48,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.white,
        color: theme.colors.textDark,
        fontSize: 14,
    },

    provinceHeader: {
        minHeight: 54,
        marginBottom: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
    },

    provinceHeaderText: {
        flex: 1,
    },

    provinceLabel: {
        color: theme.colors.textDark,
        fontSize: 13,
        fontWeight: '600',
    },

    provinceSummary: {
        marginTop: 2,
        color: theme.colors.textMuted,
        fontSize: 12,
    },

    provinceArrow: {
        marginLeft: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 12,
    },

    provinceOptions: {
        marginBottom: theme.spacing.sm,
        padding: theme.spacing.xs,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.white,
    },

    provinceOptionsScroll: {
        maxHeight: 180,
    },

    provinceOption: {
        minHeight: 42,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: 8,
    },

    provinceOptionSelected: {
        backgroundColor: theme.colors.primary,
    },

    provinceOptionText: {
        color: theme.colors.textDark,
        fontSize: 14,
    },

    provinceOptionTextSelected: {
        color: theme.colors.white,
        fontWeight: '600',
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

    pageSummary: {
        marginTop: theme.spacing.xs,
        color: theme.colors.textMuted,
        fontSize: 12,
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
        color: theme.colors.textMuted,
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
        color: theme.colors.white,
        fontWeight: '600',
    },

    propertiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        rowGap: theme.spacing.md,
    },

    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.lg,
        marginHorizontal: theme.spacing.md,
        gap: theme.spacing.xs,
    },

    pageButton: {
        minHeight: 40,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: 9,
        backgroundColor: theme.colors.white,
    },

    pageButtonDisabled: {
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.neutralBg,
    },

    pageButtonText: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },

    pageButtonTextDisabled: {
        color: theme.colors.disabled,
    },

    pageNumbers: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.xs,
    },

    pageNumber: {
        width: 34,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 9,
        backgroundColor: theme.colors.neutralBg,
    },

    pageNumberActive: {
        backgroundColor: theme.colors.primary,
    },

    pageNumberText: {
        color: theme.colors.textDark,
        fontSize: 13,
        fontWeight: '600',
    },

    pageNumberTextActive: {
        color: theme.colors.white,
        fontWeight: '700',
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