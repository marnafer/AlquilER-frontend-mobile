import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import {
    useEffect,
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

import PropertySelect from '../components/PropertySelect';
import api, {
    actualizarPropiedad,
} from '../services/api';
import { theme } from '../theme/theme';

const esNumeroPositivo = (valor) =>
    valor.trim() !== '' &&
    Number.isFinite(Number(valor)) &&
    Number(valor) > 0;

const esNumeroNoNegativo = (valor) =>
    valor.trim() !== '' &&
    Number.isFinite(Number(valor)) &&
    Number(valor) >= 0;

const esEnteroPositivo = (valor) =>
    valor.trim() !== '' &&
    Number.isInteger(Number(valor)) &&
    Number(valor) > 0;

const esEnteroNoNegativo = (valor) =>
    valor.trim() !== '' &&
    Number.isInteger(Number(valor)) &&
    Number(valor) >= 0;

export default function EditarPropiedadScreen() {
    const { id } = useLocalSearchParams();

    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [erroresCampos, setErroresCampos] = useState({});
    const [mensajeExito, setMensajeExito] = useState('');
    const [errorServicios, setErrorServicios] = useState('');

    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [expensas, setExpensas] = useState('');
    const [direccion, setDireccion] = useState('');
    const [cantidadAmbientes, setCantidadAmbientes] = useState('');
    const [cantidadDormitorios, setCantidadDormitorios] = useState('');
    const [cantidadBanos, setCantidadBanos] = useState('');
    const [capacidad, setCapacidad] = useState('');
    const [disponible, setDisponible] = useState(true);
    const [aceptaMascotas, setAceptaMascotas] = useState(false);
    const [aceptaHijos, setAceptaHijos] = useState(false);

    const [categoriaId, setCategoriaId] = useState(null);
    const [localidadId, setLocalidadId] = useState(null);
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);

    const [categorias, setCategorias] = useState([]);
    const [localidades, setLocalidades] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [loadingCatalogos, setLoadingCatalogos] = useState(true);

    useEffect(() => {
        const cargarDatos = async () => {
            if (!id) {
                setError('No se indicó una propiedad.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');

                const [
                    propiedadRes,
                    categoriasRes,
                    localidadesRes,
                    serviciosRes,
                    serviciosPropiedadRes,
                ] = await Promise.all([
                    api.get(`/propiedades/${id}`),
                    api.get('/categorias'),
                    api.get('/localidades'),
                    api.get('/servicios'),
                    api.get(`/propiedades/${id}/servicios`),
                ]);

                const propiedad = propiedadRes.data?.data;

                if (!propiedad) {
                    setError(
                        'No se pudieron cargar los datos de la propiedad.'
                    );
                    return;
                }

                setTitulo(propiedad.titulo || '');
                setDescripcion(propiedad.descripcion || '');
                setPrecio(
                    propiedad.precio != null
                        ? String(propiedad.precio)
                        : ''
                );
                setExpensas(
                    propiedad.expensas != null
                        ? String(propiedad.expensas)
                        : ''
                );
                setDireccion(propiedad.direccion || '');
                setCantidadAmbientes(
                    propiedad.cantidad_ambientes != null
                        ? String(propiedad.cantidad_ambientes)
                        : ''
                );
                setCantidadDormitorios(
                    propiedad.cantidad_dormitorios != null
                        ? String(propiedad.cantidad_dormitorios)
                        : ''
                );
                setCantidadBanos(
                    propiedad.cantidad_banos != null
                        ? String(propiedad.cantidad_banos)
                        : ''
                );
                setCapacidad(
                    propiedad.capacidad != null
                        ? String(propiedad.capacidad)
                        : ''
                );
                setDisponible(
                    Boolean(propiedad.disponible)
                );
                setAceptaMascotas(
                    Boolean(propiedad.acepta_mascotas)
                );
                setAceptaHijos(
                    Boolean(propiedad.acepta_hijos)
                );
                setCategoriaId(
                    propiedad.categoria_id != null
                        ? String(propiedad.categoria_id)
                        : null
                );
                setLocalidadId(
                    propiedad.localidad_id != null
                        ? String(propiedad.localidad_id)
                        : null
                );

                const serviciosPropiedad =
                    serviciosPropiedadRes.data?.data?.items ||
                    serviciosPropiedadRes.data?.data ||
                    [];

                setServiciosSeleccionados(
                    serviciosPropiedad.map((s) =>
                        String(s.id)
                    )
                );

                setCategorias(
                    categoriasRes.data?.data?.items ||
                        categoriasRes.data?.data ||
                        []
                );

                setLocalidades(
                    localidadesRes.data?.data?.items ||
                        localidadesRes.data?.data ||
                        []
                );

                setServicios(
                    serviciosRes.data?.data?.items ||
                        serviciosRes.data?.data ||
                        []
                );

                setLoadingCatalogos(false);
            } catch (err) {
                console.error(
                    'EDITAR PROPIEDAD: error al cargar',
                    err
                );

                setError(
                    'No se pudo cargar la información de la propiedad.'
                );
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, [id]);

    const guardar = async () => {
        const errores = {};

        if (!titulo.trim()) {
            errores.titulo = 'El título es obligatorio.';
        } else if (titulo.trim().length < 3) {
            errores.titulo =
                'El título debe tener al menos 3 caracteres.';
        }

        if (!descripcion.trim()) {
            errores.descripcion =
                'La descripción es obligatoria.';
        }

        if (!esNumeroPositivo(precio)) {
            errores.precio =
                'El precio debe ser un número mayor a 0.';
        }

        if (expensas && !esNumeroNoNegativo(expensas)) {
            errores.expensas =
                'Las expensas deben ser un número mayor o igual a 0.';
        }

        if (!direccion.trim()) {
            errores.direccion =
                'La dirección es obligatoria.';
        } else if (direccion.trim().length < 3) {
            errores.direccion =
                'La dirección debe tener al menos 3 caracteres.';
        }

        if (!esEnteroPositivo(cantidadAmbientes)) {
            errores.cantidad_ambientes =
                'La cantidad de ambientes debe ser un entero mayor a 0.';
        }

        if (!esEnteroNoNegativo(cantidadDormitorios)) {
            errores.cantidad_dormitorios =
                'La cantidad de dormitorios debe ser un entero mayor o igual a 0.';
        }

        if (!esEnteroNoNegativo(cantidadBanos)) {
            errores.cantidad_banos =
                'La cantidad de baños debe ser un entero mayor o igual a 0.';
        }

        if (capacidad && !esEnteroPositivo(capacidad)) {
            errores.capacidad =
                'La capacidad debe ser un entero mayor a 0.';
        }

        if (!categoriaId) {
            errores.categoria_id =
                'Debés seleccionar una categoría.';
        }

        if (!localidadId) {
            errores.localidad_id =
                'Debés seleccionar una localidad.';
        }

        if (Object.keys(errores).length > 0) {
            setErroresCampos(errores);

            return;
        }

        setErroresCampos({});
        setError('');
        setErrorServicios('');
        setMensajeExito('');
        setGuardando(true);

        const payload = {
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            precio: Number(precio),
            expensas: expensas ? Number(expensas) : 0,
            direccion: direccion.trim(),
            cantidad_ambientes: Number(cantidadAmbientes),
            cantidad_dormitorios: Number(cantidadDormitorios),
            cantidad_banos: Number(cantidadBanos),
            capacidad: capacidad ? Number(capacidad) : null,
            acepta_mascotas: Number(aceptaMascotas),
            acepta_hijos: Number(aceptaHijos),
            disponible: Number(disponible),
            categoria_id: Number(categoriaId),
            localidad_id: Number(localidadId),
        };

        const result = await actualizarPropiedad(id, payload);

        if (!result.success) {
            setError(
                result.message ||
                    'No se pudo guardar los cambios.'
            );

            setGuardando(false);

            return;
        }

        try {
            await api.put(
                `/propiedades/${id}/servicios`,
                {
                    servicio_ids: serviciosSeleccionados.map(
                        Number
                    ),
                }
            );
        } catch (err) {
            console.error(
                'EDITAR PROPIEDAD: error sincronizando servicios',
                err
            );

            setErrorServicios(
                'La propiedad se guardó, pero los servicios no se actualizaron.'
            );
        }

        setGuardando(false);
        setMensajeExito(
            'Propiedad actualizada correctamente'
        );

        setTimeout(() => {
            router.back();
        }, 1600);
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Cargando propiedad...
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === 'ios' ? 'padding' : 'height'
            }
            keyboardVerticalOffset={
                Platform.OS === 'ios' ? 90 : 0
            }
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        Editar propiedad
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Modificá los datos de tu propiedad
                    </Text>
                </View>

                <View style={styles.content}>
                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorBoxText}>
                                {error}
                            </Text>
                        </View>
                    ) : null}

                    {errorServicios ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorBoxText}>
                                {errorServicios}
                            </Text>
                        </View>
                    ) : null}

                    {mensajeExito ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>
                                ✓ {mensajeExito}
                            </Text>
                        </View>
                    ) : null}

                    <Text style={styles.sectionTitle}>
                        Información básica
                    </Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>Título</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Casa con patio"
                            placeholderTextColor={
                                theme.colors.textMuted
                            }
                            value={titulo}
                            onChangeText={setTitulo}
                        />

                        {erroresCampos.titulo ? (
                            <Text style={styles.fieldError}>
                                {erroresCampos.titulo}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Descripción
                        </Text>

                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                            ]}
                            placeholder="Describí la propiedad"
                            placeholderTextColor={
                                theme.colors.textMuted
                            }
                            value={descripcion}
                            onChangeText={setDescripcion}
                            multiline
                            textAlignVertical="top"
                        />

                        {erroresCampos.descripcion ? (
                            <Text style={styles.fieldError}>
                                {erroresCampos.descripcion}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>Precio</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ej: 150000"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                keyboardType="numeric"
                                value={precio}
                                onChangeText={setPrecio}
                            />

                            {erroresCampos.precio ? (
                                <Text style={styles.fieldError}>
                                    {erroresCampos.precio}
                                </Text>
                            ) : null}
                        </View>

                        <View style={styles.halfField}>
                            <Text style={styles.label}>
                                Expensas
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ej: 25000"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                keyboardType="numeric"
                                value={expensas}
                                onChangeText={setExpensas}
                            />

                            {erroresCampos.expensas ? (
                                <Text style={styles.fieldError}>
                                    {erroresCampos.expensas}
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    <View style={styles.field}>
                        <PropertySelect
                            label="Categoría"
                            placeholder="Seleccioná una categoría"
                            options={categorias}
                            value={categoriaId}
                            onChange={setCategoriaId}
                            disabled={loadingCatalogos}
                        />

                        {erroresCampos.categoria_id ? (
                            <Text style={styles.fieldError}>
                                {erroresCampos.categoria_id}
                            </Text>
                        ) : null}
                    </View>

                    <Text style={styles.sectionTitle}>
                        Ubicación
                    </Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>Dirección</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Ej: San Martín 123"
                            placeholderTextColor={
                                theme.colors.textMuted
                            }
                            value={direccion}
                            onChangeText={setDireccion}
                        />

                        {erroresCampos.direccion ? (
                            <Text style={styles.fieldError}>
                                {erroresCampos.direccion}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.field}>
                        <PropertySelect
                            label="Localidad"
                            placeholder="Seleccioná una localidad"
                            options={localidades}
                            value={localidadId}
                            onChange={setLocalidadId}
                            disabled={loadingCatalogos}
                        />

                        {erroresCampos.localidad_id ? (
                            <Text style={styles.fieldError}>
                                {erroresCampos.localidad_id}
                            </Text>
                        ) : null}
                    </View>

                    <Text style={styles.sectionTitle}>
                        Características
                    </Text>

                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>
                                Ambientes
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ej: 3"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                keyboardType="numeric"
                                value={cantidadAmbientes}
                                onChangeText={
                                    setCantidadAmbientes
                                }
                            />

                            {erroresCampos.cantidad_ambientes ? (
                                <Text style={styles.fieldError}>
                                    {
                                        erroresCampos
                                            .cantidad_ambientes
                                    }
                                </Text>
                            ) : null}
                        </View>

                        <View style={styles.halfField}>
                            <Text style={styles.label}>
                                Dormitorios
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ej: 2"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                keyboardType="numeric"
                                value={cantidadDormitorios}
                                onChangeText={
                                    setCantidadDormitorios
                                }
                            />

                            {erroresCampos.cantidad_dormitorios ? (
                                <Text style={styles.fieldError}>
                                    {
                                        erroresCampos
                                            .cantidad_dormitorios
                                    }
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>Baños</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ej: 1"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                keyboardType="numeric"
                                value={cantidadBanos}
                                onChangeText={setCantidadBanos}
                            />

                            {erroresCampos.cantidad_banos ? (
                                <Text style={styles.fieldError}>
                                    {erroresCampos.cantidad_banos}
                                </Text>
                            ) : null}
                        </View>

                        <View style={styles.halfField}>
                            <Text style={styles.label}>
                                Capacidad
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ej: 4"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                keyboardType="numeric"
                                value={capacidad}
                                onChangeText={setCapacidad}
                            />

                            {erroresCampos.capacidad ? (
                                <Text style={styles.fieldError}>
                                    {erroresCampos.capacidad}
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>
                        Servicios
                    </Text>

                    <View style={styles.field}>
                        <PropertySelect
                            label="Servicios disponibles"
                            placeholder="Seleccioná los servicios"
                            options={servicios}
                            value={serviciosSeleccionados}
                            onChange={setServiciosSeleccionados}
                            multiple
                            disabled={loadingCatalogos}
                        />
                    </View>

                    <View style={styles.sectionTitle}>
                        Preferencias
                    </View>

                    <View style={styles.togglesRow}>
                        <TouchableOpacity
                            style={[
                                styles.toggleChip,
                                aceptaMascotas &&
                                    styles.toggleChipActivo,
                            ]}
                            onPress={() =>
                                setAceptaMascotas(
                                    !aceptaMascotas
                                )
                            }
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[
                                    styles.toggleChipText,
                                    aceptaMascotas &&
                                        styles.toggleChipTextActivo,
                                ]}
                            >
                                {aceptaMascotas ? '🏠✓' : '🏠'} Acepta
                                mascotas
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.toggleChip,
                                aceptaHijos &&
                                    styles.toggleChipActivo,
                            ]}
                            onPress={() =>
                                setAceptaHijos(!aceptaHijos)
                            }
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[
                                    styles.toggleChipText,
                                    aceptaHijos &&
                                        styles.toggleChipTextActivo,
                                ]}
                            >
                                {aceptaHijos ? '✓' : ''} Acepta hijos
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.availabilityContainer}>
                        <View style={styles.availabilityText}>
                            <Text style={styles.label}>
                                Disponibilidad
                            </Text>

                            <Text style={styles.helperText}>
                                {disponible
                                    ? 'La propiedad estará disponible para reservas.'
                                    : 'La propiedad no estará disponible para reservas.'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.checkPlaceholder,
                                !disponible &&
                                    styles.checkPlaceholderDisabled,
                            ]}
                            onPress={() =>
                                setDisponible(!disponible)
                            }
                            activeOpacity={0.8}
                        >
                            {disponible && (
                                <Text style={styles.checkText}>
                                    ✓
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            guardando && styles.saveButtonDisabled,
                        ]}
                        onPress={guardar}
                        disabled={guardando}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.saveButtonText}>
                            {guardando
                                ? 'Guardando cambios...'
                                : 'Guardar cambios'}
                        </Text>
                    </TouchableOpacity>
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

    centerContainer: {
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

    header: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
        backgroundColor: theme.colors.primary,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },

    headerTitle: {
        color: theme.colors.white,
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
    },

    headerSubtitle: {
        marginTop: theme.spacing.sm,
        color: theme.colors.white,
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.9,
    },

    content: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: 100,
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: theme.colors.textDark,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },

    field: {
        marginBottom: theme.spacing.md,
    },

    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textDark,
        marginBottom: 7,
    },

    input: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
        paddingHorizontal: 14,
        color: theme.colors.textDark,
        fontSize: 15,
    },

    textArea: {
        minHeight: 120,
        paddingTop: 12,
        paddingBottom: 12,
    },

    row: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },

    halfField: {
        flex: 1,
    },

    fieldError: {
        marginTop: 5,
        fontSize: 12,
        color: theme.colors.errorText,
    },

    errorBox: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.errorBg,
    },

    errorBoxText: {
        fontSize: 14,
        color: theme.colors.errorText,
        textAlign: 'center',
    },

    successBox: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.successBg,
    },

    successText: {
        fontSize: 14,
        color: theme.colors.successText,
        fontWeight: '600',
        textAlign: 'center',
    },

    togglesRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },

    toggleChip: {
        flex: 1,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.inputBg,
        alignItems: 'center',
    },

    toggleChipActivo: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryBg,
    },

    toggleChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textMuted,
        textAlign: 'center',
    },

    toggleChipTextActivo: {
        color: theme.colors.primary,
    },

    availabilityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
        padding: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },

    availabilityText: {
        flex: 1,
        paddingRight: theme.spacing.md,
    },

    helperText: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 3,
    },

    checkPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
    },

    checkText: {
        color: theme.colors.background,
        fontSize: 18,
        fontWeight: '700',
    },

    checkPlaceholderDisabled: {
        backgroundColor: theme.colors.disabled,
    },

    saveButton: {
        minHeight: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
    },

    saveButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },

    saveButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});