import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import PropertyCard from '../components/PropertyCard';
import PublicarPropiedadSection from '../components/PublicarPropiedadSection';
import { useAuth } from '../context/AuthContext';
import api, {
    obtenerCantidadNotificacionesNoLeidas,
} from '../services/api';
import { abrirPropiedad } from '../services/propertyNavigation';
import {
    obtenerPropiedadesVistas
} from '../services/recentProperties';
import { theme } from '../theme/theme';

const colorConOpacidad = (color, opacidad) => {
    if (!color) {
        return 'rgba(0, 0, 0, 0)';
    }

    const hex = color.replace('#', '');

    if (hex.length !== 6) {
        return color;
    }

    const rojo = parseInt(hex.substring(0, 2), 16);
    const verde = parseInt(hex.substring(2, 4), 16);
    const azul = parseInt(hex.substring(4, 6), 16);

    return `rgba(${rojo}, ${verde}, ${azul}, ${opacidad})`;
};

const limitar = (valor, minimo, maximo) =>
    Math.min(Math.max(valor, minimo), maximo);

const crearValoresResponsive = (width, height) => {
    /*
     * 375px representa un teléfono de referencia.
     *
     * La escala queda limitada para evitar que:
     * - celulares pequeños reduzcan demasiado los elementos;
     * - tablets hagan crecer excesivamente la interfaz.
     */
    const escala = limitar(width / 375, 0.88, 1.2);

    /*
     * La altura se utiliza solamente para separar secciones
     * y reservar espacio para la navegación inferior.
     */
    const separacionSeccion = limitar(
        height * 0.025,
        16,
        28
    );

    const separacionPequena = limitar(
        6 * escala,
        5,
        8
    );

    const separacionMedia = limitar(
        12 * escala,
        10,
        16
    );

    const separacionGrande = limitar(
        18 * escala,
        14,
        24
    );

    const paddingHorizontal = limitar(
        width * 0.043,
        16,
        28
    );

    const paddingHero = limitar(
        width * 0.043,
        16,
        28
    );

    const radioPequeno = limitar(
        10 * escala,
        8,
        12
    );

    const radioMedio = limitar(
        16 * escala,
        14,
        20
    );

    const radioGrande = limitar(
        28 * escala,
        24,
        34
    );

    const fontBody = limitar(
        14 * escala,
        13,
        16
    );

    const fontSmall = limitar(
        12 * escala,
        11,
        14
    );

    const fontFilter = limitar(
        13 * escala,
        12,
        15
    );

    const fontSectionTitle = limitar(
        24 * escala,
        21,
        29
    );

    const fontHeroTitle = limitar(
        30 * escala,
        26,
        36
    );

    const iconCategory = limitar(
        30 * escala,
        26,
        36
    );

    const categorySize = limitar(
        68 * escala,
        60,
        78
    );

    const categoryWidth = limitar(
        100 * escala,
        90,
        120
    );

    const bottomContentSpace = limitar(
        height * 0.1,
        120,
        160
    );

    return {
        escala,
        separacionSeccion,
        separacionPequena,
        separacionMedia,
        separacionGrande,
        paddingHorizontal,
        paddingHero,
        radioPequeno,
        radioMedio,
        radioGrande,
        fontBody,
        fontSmall,
        fontFilter,
        fontSectionTitle,
        fontHeroTitle,
        iconCategory,
        categorySize,
        categoryWidth,
        bottomContentSpace,
    };
};

