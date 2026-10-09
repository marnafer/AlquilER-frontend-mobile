import { useEffect, useState } from 'react';

import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { theme } from '../theme/theme';

const normalizarIniciales = (valores) =>
    Array.isArray(valores)
        ? valores.map(String)
        : [];

const PropertyAdvancedFilter = ({
    categorias = [],
    localidades = [],
    servicios = [],
    initialCategorias = [],
    initialLocalidades = [],
    initialServicios = [],
    onSearch,
}) => {
    const [abierto, setAbierto] = useState(false);

    const [categoriasAbierto, setCategoriasAbierto] =
        useState(false);

    const [localidadesAbierto, setLocalidadesAbierto] =
        useState(false);

    const [serviciosAbierto, setServiciosAbierto] =
        useState(false);

    const [categoriasSeleccionadas, setCategoriasSeleccionadas] =
        useState(
            normalizarIniciales(initialCategorias)
        );

    const [localidadesSeleccionadas, setLocalidadesSeleccionadas] =
        useState(
            normalizarIniciales(initialLocalidades)
        );

    const [serviciosSeleccionados, setServiciosSeleccionados] =
        useState(
            normalizarIniciales(initialServicios)
        );

    const [precioMin, setPrecioMin] = useState('');
    const [precioMax, setPrecioMax] = useState('');

    const [cantidadAmbientes, setCantidadAmbientes] =
        useState('');

    const [cantidadDormitorios, setCantidadDormitorios] =
        useState('');

    const [cantidadBanos, setCantidadBanos] =
        useState('');

    const [capacidad, setCapacidad] =
        useState('');

    useEffect(() => {
        setCategoriasSeleccionadas(
            normalizarIniciales(initialCategorias)
        );
    }, [initialCategorias]);

    useEffect(() => {
        setLocalidadesSeleccionadas(
            normalizarIniciales(initialLocalidades)
        );
    }, [initialLocalidades]);

    useEffect(() => {
        setServiciosSeleccionados(
            normalizarIniciales(initialServicios)
        );
    }, [initialServicios]);

    const toggleSeleccion = (
        id,
        seleccionados,
        setSeleccionados
    ) => {
        const idString = String(id);

        setSeleccionados((actuales) =>
            actuales.includes(idString)
                ? actuales.filter(
                    (actual) => actual !== idString
                )
                : [
                    ...actuales,
                    idString,
                ]
        );
    };

    const limpiarFiltros = () => {
        setCategoriasSeleccionadas([]);
        setLocalidadesSeleccionadas([]);
        setServiciosSeleccionados([]);

        setPrecioMin('');
        setPrecioMax('');
        setCantidadAmbientes('');
        setCantidadDormitorios('');
        setCantidadBanos('');
        setCapacidad('');
    };

    const handleBuscar = () => {
        onSearch?.({
            categoria_id:
                categoriasSeleccionadas,

            localidad_id:
                localidadesSeleccionadas,

            servicio_id:
                serviciosSeleccionados,

            precio_min:
                precioMin,

            precio_max:
                precioMax,

            cantidad_ambientes:
                cantidadAmbientes,

            cantidad_dormitorios:
                cantidadDormitorios,

            cantidad_banos:
                cantidadBanos,

            capacidad,
        });
    };

    const cantidadFiltrosActivos =
        categoriasSeleccionadas.length +
        localidadesSeleccionadas.length +
        serviciosSeleccionados.length +
        (precioMin !== '' ? 1 : 0) +
        (precioMax !== '' ? 1 : 0) +
        (cantidadAmbientes !== '' ? 1 : 0) +
        (cantidadDormitorios !== '' ? 1 : 0) +
        (cantidadBanos !== '' ? 1 : 0) +
        (capacidad !== '' ? 1 : 0);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={() =>
                    setAbierto((actual) => !actual)
                }
                activeOpacity={0.8}
            >
                <View style={styles.headerTextContainer}>
                    <Text style={styles.title}>
                        Búsqueda avanzada
                    </Text>

                    {cantidadFiltrosActivos > 0 ? (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {cantidadFiltrosActivos}
                            </Text>
                        </View>
                    ) : null}
                </View>

                <Text style={styles.arrow}>
                    {abierto ? '▲' : '▼'}
                </Text>
            </TouchableOpacity>

            {abierto ? (
                <View style={styles.content}>
                    {/* CATEGORÍAS */}

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
                            <Text style={styles.dropdownLabel}>
                                Categorías
                            </Text>

                            <Text style={styles.dropdownSummary}>
                                {categoriasSeleccionadas.length ===
                                0
                                    ? 'Todas'
                                    : `${categoriasSeleccionadas.length} seleccionadas`}
                            </Text>
                        </View>

                        <Text style={styles.dropdownArrow}>
                            {categoriasAbierto ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>

                    {categoriasAbierto ? (
                        <View style={styles.dropdownContent}>
                            <ScrollView
                                style={styles.dropdownScroll}
                                nestedScrollEnabled
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.optionsContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.chip,
                                            categoriasSeleccionadas.length ===
                                                0 &&
                                                styles.chipActive,
                                        ]}
                                        onPress={() =>
                                            setCategoriasSeleccionadas([])
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                categoriasSeleccionadas.length ===
                                                    0 &&
                                                    styles.chipTextActive,
                                            ]}
                                        >
                                            Todas
                                        </Text>
                                    </TouchableOpacity>

                                    {categorias.map((categoria) => {
                                        const seleccionada =
                                            categoriasSeleccionadas.includes(
                                                String(categoria.id)
                                            );

                                        return (
                                            <TouchableOpacity
                                                key={categoria.id}
                                                style={[
                                                    styles.chip,
                                                    seleccionada &&
                                                        styles.chipActive,
                                                ]}
                                                onPress={() =>
                                                    toggleSeleccion(
                                                        categoria.id,
                                                        categoriasSeleccionadas,
                                                        setCategoriasSeleccionadas
                                                    )
                                                }
                                                activeOpacity={0.8}
                                            >
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        seleccionada &&
                                                            styles.chipTextActive,
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

                    {/* LOCALIDADES */}

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
                            <Text style={styles.dropdownLabel}>
                                Localidades
                            </Text>

                            <Text style={styles.dropdownSummary}>
                                {localidadesSeleccionadas.length ===
                                0
                                    ? 'Todas'
                                    : `${localidadesSeleccionadas.length} seleccionadas`}
                            </Text>
                        </View>

                        <Text style={styles.dropdownArrow}>
                            {localidadesAbierto ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>

                    {localidadesAbierto ? (
                        <View style={styles.dropdownContent}>
                            <ScrollView
                                style={styles.dropdownScroll}
                                nestedScrollEnabled
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.optionsContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.chip,
                                            localidadesSeleccionadas.length ===
                                                0 &&
                                                styles.chipActive,
                                        ]}
                                        onPress={() =>
                                            setLocalidadesSeleccionadas([])
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                localidadesSeleccionadas.length ===
                                                    0 &&
                                                    styles.chipTextActive,
                                            ]}
                                        >
                                            Todas
                                        </Text>
                                    </TouchableOpacity>

                                    {localidades.map((localidad) => {
                                        const seleccionada =
                                            localidadesSeleccionadas.includes(
                                                String(localidad.id)
                                            );

                                        return (
                                            <TouchableOpacity
                                                key={localidad.id}
                                                style={[
                                                    styles.chip,
                                                    seleccionada &&
                                                        styles.chipActive,
                                                ]}
                                                onPress={() =>
                                                    toggleSeleccion(
                                                        localidad.id,
                                                        localidadesSeleccionadas,
                                                        setLocalidadesSeleccionadas
                                                    )
                                                }
                                                activeOpacity={0.8}
                                            >
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        seleccionada &&
                                                            styles.chipTextActive,
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

                    {/* SERVICIOS */}

                    <TouchableOpacity
                        style={styles.dropdownHeader}
                        onPress={() =>
                            setServiciosAbierto(
                                (actual) => !actual
                            )
                        }
                        activeOpacity={0.8}
                    >
                        <View style={styles.dropdownHeaderText}>
                            <Text style={styles.dropdownLabel}>
                                Servicios
                            </Text>

                            <Text style={styles.dropdownSummary}>
                                {serviciosSeleccionados.length ===
                                0
                                    ? 'Todos'
                                    : `${serviciosSeleccionados.length} seleccionados`}
                            </Text>
                        </View>

                        <Text style={styles.dropdownArrow}>
                            {serviciosAbierto ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>

                    {serviciosAbierto ? (
                        <View style={styles.dropdownContent}>
                            <ScrollView
                                style={styles.dropdownScroll}
                                nestedScrollEnabled
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.optionsContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.chip,
                                            serviciosSeleccionados.length ===
                                                0 &&
                                                styles.chipActive,
                                        ]}
                                        onPress={() =>
                                            setServiciosSeleccionados([])
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                serviciosSeleccionados.length ===
                                                    0 &&
                                                    styles.chipTextActive,
                                            ]}
                                        >
                                            Todos
                                        </Text>
                                    </TouchableOpacity>

                                    {servicios.map((servicio) => {
                                        const seleccionado =
                                            serviciosSeleccionados.includes(
                                                String(servicio.id)
                                            );

                                        return (
                                            <TouchableOpacity
                                                key={servicio.id}
                                                style={[
                                                    styles.chip,
                                                    seleccionado &&
                                                        styles.chipActive,
                                                ]}
                                                onPress={() =>
                                                    toggleSeleccion(
                                                        servicio.id,
                                                        serviciosSeleccionados,
                                                        setServiciosSeleccionados
                                                    )
                                                }
                                                activeOpacity={0.8}
                                            >
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        seleccionado &&
                                                            styles.chipTextActive,
                                                    ]}
                                                >
                                                    {servicio.nombre}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </View>
                    ) : null}

                    {/* PRECIO */}

                    <Text style={styles.sectionTitle}>
                        Precio
                    </Text>

                    <View style={styles.row}>
                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Mínimo
                            </Text>

                            <TextInput
                                style={styles.input}
                                value={precioMin}
                                onChangeText={setPrecioMin}
                                placeholder="$ mínimo"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Máximo
                            </Text>

                            <TextInput
                                style={styles.input}
                                value={precioMax}
                                onChangeText={setPrecioMax}
                                placeholder="$ máximo"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    {/* CARACTERÍSTICAS */}

                    <Text style={styles.sectionTitle}>
                        Características
                    </Text>

                    <View style={styles.fieldFull}>
                        <Text style={styles.label}>
                            Ambientes mínimos
                        </Text>

                        <TextInput
                            style={styles.input}
                            value={cantidadAmbientes}
                            onChangeText={setCantidadAmbientes}
                            placeholder="Ej.: 2"
                            placeholderTextColor={
                                theme.colors.textMuted
                            }
                            keyboardType="number-pad"
                        />
                    </View>

                    <View style={styles.fieldFull}>
                        <Text style={styles.label}>
                            Dormitorios mínimos
                        </Text>

                        <TextInput
                            style={styles.input}
                            value={cantidadDormitorios}
                            onChangeText={setCantidadDormitorios}
                            placeholder="Ej.: 2"
                            placeholderTextColor={
                                theme.colors.textMuted
                            }
                            keyboardType="number-pad"
                        />
                    </View>

                    <View style={styles.fieldFull}>
                        <Text style={styles.label}>
                            Baños mínimos
                        </Text>

                        <TextInput
                            style={styles.input}
                            value={cantidadBanos}
                            onChangeText={setCantidadBanos}
                            placeholder="Ej.: 1"
                            placeholderTextColor={
                                theme.colors.textMuted
                            }
                            keyboardType="number-pad"
                        />
                    </View>

                    <View style={styles.fieldFull}>
                        <Text style={styles.label}>
                            Capacidad mínima
                        </Text>

                        <TextInput
                            style={styles.input}
                            value={capacidad}
                            onChangeText={setCapacidad}
                            placeholder="Ej.: 4"
                            placeholderTextColor={
                                theme.colors.textMuted
                            }
                            keyboardType="number-pad"
                        />
                    </View>

                    {/* ACCIONES */}

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={limpiarFiltros}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.clearText}>
                                Limpiar
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={handleBuscar}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.searchText}>
                                Buscar propiedades
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
        borderRadius: 14,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },

    header: {
        minHeight: 58,
        paddingHorizontal: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    headerTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },

    title: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textDark,
    },

    badge: {
        minWidth: 24,
        height: 24,
        paddingHorizontal: 7,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
    },

    badgeText: {
        color: theme.colors.white,
        fontSize: 12,
        fontWeight: '700',
    },

    arrow: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },

    content: {
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },

    sectionTitle: {
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textDark,
    },

    dropdownHeader: {
        minHeight: 54,
        marginTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.background,
    },

    dropdownHeaderText: {
        flex: 1,
    },

    dropdownLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textDark,
    },

    dropdownSummary: {
        marginTop: 2,
        fontSize: 12,
        color: theme.colors.textMuted,
    },

    dropdownArrow: {
        marginLeft: theme.spacing.md,
        fontSize: 12,
        color: theme.colors.textMuted,
    },

    dropdownContent: {
        marginTop: theme.spacing.sm,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.background,
    },

    dropdownScroll: {
        maxHeight: 180,
    },

    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },

    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.inputBg,
    },

    chipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },

    chipText: {
        fontSize: 13,
        color: theme.colors.textMuted,
    },

    chipTextActive: {
        color: theme.colors.white,
        fontWeight: '600',
    },

    row: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },

    field: {
        flex: 1,
    },

    fieldFull: {
        marginTop: theme.spacing.sm,
    },

    label: {
        marginBottom: 6,
        fontSize: 12,
        color: theme.colors.textMuted,
    },

    input: {
        minHeight: 44,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        color: theme.colors.textDark,
        fontSize: 14,
    },

    actions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginTop: theme.spacing.lg,
    },

    clearButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },

    clearText: {
        color: theme.colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
    },

    searchButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
    },

    searchText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
});

export default PropertyAdvancedFilter;