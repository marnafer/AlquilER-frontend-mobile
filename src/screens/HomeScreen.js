import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import PropertyCard from '../components/PropertyCard';
import api from '../services/api';
import {
    guardarPropiedadVista,
    obtenerPropiedadesVistas,
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


export default function HomeScreen() {
    const router = useRouter();

    const [propiedades, setPropiedades] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [localidades, setLocalidades] = useState([]);

    const [categoriasBusqueda, setCategoriasBusqueda] = useState([]);
    const [localidadesBusqueda, setLocalidadesBusqueda] = useState([]);

    const [propiedadesVistas, setPropiedadesVistas] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarPropiedadesVistas = async () => {
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
    };

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError('');

            const [
                propiedadesResponse,
                categoriasResponse,
                localidadesResponse
            ] = await Promise.all([
                api.get('/propiedades'),
                api.get('/categorias'),
                api.get('/localidades')
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

            const propiedadesData =
                propiedadesResponse.data?.data?.items || [];

            setPropiedades(propiedadesData);

        } catch (error) {
            console.error('HOME: ERROR', error);
            console.error('HOME: código', error.code);
            console.error('HOME: mensaje', error.message);
            console.error(
                'HOME: respuesta',
                error.response?.data
            );

            setError(
                'No se pudieron cargar los datos'
            );
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (propiedades.length > 0) {
                cargarPropiedadesVistas();
            }
        }, [propiedades])
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
        await guardarPropiedadVista(propiedad.id);

        setPropiedadesVistas((actuales) => [
            propiedad,
            ...actuales.filter(
                (actual) => actual.id !== propiedad.id
            ),
        ]);

        router.push(
            `/propiedades/${propiedad.id}`
        );
    };

    const handleBuscar = () => {
        const params = [];

        categoriasBusqueda.forEach((id) => {
            params.push(
                `categoria_id[]=${encodeURIComponent(id)}`
            );
        });

        localidadesBusqueda.forEach((id) => {
            params.push(
                `localidad_id[]=${encodeURIComponent(id)}`
            );
        });

        const query = params.length > 0
            ? `?${params.join('&')}`
            : '';

        router.push(`/propiedades${query}`);
    };

    const handleCategoriaRapida = (id) => {
        const categoriaId = String(id);

        router.push(
            `/propiedades?categoria_id[]=${encodeURIComponent(
                categoriaId
            )}`
        );
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
                <Text style={styles.heroTitle}>
                    Encontrá tu
                </Text>

                <Text style={styles.heroTitleHighlight}>
                    próximo hogar
                </Text>

                <Text style={styles.heroDescription}>
                    Las mejores propiedades en alquiler.
                    Departamentos, casas, quintas y más.
                </Text>

                <View style={styles.searchBox}>
                    <Text style={styles.searchTitle}>
                        ¿Qué estás buscando?
                    </Text>

                    {/* LOCALIDAD */}
                    <Text style={styles.filterLabel}>
                        Localidad
                    </Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filterScroll}
                    >
                        <TouchableOpacity
                            style={[
                                styles.filterOption,
                                localidadesBusqueda.length === 0 &&
                                    styles.filterOptionSelected
                            ]}
                            onPress={() =>
                                setLocalidadesBusqueda([])
                            }
                        >
                            <Text
                                style={[
                                    styles.filterOptionText,
                                    localidadesBusqueda.length === 0 &&
                                        styles.filterOptionTextSelected
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
                                            styles.filterOptionSelected
                                    ]}
                                    onPress={() =>
                                        toggleLocalidad(localidad.id)
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.filterOptionText,
                                            seleccionada &&
                                                styles.filterOptionTextSelected
                                        ]}
                                    >
                                        {localidad.nombre}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* TIPO */}
                    <Text style={styles.filterLabel}>
                        Tipo
                    </Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filterScroll}
                    >
                        <TouchableOpacity
                            style={[
                                styles.filterOption,
                                categoriasBusqueda.length === 0 &&
                                    styles.filterOptionSelected
                            ]}
                            onPress={() =>
                                setCategoriasBusqueda([])
                            }
                        >
                            <Text
                                style={[
                                    styles.filterOptionText,
                                    categoriasBusqueda.length === 0 &&
                                        styles.filterOptionTextSelected
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
                                            styles.filterOptionSelected
                                    ]}
                                    onPress={() =>
                                        toggleCategoria(categoria.id)
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.filterOptionText,
                                            seleccionada &&
                                                styles.filterOptionTextSelected
                                        ]}
                                    >
                                        {categoria.nombre}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

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

            {/* CATEGORÍAS RÁPIDAS */}
            <View style={styles.quickCategoriesSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionBadge}>
                        Explorá
                    </Text>

                    <Text style={styles.sectionTitle}>
                        Explorá por tipo
                    </Text>

                    <Text style={styles.sectionDescription}>
                        Encontrá propiedades según lo que estás buscando
                    </Text>
                </View>

                {categorias.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesScroll}
                    >
                        {categorias.map((categoria) => (
                            <TouchableOpacity
                                key={categoria.id}
                                style={styles.categoryCard}
                                onPress={() =>
                                    handleCategoriaRapida(
                                        categoria.id
                                    )
                                }
                                activeOpacity={0.8}
                            >
                                <View style={styles.categoryIcon}>
                                    <Text style={styles.categoryIconText}>
                                        🏠
                                    </Text>
                                </View>

                                <Text
                                    style={styles.categoryName}
                                    numberOfLines={1}
                                >
                                    {categoria.nombre}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : (
                    <Text style={styles.emptyText}>
                        No hay categorías disponibles.
                    </Text>
                )}
            </View>

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
                        {propiedades.slice(0, 6).map((propiedad) => (
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

                <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => router.push('/propiedades')}
                >
                    <Text style={styles.viewAllText}>
                        Ver todas las propiedades
                    </Text>
                </TouchableOpacity>
            </View>

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

                        <Text style={styles.sectionDescription}>
                            Propiedades que viste recientemente
                        </Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.propertiesScroll}
                    >
                        {propiedadesVistas.map((propiedad) => (
                            <PropertyCard
                                key={propiedad.id}
                                propiedad={propiedad}
                                onPress={() =>
                                    handlePropiedadVista(propiedad)
                                }
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* ESTADÍSTICAS */}
            <View style={styles.statsSection}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {propiedades.length}
                    </Text>

                    <Text style={styles.statLabel}>
                        Propiedades publicadas
                    </Text>
                </View>

                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {categorias.length}
                    </Text>

                    <Text style={styles.statLabel}>
                        Categorías disponibles
                    </Text>
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
        paddingBottom: 40,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },

    loadingText: {
        marginTop: 12,
        color: theme.colors.text,
        fontSize: theme.sizes.body,
    },

    hero: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 30,
        paddingBottom: 30,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },

    heroTitle: {
        color: '#ffffff',
        fontSize: 30,
        fontWeight: '700',
        textAlign: 'center',
    },

    heroTitleHighlight: {
        color: '#ffffff',
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
    },

    heroDescription: {
        color: '#ffffff',
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        opacity: 0.95,
        marginBottom: 22,
    },

    searchBox: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
    },

    searchTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.textDark,
        marginBottom: 16,
    },

    filterLabel: {
        fontSize: theme.sizes.body,
        fontWeight: '600',
        color: theme.colors.textDark,
        marginBottom: 8,
    },

    filterScroll: {
        marginBottom: 14,
    },

    filterOption: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: theme.colors.inputBg,
        marginRight: 8,
    },

    filterOptionSelected: {
        backgroundColor: theme.colors.primary,
    },

    filterOptionText: {
        color: theme.colors.textDark,
        fontSize: 13,
    },

    filterOptionTextSelected: {
        color: '#ffffff',
        fontWeight: '600',
    },

    searchButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
        paddingVertical: 13,
        alignItems: 'center',
    },

    searchButtonText: {
        color: '#ffffff',
        fontSize: theme.sizes.body,
        fontWeight: '600',
    },

    errorBox: {
        margin: theme.spacing.lg,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.errorBg,
    },

    errorText: {
        color: theme.colors.errorText,
        textAlign: 'center',
    },

    quickCategoriesSection: {
        marginTop: 30,
    },

    section: {
        marginTop: 30
    },

    sectionHighlight: {
        paddingVertical: 28,
    },

    sectionHeader: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: 18,
    },

    sectionBadge: {
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 5,
    },

    sectionTitle: {
        color: theme.colors.textDark,
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 5,
    },

    sectionDescription: {
        color: theme.colors.text,
        fontSize: 14,
    },

    categoriesScroll: {
        paddingHorizontal: theme.spacing.lg,
        gap: 12,
    },

    categoryCard: {
        width: 100,
        alignItems: 'center',
    },

    categoryIcon: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },

    categoryIconText: {
        fontSize: 30,
    },

    categoryName: {
        color: theme.colors.textDark,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },

    propertiesScroll: {
        paddingHorizontal: theme.spacing.lg,
        gap: 14,
    },

    viewAllButton: {
        marginHorizontal: theme.spacing.lg,
        marginTop: 18,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },

    viewAllText: {
        color: theme.colors.primary,
        fontWeight: '600',
    },

    emptyText: {
        color: theme.colors.text,
        textAlign: 'center',
        padding: 20,
    },

    statsSection: {
        marginTop: 30,
        marginHorizontal: theme.spacing.lg,
        padding: 20,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    statItem: {
        width: '48%',
        alignItems: 'center',
    },

    statNumber: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '800',
    },

    statLabel: {
        color: '#ffffff',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 3,
    },
});