export default function HomeScreen() {
    const router = useRouter();

    const { isAuthenticated } = useAuth();

    const { width, height } = useWindowDimensions();

    const responsive = useMemo(
        () => crearValoresResponsive(width, height),
        [width, height]
    );

    const styles = useMemo(
        () => crearEstilos(responsive),
        [responsive]
    );

    const [propiedades, setPropiedades] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [localidades, setLocalidades] = useState([]);

    const [categoriasBusqueda, setCategoriasBusqueda] =
        useState([]);

    const [localidadesBusqueda, setLocalidadesBusqueda] =
        useState([]);

    const [categoriasAbierto, setCategoriasAbierto] =
        useState(false);

    const [localidadesAbierto, setLocalidadesAbierto] =
        useState(false);

    const [propiedadesVistas, setPropiedadesVistas] =
        useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [notificacionesNoLeidas, setNotificacionesNoLeidas] =
    useState(0);

    const cargarPropiedadesVistas = useCallback(async () => {
        const idsVistos = await obtenerPropiedadesVistas();

        const vistas = idsVistos
            .map((id) =>
                propiedades.find(
                    (propiedad) =>
                        Number(propiedad.id) === Number(id)
                )
            )
            .filter(Boolean);

        setPropiedadesVistas(vistas);
    }, [propiedades]);

    useEffect(() => {
        let activo = true;

        const cargarDatos = async () => {
            try {
                const [
                    propiedadesResponse,
                    categoriasResponse,
                    localidadesResponse,
                ] = await Promise.all([
                    api.get('/propiedades'),
                    api.get('/categorias'),
                    api.get('/localidades'),
                ]);

                if (!activo) return;

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

                setPropiedades(
                    propiedadesResponse.data?.data?.items || []
                );
            } catch (error) {
                console.error('HOME: ERROR', error);
                console.error('HOME: código', error.code);
                console.error('HOME: mensaje', error.message);
                console.error(
                    'HOME: respuesta',
                    error.response?.data
                );

                if (activo) {
                    setError('No se pudieron cargar los datos');
                }
            } finally {
                if (activo) {
                    setLoading(false);
                }
            }
        };

        cargarDatos();

        return () => {
            activo = false;
        };
    }, []);

    const cargarNotificacionesNoLeidas = useCallback(async () => {
        try {
            if (!isAuthenticated) {
                setNotificacionesNoLeidas(0);
                return;
            }

            const response =
                await obtenerCantidadNotificacionesNoLeidas();

            if (!response?.success) {
                setNotificacionesNoLeidas(0);
                return;
            }

            setNotificacionesNoLeidas(
                Number(response.data?.no_leidas || 0)
            );
        } catch (error) {
            console.error(
                'HOME: error al cargar notificaciones',
                error
            );

            setNotificacionesNoLeidas(0);
        }
    }, [isAuthenticated]);

    useFocusEffect(
        useCallback(() => {
            if (propiedades.length > 0) {
                cargarPropiedadesVistas();
            }
        }, [propiedades.length, cargarPropiedadesVistas])
    );

    useFocusEffect(
        useCallback(() => {
            cargarNotificacionesNoLeidas();
        }, [cargarNotificacionesNoLeidas])
    );

    const toggleCategoria = (id) => {
        const categoriaId = String(id);

        setCategoriasBusqueda((actuales) =>
            actuales.includes(categoriaId)
                ? actuales.filter(
                    (actualId) => actualId !== categoriaId
                )
                : [...actuales, categoriaId]
        );
    };

    const toggleLocalidad = (id) => {
        const localidadId = String(id);

        setLocalidadesBusqueda((actuales) =>
            actuales.includes(localidadId)
                ? actuales.filter(
                    (actualId) => actualId !== localidadId
                )
                : [...actuales, localidadId]
        );
    };

    const handlePropiedadVista = async (propiedad) => {
        await abrirPropiedad(router, propiedad);

        setPropiedadesVistas((actuales) => [
            propiedad,
            ...actuales.filter(
                (actual) => actual.id !== propiedad.id
            ),
        ]);
    };

    const handleBuscar = () => {
        const params = {};

        if (categoriasBusqueda.length > 0) {
            params.categoria_id = categoriasBusqueda;
        }

        if (localidadesBusqueda.length > 0) {
            params.localidad_id = localidadesBusqueda;
        }

        router.push({
            pathname: '/propiedades',
            params,
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Cargando...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* HERO */}
            <View style={styles.hero}>
                <View style={styles.heroHeader}>
                    <Text style={styles.heroTitle}>
                        AlquilER
                    </Text>

                    {isAuthenticated ? (
                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={() => router.push('/notifications')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.notificationIcon}>
                                🔔
                            </Text>

                            {notificacionesNoLeidas > 0 ? (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>
                                        {notificacionesNoLeidas > 9
                                            ? '9+'
                                            : notificacionesNoLeidas}
                                    </Text>
                                </View>
                            ) : null}
                        </TouchableOpacity>
                    ) : null}
                </View>

                <View style={styles.descriptionCard}>
                    <Text style={styles.descriptionTitle}>
                        Alquilá con más confianza
                    </Text>

                    <Text style={styles.descriptionText}>
                        Calificaciones y reseñas de la comunidad
                        para una mayor transparencia.
                    </Text>
                </View>

                <View style={styles.searchBox}>

                    {/* LOCALIDAD */}
                <TouchableOpacity
                    style={styles.dropdownHeader}
                    onPress={() =>
                        setLocalidadesAbierto(
                            (actual) => !actual
                        )
                    }
                    activeOpacity={0.8}
                >
                    <View style={styles.dropdownHeaderText}>
                        <Text style={styles.filterLabelDropdown}>
                            Localidad
                        </Text>

                        <Text style={styles.dropdownSummary}>
                            {localidadesBusqueda.length === 0
                                ? 'Todas'
                                : `${localidadesBusqueda.length} seleccionadas`}
                        </Text>
                    </View>

                    <Text style={styles.dropdownArrow}>
                        {localidadesAbierto ? '▲' : '▼'}
                    </Text>
                </TouchableOpacity>

                {localidadesAbierto ? (
                    <View style={styles.dropdownContent}>
                        <ScrollView
                            style={styles.optionsDropdownScroll}
                            nestedScrollEnabled
                            showsVerticalScrollIndicator={false}
                        >
                            <View
                                style={
                                    styles.optionsDropdownContainer
                                }
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.filterOption,
                                        localidadesBusqueda.length === 0 &&
                                            styles.filterOptionSelected,
                                    ]}
                                    onPress={() =>
                                        setLocalidadesBusqueda([])
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.filterOptionText,
                                            localidadesBusqueda.length === 0 &&
                                                styles.filterOptionTextSelected,
                                        ]}
                                    >
                                        Todas
                                    </Text>
                                </TouchableOpacity>

                                {localidades.map((localidad) => {
                                    const seleccionada =
                                        localidadesBusqueda.includes(
                                            String(localidad.id)
                                        );

                                    return (
                                        <TouchableOpacity
                                            key={localidad.id}
                                            style={[
                                                styles.filterOption,
                                                seleccionada &&
                                                    styles.filterOptionSelected,
                                            ]}
                                            onPress={() =>
                                                toggleLocalidad(
                                                    localidad.id
                                                )
                                            }
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterOptionText,
                                                    seleccionada &&
                                                        styles.filterOptionTextSelected,
                                                ]}
                                            >
                                                {localidad.nombre}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                ) : null}


                {/* TIPO */}
                <TouchableOpacity
                    style={styles.dropdownHeader}
                    onPress={() =>
                        setCategoriasAbierto(
                            (actual) => !actual
                        )
                    }
                    activeOpacity={0.8}
                >
                    <View style={styles.dropdownHeaderText}>
                        <Text style={styles.filterLabelDropdown}>
                            Tipo
                        </Text>

                        <Text style={styles.dropdownSummary}>
                            {categoriasBusqueda.length === 0
                                ? 'Todos'
                                : `${categoriasBusqueda.length} seleccionados`}
                        </Text>
                    </View>

                    <Text style={styles.dropdownArrow}>
                        {categoriasAbierto ? '▲' : '▼'}
                    </Text>
                </TouchableOpacity>

                {categoriasAbierto ? (
                    <View style={styles.dropdownContent}>
                        <ScrollView
                            style={styles.optionsDropdownScroll}
                            nestedScrollEnabled
                            showsVerticalScrollIndicator={false}
                        >
                            <View
                                style={
                                    styles.optionsDropdownContainer
                                }
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.filterOption,
                                        categoriasBusqueda.length === 0 &&
                                            styles.filterOptionSelected,
                                    ]}
                                    onPress={() =>
                                        setCategoriasBusqueda([])
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.filterOptionText,
                                            categoriasBusqueda.length === 0 &&
                                                styles.filterOptionTextSelected,
                                        ]}
                                    >
                                        Todos
                                    </Text>
                                </TouchableOpacity>

                                {categorias.map((categoria) => {
                                    const seleccionada =
                                        categoriasBusqueda.includes(
                                            String(categoria.id)
                                        );

                                    return (
                                        <TouchableOpacity
                                            key={categoria.id}
                                            style={[
                                                styles.filterOption,
                                                seleccionada &&
                                                    styles.filterOptionSelected,
                                            ]}
                                            onPress={() =>
                                                toggleCategoria(
                                                    categoria.id
                                                )
                                            }
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterOptionText,
                                                    seleccionada &&
                                                        styles.filterOptionTextSelected,
                                                ]}
                                            >
                                                {categoria.nombre}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                ) : null}

                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={handleBuscar}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.searchButtonText}>
                            🔍 Buscar propiedades
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                </View>
            ) : null}

            {/* VISTOS RECIENTEMENTE */}
            {propiedadesVistas.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionBadge}>
                            Tu actividad
                        </Text>

                        <Text style={styles.sectionTitle}>
                            Vistos recientemente
                        </Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.propertiesScroll}
                    >
                        {propiedadesVistas
                            .slice(0, 5)
                            .map((propiedad) => (
                                <PropertyCard
                                    key={propiedad.id}
                                    propiedad={propiedad}
                                    onPress={() => handlePropiedadVista(propiedad)}
                                />
                            ))}
                    </ScrollView>
                </View>
            )}

            {/* PROPIEDADES RECIENTES */}
            <View
                style={[
                    styles.section,
                    styles.sectionHighlight,
                    {
                        backgroundColor: colorConOpacidad(
                            theme.colors.primary,
                            0.06
                        ),
                    },
                ]}
            >
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionBadge}>
                        Catálogo
                    </Text>

                    <Text style={styles.sectionTitle}>
                        Nuevas propiedades
                    </Text>

                    <Text style={styles.sectionDescription}>
                        Las últimas publicaciones en AlquilER
                    </Text>
                </View>

                {propiedades.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.propertiesScroll}
                    >
                        {propiedades.slice(0, 5).map((propiedad) => (
                            <PropertyCard
                                key={propiedad.id}
                                propiedad={propiedad}
                                onPress={() =>
                                    handlePropiedadVista(propiedad)
                                }
                            />
                        ))}
                    </ScrollView>
                ) : (
                    <Text style={styles.emptyText}>
                        No hay propiedades publicadas.
                    </Text>
                )}
            </View>

                <PublicarPropiedadSection />

        </ScrollView>
    );
}

