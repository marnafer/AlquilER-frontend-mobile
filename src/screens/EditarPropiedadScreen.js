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
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import PropertySelect from '../components/PropertySelect';
import api, {
    actualizarPropiedad,
} from '../services/api';
import { theme } from '../theme/theme';
import { esFechaISO, GARANTIAS } from '../utils/precalificacion';

const MAX_IMAGENES_POR_PROPIEDAD = 10;
const TIPOS_IMAGEN_PERMITIDOS = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];

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

const esAceptado = (valor) =>
    valor === true ||
    valor === 1 ||
    valor === '1' ||
    valor === 'true';

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
    const [fechaDisponibleDesde, setFechaDisponibleDesde] = useState('');
    const [maxOcupantes, setMaxOcupantes] = useState('');
    const [garantiasAceptadas, setGarantiasAceptadas] = useState([]);

    const [categoriaId, setCategoriaId] = useState(null);
    const [localidadId, setLocalidadId] = useState(null);
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);

    const [categorias, setCategorias] = useState([]);
    const [localidades, setLocalidades] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [loadingCatalogos, setLoadingCatalogos] = useState(true);
    const [imagenes, setImagenes] = useState([]);
    const [procesandoImagen, setProcesandoImagen] = useState(false);
    const [imagenAEliminar, setImagenAEliminar] = useState(null);
    const [errorImagen, setErrorImagen] = useState('');
    const [mensajeImagen, setMensajeImagen] = useState('');

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
                setImagenes(
                    Array.isArray(propiedad.imagenes)
                        ? propiedad.imagenes
                        : []
                );
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
                    esAceptado(propiedad.acepta_mascotas)
                );
                setAceptaHijos(
                    esAceptado(propiedad.acepta_hijos)
                );
                const requisitos =
                    propiedad.requisitos_interesados || {};
                setFechaDisponibleDesde(
                    requisitos.fecha_disponible_desde || ''
                );
                setMaxOcupantes(
                    requisitos.max_ocupantes != null
                        ? String(requisitos.max_ocupantes)
                        : ''
                );
                setGarantiasAceptadas(
                    Array.isArray(requisitos.garantias_aceptadas)
                        ? requisitos.garantias_aceptadas
                        : []
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

    const obtenerUrlImagen = (imagen) => {
        if (!imagen?.ruta) return null;
        if (/^https?:\/\//i.test(imagen.ruta)) return imagen.ruta;

        const baseUrl = (api.defaults.baseURL || '').replace(
            /\/api\/?$/,
            ''
        );
        return `${baseUrl}${imagen.ruta.startsWith('/') ? '' : '/'}${imagen.ruta}`;
    };

    const recargarImagenes = async () => {
        const response = await api.get(`/propiedades/${id}`);
        const propiedad = response.data?.data;

        if (!propiedad || !Array.isArray(propiedad.imagenes)) {
            throw new Error('No se pudo actualizar la galería de imágenes.');
        }

        setImagenes(propiedad.imagenes);
    };

    const obtenerMimeImagen = (imagen) => {
        if (imagen.mimeType) return imagen.mimeType.toLowerCase();

        const extension = imagen.fileName?.split('.').pop()?.toLowerCase();
        const tiposPorExtension = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
        };

        return tiposPorExtension[extension] || '';
    };

    const agregarImagenes = async () => {
        if (procesandoImagen || guardando) return;

        const cantidadDisponible =
            MAX_IMAGENES_POR_PROPIEDAD - imagenes.length;
        if (cantidadDisponible <= 0) {
            setErrorImagen(
                `Ya alcanzaste el máximo de ${MAX_IMAGENES_POR_PROPIEDAD} imágenes.`
            );
            return;
        }

        setErrorImagen('');
        setMensajeImagen('');
        setProcesandoImagen(true);

        try {
            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.8,
            });

            if (resultado.canceled || !resultado.assets?.length) return;

            if (resultado.assets.length > cantidadDisponible) {
                setErrorImagen(
                    `Solo podés agregar ${cantidadDisponible} imagen${cantidadDisponible === 1 ? '' : 'es'} más (máximo ${MAX_IMAGENES_POR_PROPIEDAD}).`
                );
                return;
            }

            const imagenInvalida = resultado.assets.find((imagen) => {
                const tipo = obtenerMimeImagen(imagen);
                return (
                    !TIPOS_IMAGEN_PERMITIDOS.includes(tipo) ||
                    (imagen.fileSize != null &&
                        imagen.fileSize > 5 * 1024 * 1024)
                );
            });

            if (imagenInvalida) {
                const excedeTamano =
                    imagenInvalida.fileSize > 5 * 1024 * 1024;
                setErrorImagen(
                    excedeTamano
                        ? `${imagenInvalida.fileName || 'La imagen seleccionada'} supera los 5 MB.`
                        : 'Formato no permitido. Usá JPG, PNG, GIF o WEBP.'
                );
                return;
            }

            let subidas = 0;
            const imagenesSubidas = [];
            try {
                for (const imagen of resultado.assets) {
                    const formData = new FormData();
                    formData.append('propiedad_id', String(id));
                    formData.append('descripcion', '');
                    formData.append('imagen', {
                        uri: imagen.uri,
                        name:
                            imagen.fileName ||
                            `imagen-${Date.now()}-${subidas + 1}.jpg`,
                        type: obtenerMimeImagen(imagen),
                    });

                    const response = await api.post(
                        '/propiedad-imagenes',
                        formData,
                        {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                        }
                    );

                    if (response.data?.success === false) {
                        throw new Error(
                            response.data?.message ||
                                response.data?.error ||
                                'No se pudo subir la imagen.'
                        );
                    }
                    subidas += 1;
                    if (response.data?.data) {
                        imagenesSubidas.push(response.data.data);
                    }
                }
            } catch (error) {
                console.error(
                    'EDITAR PROPIEDAD: error al subir imágenes',
                    error
                );
                if (imagenesSubidas.length > 0) {
                    setImagenes((actuales) => [
                        ...actuales,
                        ...imagenesSubidas,
                    ]);
                }
                try {
                    await recargarImagenes();
                } catch (errorRecarga) {
                    console.error(
                        'EDITAR PROPIEDAD: error al actualizar la galería',
                        errorRecarga
                    );
                }
                const detalle =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'No se pudo subir la imagen.';
                setErrorImagen(
                    subidas > 0
                        ? `Se subieron ${subidas} imagen${subidas === 1 ? '' : 'es'}, pero la carga se interrumpió: ${detalle}`
                        : detalle
                );
                return;
            }

            if (imagenesSubidas.length > 0) {
                setImagenes((actuales) => [
                    ...actuales,
                    ...imagenesSubidas,
                ]);
            }
            try {
                await recargarImagenes();
            } catch (error) {
                console.error(
                    'EDITAR PROPIEDAD: no se pudo actualizar la galería tras subir',
                    error
                );
                setErrorImagen(
                    'Las imágenes se subieron, pero no se pudo actualizar la galería. Volvé a cargar la propiedad para ver los cambios.'
                );
                return;
            }
            setMensajeImagen(
                `${subidas} imagen${subidas === 1 ? '' : 'es'} agregada${subidas === 1 ? '' : 's'} correctamente.`
            );
        } catch (error) {
            console.error(
                'EDITAR PROPIEDAD: error al gestionar imágenes',
                error
            );
            setErrorImagen(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'No se pudieron gestionar las imágenes.'
            );
        } finally {
            setProcesandoImagen(false);
        }
    };

    const establecerImagenPrincipal = async (imagen) => {
        if (procesandoImagen || guardando) return;

        setProcesandoImagen(true);
        setErrorImagen('');
        setMensajeImagen('');
        try {
            const response = await api.put(
                `/propiedad-imagenes/${imagen.id}/principal`
            );
            if (response.data?.success === false) {
                throw new Error(
                    response.data?.message ||
                        response.data?.error ||
                        'No se pudo cambiar la imagen principal.'
                );
            }

            try {
                await recargarImagenes();
                setMensajeImagen('Imagen principal actualizada.');
            } catch (error) {
                console.error(
                    'EDITAR PROPIEDAD: imagen principal actualizada, pero no se refrescó la galería',
                    error
                );
                setImagenes((actuales) =>
                    actuales.map((actual) => ({
                        ...actual,
                        es_principal:
                            String(actual.id) === String(imagen.id),
                    }))
                );
                setErrorImagen(
                    'La imagen principal se actualizó, pero no se pudo refrescar la galería. Volvé a cargar la propiedad para ver los cambios.'
                );
            }
        } catch (error) {
            console.error(
                'EDITAR PROPIEDAD: error al cambiar imagen principal',
                error
            );
            setErrorImagen(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'No se pudo cambiar la imagen principal.'
            );
        } finally {
            setProcesandoImagen(false);
        }
    };

    const eliminarImagen = async () => {
        if (!imagenAEliminar || procesandoImagen || guardando) return;

        setProcesandoImagen(true);
        setErrorImagen('');
        setMensajeImagen('');
        try {
            const response = await api.delete(
                `/propiedad-imagenes/${imagenAEliminar.id}`
            );
            if (response.data?.success === false) {
                throw new Error(
                    response.data?.message ||
                        response.data?.error ||
                        'No se pudo eliminar la imagen.'
                );
            }

            setImagenAEliminar(null);
            try {
                await recargarImagenes();
                setMensajeImagen('Imagen eliminada correctamente.');
            } catch (error) {
                console.error(
                    'EDITAR PROPIEDAD: imagen eliminada, pero no se refrescó la galería',
                    error
                );
                setImagenes((actuales) =>
                    actuales.filter(
                        (imagen) =>
                            String(imagen.id) !==
                            String(imagenAEliminar.id)
                    )
                );
                setErrorImagen(
                    'La imagen se eliminó, pero no se pudo refrescar la galería. Volvé a cargar la propiedad para ver los cambios.'
                );
            }
        } catch (error) {
            console.error(
                'EDITAR PROPIEDAD: error al eliminar imagen',
                error
            );
            setErrorImagen(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'No se pudo eliminar la imagen.'
            );
        } finally {
            setProcesandoImagen(false);
        }
    };

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

        if (
            fechaDisponibleDesde &&
            !esFechaISO(fechaDisponibleDesde)
        ) {
            errores.fecha_disponible_desde =
                'Usá el formato AAAA-MM-DD.';
        }

        if (
            maxOcupantes &&
            (!Number.isInteger(Number(maxOcupantes)) ||
                Number(maxOcupantes) < 1)
        ) {
            errores.max_ocupantes =
                'El máximo de ocupantes debe ser un entero mayor a 0.';
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
            requisitos_interesados: {
                fecha_disponible_desde: fechaDisponibleDesde || null,
                max_ocupantes: maxOcupantes
                    ? Number(maxOcupantes)
                    : null,
                garantias_aceptadas: garantiasAceptadas,
            },
            disponible: Number(disponible),
            categoria_id: Number(categoriaId),
            localidad_id: Number(localidadId),
        };

        const result = await actualizarPropiedad(id, payload);

        if (!result.success) {
            setError(
                result.error ||
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

    const alternarGarantiaAceptada = (garantia) => {
        setGarantiasAceptadas((actuales) =>
            actuales.includes(garantia)
                ? actuales.filter((item) => item !== garantia)
                : [...actuales, garantia]
        );
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

                    <Text style={styles.sectionTitle}>
                        Imágenes de la propiedad
                    </Text>

                    <Text style={styles.imageHelper}>
                        Agregá hasta {MAX_IMAGENES_POR_PROPIEDAD} imágenes
                        (máximo 5 MB cada una). Podés cambiar la imagen
                        principal o eliminar fotos existentes.
                    </Text>

                    <Text style={styles.imageCount}>
                        {imagenes.length}/{MAX_IMAGENES_POR_PROPIEDAD} imágenes
                    </Text>

                    {errorImagen ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorBoxText}>
                                {errorImagen}
                            </Text>
                        </View>
                    ) : null}

                    {mensajeImagen ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>
                                {mensajeImagen}
                            </Text>
                        </View>
                    ) : null}

                    {imagenes.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.imageList}
                        >
                            {imagenes.map((imagen) => {
                                const esPrincipal =
                                    Number(imagen.es_principal) === 1 ||
                                    imagen.es_principal === true;
                                const confirmarEliminar =
                                    String(imagenAEliminar?.id) ===
                                    String(imagen.id);

                                return (
                                    <View
                                        key={imagen.id}
                                        style={[
                                            styles.imageCard,
                                            esPrincipal && styles.imageCardPrincipal,
                                        ]}
                                    >
                                        {obtenerUrlImagen(imagen) ? (
                                            <Image
                                                source={{
                                                    uri: obtenerUrlImagen(imagen),
                                                }}
                                                style={styles.propertyImage}
                                                resizeMode="cover"
                                                accessibilityLabel={
                                                    esPrincipal
                                                        ? 'Imagen principal de la propiedad'
                                                        : 'Imagen de la propiedad'
                                                }
                                            />
                                        ) : (
                                            <View style={styles.imagePlaceholder}>
                                                <Text style={styles.imagePlaceholderText}>
                                                    No se pudo mostrar la imagen
                                                </Text>
                                            </View>
                                        )}

                                        <View style={styles.imageCardContent}>
                                            <Text
                                                style={[
                                                    styles.imageStatus,
                                                    esPrincipal &&
                                                        styles.imageStatusPrincipal,
                                                ]}
                                            >
                                                {esPrincipal
                                                    ? '★ Imagen principal'
                                                    : 'Imagen secundaria'}
                                            </Text>

                                            {confirmarEliminar ? (
                                                <View style={styles.imageConfirm}>
                                                    <Text style={styles.imageConfirmText}>
                                                        ¿Eliminar esta imagen?
                                                    </Text>
                                                    <View style={styles.imageActions}>
                                                        <TouchableOpacity
                                                            onPress={() =>
                                                                setImagenAEliminar(null)
                                                            }
                                                            disabled={procesandoImagen}
                                                            style={styles.imageActionButton}
                                                        >
                                                            <Text style={styles.imageActionText}>
                                                                Cancelar
                                                            </Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={eliminarImagen}
                                                            disabled={
                                                                procesandoImagen ||
                                                                guardando
                                                            }
                                                            style={[
                                                                styles.imageActionButton,
                                                                styles.imageDeleteButton,
                                                            ]}
                                                        >
                                                            <Text style={styles.imageDeleteText}>
                                                                {procesandoImagen
                                                                    ? 'Eliminando...'
                                                                    : 'Eliminar'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ) : (
                                                <View style={styles.imageActions}>
                                                    {!esPrincipal ? (
                                                        <TouchableOpacity
                                                            onPress={() =>
                                                                establecerImagenPrincipal(
                                                                    imagen
                                                                )
                                                            }
                                                            disabled={
                                                                procesandoImagen ||
                                                                guardando
                                                            }
                                                            style={styles.imageActionButton}
                                                        >
                                                            <Text style={styles.imageActionText}>
                                                                Hacer principal
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ) : null}
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setErrorImagen('');
                                                            setImagenAEliminar(imagen);
                                                        }}
                                                        disabled={
                                                            procesandoImagen ||
                                                            guardando
                                                        }
                                                        style={[
                                                            styles.imageActionButton,
                                                            styles.imageDeleteButton,
                                                        ]}
                                                    >
                                                        <Text style={styles.imageDeleteText}>
                                                            Eliminar
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <View style={styles.noImages}>
                            <Text style={styles.imagePlaceholderText}>
                                Todavía no hay imágenes cargadas.
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={agregarImagenes}
                        disabled={
                            procesandoImagen ||
                            guardando ||
                            imagenes.length >= MAX_IMAGENES_POR_PROPIEDAD
                        }
                        activeOpacity={0.85}
                        style={[
                            styles.addImagesButton,
                            (procesandoImagen ||
                                guardando ||
                                imagenes.length >= MAX_IMAGENES_POR_PROPIEDAD) &&
                                styles.saveButtonDisabled,
                        ]}
                    >
                        {procesandoImagen ? (
                            <ActivityIndicator color={theme.colors.white} />
                        ) : (
                            <Text style={styles.addImagesButtonText}>
                                {imagenes.length >= MAX_IMAGENES_POR_PROPIEDAD
                                    ? 'Máximo de imágenes alcanzado'
                                    : '+ Agregar imágenes'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.sectionTitle}>
                        Preferencias
                    </View>

                    <View style={styles.preferenceGroup}>
                        <Text style={styles.label}>
                            ¿Acepta mascotas?
                        </Text>
                        <View style={styles.preferenceOptions}>
                            {[true, false].map((acepta) => (
                                <TouchableOpacity
                                    key={String(acepta)}
                                    accessibilityRole="radio"
                                    accessibilityState={{
                                        selected: aceptaMascotas === acepta,
                                    }}
                                    style={[
                                        styles.preferenceOption,
                                        aceptaMascotas === acepta &&
                                            styles.preferenceOptionSelected,
                                    ]}
                                    onPress={() =>
                                        setAceptaMascotas(acepta)
                                    }
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={[
                                            styles.preferenceOptionText,
                                            aceptaMascotas === acepta &&
                                                styles.preferenceOptionTextSelected,
                                        ]}
                                    >
                                        {acepta ? 'Sí' : 'No'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.preferenceGroup}>
                        <Text style={styles.label}>
                            ¿Acepta hijos?
                        </Text>
                        <View style={styles.preferenceOptions}>
                            {[true, false].map((acepta) => (
                                <TouchableOpacity
                                    key={String(acepta)}
                                    accessibilityRole="radio"
                                    accessibilityState={{
                                        selected: aceptaHijos === acepta,
                                    }}
                                    style={[
                                        styles.preferenceOption,
                                        aceptaHijos === acepta &&
                                            styles.preferenceOptionSelected,
                                    ]}
                                    onPress={() =>
                                        setAceptaHijos(acepta)
                                    }
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={[
                                            styles.preferenceOptionText,
                                            aceptaHijos === acepta &&
                                                styles.preferenceOptionTextSelected,
                                        ]}
                                    >
                                        {acepta ? 'Sí' : 'No'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>
                        Requisitos para interesados
                    </Text>

                    <Text style={styles.helperText}>
                        Son orientativos: ayudan a ordenar consultas, pero no
                        descartan a nadie automáticamente.
                    </Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Disponible para mudarse desde
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="AAAA-MM-DD"
                            placeholderTextColor={theme.colors.textMuted}
                            value={fechaDisponibleDesde}
                            onChangeText={setFechaDisponibleDesde}
                            editable={!guardando}
                        />
                        {erroresCampos.fecha_disponible_desde ? (
                            <Text style={styles.fieldError}>
                                {erroresCampos.fecha_disponible_desde}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Máximo de ocupantes (opcional)
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: 4"
                            placeholderTextColor={theme.colors.textMuted}
                            value={maxOcupantes}
                            onChangeText={setMaxOcupantes}
                            keyboardType="number-pad"
                            editable={!guardando}
                        />
                        {erroresCampos.max_ocupantes ? (
                            <Text style={styles.fieldError}>
                                {erroresCampos.max_ocupantes}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.preferenceGroup}>
                        <Text style={styles.label}>
                            Garantías que aceptás
                        </Text>
                        {GARANTIAS.map(({ valor, etiqueta }) => {
                            const seleccionada =
                                garantiasAceptadas.includes(valor);
                            return (
                                <TouchableOpacity
                                    key={valor}
                                    style={styles.criteriaOption}
                                    onPress={() =>
                                        alternarGarantiaAceptada(valor)
                                    }
                                    accessibilityRole="checkbox"
                                    accessibilityState={{
                                        checked: seleccionada,
                                    }}
                                    disabled={guardando}
                                    activeOpacity={0.85}
                                >
                                    <View
                                        style={[
                                            styles.criteriaCheckbox,
                                            seleccionada &&
                                                styles.criteriaCheckboxSelected,
                                        ]}
                                    >
                                        {seleccionada ? (
                                            <Text
                                                style={styles.criteriaCheckboxMark}
                                            >
                                                ✓
                                            </Text>
                                        ) : null}
                                    </View>
                                    <Text style={styles.criteriaOptionText}>
                                        {etiqueta}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
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
                            (guardando || procesandoImagen) &&
                                styles.saveButtonDisabled,
                        ]}
                        onPress={guardar}
                        disabled={guardando || procesandoImagen}
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

    preferenceGroup: {
        marginBottom: theme.spacing.md,
    },

    preferenceOptions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },

    preferenceOption: {
        flex: 1,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.inputBg,
    },

    preferenceOptionSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryBg,
    },

    preferenceOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textMuted,
    },

    preferenceOptionTextSelected: {
        color: theme.colors.primary,
    },

    criteriaOption: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },

    criteriaCheckbox: {
        width: 22,
        height: 22,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },

    criteriaCheckboxSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary,
    },

    criteriaCheckboxMark: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },

    criteriaOptionText: {
        color: theme.colors.textDark,
        fontSize: 14,
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

    imageHelper: {
        marginTop: -theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 13,
        lineHeight: 19,
    },

    imageCount: {
        marginBottom: theme.spacing.sm,
        color: theme.colors.textDark,
        fontSize: 13,
        fontWeight: '600',
    },

    imageList: {
        gap: theme.spacing.sm,
        paddingBottom: theme.spacing.xs,
    },

    imageCard: {
        width: 190,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        backgroundColor: theme.colors.inputBg,
    },

    imageCardPrincipal: {
        borderColor: theme.colors.successText,
        borderWidth: 2,
    },

    propertyImage: {
        width: '100%',
        height: 125,
        backgroundColor: theme.colors.border,
    },

    imagePlaceholder: {
        width: '100%',
        height: 125,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.inputBg,
    },

    imagePlaceholderText: {
        color: theme.colors.textMuted,
        fontSize: 12,
        textAlign: 'center',
    },

    imageCardContent: {
        padding: theme.spacing.sm,
    },

    imageStatus: {
        marginBottom: theme.spacing.xs,
        color: theme.colors.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },

    imageStatusPrincipal: {
        color: theme.colors.successText,
    },

    imageActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
    },

    imageActionButton: {
        minHeight: 36,
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xs,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: 8,
    },

    imageActionText: {
        color: theme.colors.primary,
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },

    imageDeleteButton: {
        borderColor: theme.colors.errorText,
    },

    imageDeleteText: {
        color: theme.colors.errorText,
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },

    imageConfirm: {
        gap: theme.spacing.xs,
    },

    imageConfirmText: {
        color: theme.colors.errorText,
        fontSize: 12,
        fontWeight: '600',
    },

    noImages: {
        padding: theme.spacing.md,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.inputBg,
    },

    addImagesButton: {
        minHeight: 46,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
    },

    addImagesButtonText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
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