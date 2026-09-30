import { useState } from 'react';

import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { theme } from '../theme/theme';


type Option = {
    id: number | string;
    nombre: string;
};


type PropertySelectBaseProps = {
    label: string;
    placeholder?: string;
    options?: Option[];
    disabled?: boolean;
};


type PropertySelectSingleProps =
    PropertySelectBaseProps & {
        multiple?: false;
        value?: string | null;
        onChange?: (value: string) => void;
    };


type PropertySelectMultipleProps =
    PropertySelectBaseProps & {
        multiple: true;
        value?: string[];
        onChange?: (value: string[]) => void;
    };


type PropertySelectProps =
    | PropertySelectSingleProps
    | PropertySelectMultipleProps;


const normalizarSeleccion = (
    valor: PropertySelectProps['value'],
    multiple: boolean
): string[] | string | null => {
    if (multiple) {
        if (!Array.isArray(valor)) {
            return [];
        }

        return valor.map(String);
    }

    if (
        valor === undefined ||
        valor === null ||
        valor === ''
    ) {
        return null;
    }

    if (Array.isArray(valor)) {
        return null;
    }

    return String(valor);
};


const PropertySelect = (
    props: PropertySelectProps
) => {
    const {
        label,
        placeholder = 'Seleccioná una opción',
        options = [],
        disabled = false,
    } = props;

    const multiple = props.multiple === true;

    const [abierto, setAbierto] = useState(false);

    const seleccion = normalizarSeleccion(
        props.value,
        multiple
    );


    const toggleOpcion = (
        id: number | string
    ) => {
        const idString = String(id);

        if (multiple) {
            const actuales = Array.isArray(seleccion)
                ? seleccion
                : [];

            const yaSeleccionada =
                actuales.includes(idString);

            const nuevasSeleccionadas =
                yaSeleccionada
                    ? actuales.filter(
                        (actual) =>
                            actual !== idString
                    )
                    : [
                        ...actuales,
                        idString,
                    ];

            props.onChange?.(nuevasSeleccionadas);

            return;
        }

        props.onChange?.(idString);
        setAbierto(false);
    };


    const estaSeleccionada = (
        id: number | string
    ) => {
        const idString = String(id);

        if (multiple) {
            return Array.isArray(seleccion)
                ? seleccion.includes(idString)
                : false;
        }

        return seleccion === idString;
    };


    const cantidadSeleccionada = multiple
        ? Array.isArray(seleccion)
            ? seleccion.length
            : 0
        : seleccion
            ? 1
            : 0;


    const obtenerResumen = () => {
        if (cantidadSeleccionada === 0) {
            return placeholder;
        }

        if (multiple) {
            return `${cantidadSeleccionada} seleccionados`;
        }

        const opcionSeleccionada =
            options.find(
                (opcion) =>
                    String(opcion.id) ===
                    seleccion
            );

        return (
            opcionSeleccionada?.nombre ||
            placeholder
        );
    };


    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                {label}
            </Text>

            <TouchableOpacity
                style={[
                    styles.header,
                    disabled &&
                        styles.headerDisabled,
                ]}
                onPress={() => {
                    if (!disabled) {
                        setAbierto(
                            (actual) => !actual
                        );
                    }
                }}
                activeOpacity={0.8}
                disabled={disabled}
            >
                <View style={styles.headerText}>
                    <Text
                        style={[
                            styles.summary,
                            cantidadSeleccionada === 0 &&
                                styles.summaryPlaceholder,
                        ]}
                        numberOfLines={1}
                    >
                        {obtenerResumen()}
                    </Text>
                </View>

                <Text style={styles.arrow}>
                    {abierto ? '▲' : '▼'}
                </Text>
            </TouchableOpacity>

            {abierto && !disabled ? (
                <View style={styles.dropdown}>
                    <ScrollView
                        style={styles.scroll}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={
                            false
                        }
                    >
                        <View style={styles.options}>
                            {options.map((opcion) => {
                                const seleccionada =
                                    estaSeleccionada(
                                        opcion.id
                                    );

                                return (
                                    <TouchableOpacity
                                        key={opcion.id}
                                        style={[
                                            styles.chip,
                                            seleccionada &&
                                                styles.chipActive,
                                        ]}
                                        onPress={() =>
                                            toggleOpcion(
                                                opcion.id
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
                                            {opcion.nombre}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            ) : null}
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.md,
    },

    label: {
        marginBottom: 7,
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textDark,
    },

    header: {
        minHeight: 48,
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

    headerDisabled: {
        backgroundColor: theme.colors.disabled,
        opacity: 0.7,
    },

    headerText: {
        flex: 1,
    },

    summary: {
        fontSize: 14,
        color: theme.colors.textDark,
    },

    summaryPlaceholder: {
        color: theme.colors.textMuted,
    },

    arrow: {
        marginLeft: theme.spacing.md,
        fontSize: 12,
        color: theme.colors.textMuted,
    },

    dropdown: {
        marginTop: theme.spacing.sm,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.background,
    },

    scroll: {
        maxHeight: 180,
    },

    options: {
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
        color: theme.colors.textDark,
    },

    chipTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});


export default PropertySelect;