const crearEstilos = (responsive) => {
    const {
        separacionSeccion,
        separacionPequena,
        separacionMedia,
        separacionGrande,
        paddingHorizontal,
        paddingHero,
        radioPequeno,
        radioMedio,
        radioGrande,
        fontBody,
        fontSmall,
        fontFilter,
        fontSectionTitle,
        fontHeroTitle,
        iconCategory,
        categorySize,
        categoryWidth,
        bottomContentSpace,
    } = responsive;

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },

        content: {
            paddingBottom: bottomContentSpace,
        },

        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
            paddingHorizontal,
        },

        loadingText: {
            marginTop: separacionMedia,
            color: theme.colors.textMuted,
            fontSize: fontBody,
        },

        hero: {
            backgroundColor: theme.colors.primary,
            paddingHorizontal: paddingHero,
            paddingTop: separacionPequena,
            paddingBottom: separacionMedia,
            borderBottomLeftRadius: radioGrande,
            borderBottomRightRadius: radioGrande,
        },

        heroTitle: {
            color: theme.colors.white,
            fontSize: fontHeroTitle,
            fontWeight: '700',
            textAlign: 'center',
            paddingVertical: separacionMedia,
        },

    notificationButton: {
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: [
            {
                translateY: -20,
            },
        ],
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colorConOpacidad(
            theme.colors.white,
            0.15
        ),
        borderWidth: 1,
        borderColor: colorConOpacidad(
            theme.colors.white,
            0.25
        ),
        justifyContent: 'center',
        alignItems: 'center',
    },

    notificationIcon: {
        fontSize: 21,
    },

    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 4,
        borderRadius: 10,
        backgroundColor: theme.colors.errorText,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },

    notificationBadgeText: {
        color: theme.colors.white,
        fontSize: 10,
        fontWeight: '700',
    },

        descriptionCard: {
        width: '90%',
        maxWidth: 560,
        alignSelf: 'center',
        marginBottom: separacionMedia,
        paddingHorizontal: separacionGrande,
        paddingVertical: separacionMedia,
        borderRadius: radioMedio,
        backgroundColor: colorConOpacidad(
            theme.colors.white,
            0.12
        ),
        borderWidth: 1,
        borderColor: colorConOpacidad(
            theme.colors.white,
            0.22
        ),
    },

    descriptionTitle: {
        color: theme.colors.white,
        fontSize: fontBody + 2,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: separacionPequena,
    },

    descriptionText: {
        color: theme.colors.white,
        opacity: 0.9,
        fontSize: fontSmall,
        lineHeight: fontSmall + 6,
        textAlign: 'center',
    },

        searchBox: {
            backgroundColor: theme.colors.white,
            borderRadius: radioMedio,
            paddingHorizontal: separacionGrande,
            paddingVertical: separacionMedia,
            width: '90%',
            maxWidth: 560,
            alignSelf: 'center',
        },

        searchTitle: {
            fontSize: fontBody + 4,
            fontWeight: '700',
            color: theme.colors.textDark,
            textAlign: 'center',
            marginBottom: separacionMedia,
        },

        filterLabel: {
            fontSize: fontBody,
            fontWeight: '600',
            color: theme.colors.textDark,
            marginBottom: separacionPequena,
        },

        filterScroll: {
            marginBottom: separacionMedia,
        },

        filterOption: {
            paddingHorizontal: separacionMedia,
            paddingVertical: separacionPequena,
            borderRadius: 999,
            backgroundColor: theme.colors.inputBg,
            marginRight: separacionPequena,
        },

        filterOptionSelected: {
            backgroundColor: theme.colors.primary,
        },

        filterOptionText: {
            color: theme.colors.textDark,
            fontSize: fontFilter,
        },

        filterOptionTextSelected: {
            color: theme.colors.white,
            fontWeight: '600',
        },

        searchButton: {
            backgroundColor: theme.colors.primary,
            borderRadius: radioPequeno,
            paddingVertical: separacionMedia,
            paddingHorizontal: separacionGrande,
            alignItems: 'center',
        },

        searchButtonText: {
            color: theme.colors.white,
            fontSize: fontBody,
            fontWeight: '600',
            textAlign: 'center',
        },

        errorBox: {
            marginHorizontal: paddingHorizontal,
            marginTop: separacionSeccion,
            padding: separacionMedia,
            borderRadius: radioPequeno,
            backgroundColor: theme.colors.errorBg,
        },

        errorText: {
            color: theme.colors.errorText,
            textAlign: 'center',
            fontSize: fontBody,
        },

        quickCategoriesSection: {
            marginTop: separacionSeccion,
        },

        section: {
            marginTop: separacionSeccion,
        },

        sectionHighlight: {
            paddingVertical: separacionGrande,
        },

        sectionHeader: {
            paddingHorizontal,
            marginBottom: separacionGrande,
        },

        sectionBadge: {
            color: theme.colors.primary,
            fontSize: fontSmall,
            fontWeight: '700',
            textTransform: 'uppercase',
            marginBottom: separacionPequena,
        },

        sectionTitle: {
            color: theme.colors.textDark,
            fontSize: fontSectionTitle,
            fontWeight: '700',
            marginBottom: separacionPequena,
        },

        sectionDescription: {
            color: theme.colors.textMuted,
            fontSize: fontBody,
            lineHeight: fontBody + 6,
        },

        categoriesScroll: {
            paddingHorizontal,
            gap: separacionMedia,
        },

        categoryCard: {
            width: categoryWidth,
            alignItems: 'center',
        },

        categoryIcon: {
            width: categorySize,
            height: categorySize,
            borderRadius: categorySize / 2,
            backgroundColor: theme.colors.inputBg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: separacionPequena,
        },

        categoryIconText: {
            fontSize: iconCategory,
        },

        categoryName: {
            color: theme.colors.textDark,
            fontSize: fontFilter,
            fontWeight: '600',
            textAlign: 'center',
        },

        propertiesScroll: {
            paddingHorizontal,
            gap: separacionMedia,
        },

        emptyText: {
            color: theme.colors.textMuted,
            textAlign: 'center',
            paddingHorizontal,
            paddingVertical: separacionGrande,
            fontSize: fontBody,
        },

        dropdownHeader: {
        minHeight: 54,
        marginBottom: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
    },

    dropdownHeaderText: {
        flex: 1,
    },

    filterLabelDropdown: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textDark,
    },

    dropdownSummary: {
        marginTop: 2,
        fontSize: 12,
        color: theme.colors.textMuted,
    },

    dropdownArrow: {
        marginLeft: 12,
        fontSize: 12,
        color: theme.colors.text,
    },

    dropdownContent: {
        marginBottom: 10,
        padding: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
    },

    optionsDropdownScroll: {
        maxHeight: 170,
    },

    optionsDropdownContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    });
};