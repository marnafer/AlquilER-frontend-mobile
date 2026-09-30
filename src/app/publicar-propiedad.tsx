import { useEffect, useState } from 'react';

import {
    Animated,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import { useRouter } from 'expo-router';
import PropertySelect from '../components/PropertySelect';
import api from '../services/api';
import { theme } from '../theme/theme';


const esNumeroPositivo = (valor: string): boolean => {
    const numero = Number(valor);

    return (
        valor.trim() !== '' &&
        Number.isFinite(numero) &&
        numero > 0
    );
};


const esNumeroNoNegativo = (valor: string): boolean => {
    const numero = Number(valor);

    return (
        valor.trim() !== '' &&
        Number.isFinite(numero) &&
        numero >= 0
    );
};


const esEnteroPositivo = (valor: string): boolean => {
    const numero = Number(valor);

    return (
        valor.trim() !== '' &&
        Number.isInteger(numero) &&
        numero > 0
    );
};


const esEnteroNoNegativo = (valor: string): boolean => {
    const numero = Number(valor);

    return (
        valor.trim() !== '' &&
        Number.isInteger(numero) &&
        numero >= 0
    );
};


export default function PublicarPropiedad() {

    const router = useRouter();

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

    const [categoriaId, setCategoriaId] = useState<string | null>(null);
    const [localidadId, setLocalidadId] = useState<string | null>(null);
    const [serviciosSeleccionados, setServiciosSeleccionados] =
        useState<string[]>([]);

    const [categorias, setCategorias] = useState<any[]>([]);
    const [localidades, setLocalidades] = useState<any[]>([]);
    const [servicios, setServicios] = useState<any[]>([]);

    const [imagenes, setImagenes] = useState<
        ImagePicker.ImagePickerAsset[]
    >([]);

    const [loadingCatalogos, setLoadingCatalogos] = useState(true);
    const [errorCatalogos, setErrorCatalogos] = useState('');

    const [publicando, setPublicando] = useState(false);
    const [imagenActual, setImagenActual] = useState(0);
    const [totalImagenes, setTotalImagenes] = useState(0);
    const [errorPublicacion, setErrorPublicacion] = useState('');
    const [erroresCampos, setErroresCampos] = useState<
        Record<string, string>
    >({});

    const [mensajeExito, setMensajeExito] = useState('');
    const [mostrarExito, setMostrarExito] = useState(false);

    const escalaExito = useState(
        new Animated.Value(0.7)
    )[0];


    const cargarCatalogos = async () => {
        try {
            setLoadingCatalogos(true);
            setErrorCatalogos('');

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
        } catch (error) {
            console.error(
                'Error al cargar los catálogos:',
                error
            );

            setErrorCatalogos(
                'No se pudieron cargar los datos necesarios.'
            );
        } finally {
            setLoadingCatalogos(false);
        }
    };


    useEffect(() => {
        cargarCatalogos();
    }, []);


    const seleccionarImagenes = async () => {
        setErrorPublicacion('');

        const resultado =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.8,
            });

        if (resultado.canceled) {
            return;
        }

        setImagenes((actuales) => [
            ...actuales,
            ...resultado.assets,
        ]);
    };


    const eliminarImagen = (index: number) => {
        setImagenes((actuales) =>
            actuales.filter((_, indice) => indice !== index)
        );
    };


    const subirImagen = async (
        imagen: ImagePicker.ImagePickerAsset,
        propiedadId: number
    ) => {
        const formData = new FormData();

        formData.append(
            'propiedad_id',
            String(propiedadId)
        );

        formData.append(
            'descripcion',
            ''
        );

        formData.append(
            'imagen',
            {
                uri: imagen.uri,
                name:
                    imagen.fileName ||
                    `imagen-${Date.now()}.jpg`,
                type:
                    imagen.mimeType ||
                    'image/jpeg',
            } as any
        );

        await api.post(
            '/propiedad-imagenes',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
    };


    const handlePublicar = async () => {
    setErrorPublicacion('');
    setErroresCampos({});
    setMensajeExito('');

    const tituloLimpio = titulo.trim();
    const descripcionLimpia = descripcion.trim();
    const precioLimpio = precio.trim();
    const expensasLimpias = expensas.trim();
    const direccionLimpia = direccion.trim();
    const ambientesLimpios = cantidadAmbientes.trim();
    const dormitoriosLimpios = cantidadDormitorios.trim();
    const banosLimpios = cantidadBanos.trim();
    const capacidadLimpia = capacidad.trim();

    const erroresLocales: Record<string, string> = {};

    if (!tituloLimpio) {
        erroresLocales.titulo =
            'El título es obligatorio.';
    } else if (tituloLimpio.length < 3) {
        erroresLocales.titulo =
            'El título debe tener al menos 3 caracteres.';
    }

    if (!descripcionLimpia) {
        erroresLocales.descripcion =
            'La descripción es obligatoria.';
    }

    if (!esNumeroPositivo(precioLimpio)) {
        erroresLocales.precio =
            'El precio debe ser un número mayor a 0.';
    }

    if (
        expensasLimpias &&
        !esNumeroNoNegativo(expensasLimpias)
    ) {
        erroresLocales.expensas =
            'Las expensas deben ser un número mayor o igual a 0.';
    }

    if (!direccionLimpia) {
        erroresLocales.direccion =
            'La dirección es obligatoria.';
    } else if (direccionLimpia.length < 3) {
        erroresLocales.direccion =
            'La dirección debe tener al menos 3 caracteres.';
    }

    if (!esEnteroPositivo(ambientesLimpios)) {
        erroresLocales.cantidad_ambientes =
            'La cantidad de ambientes debe ser un entero mayor a 0.';
    }

    if (!esEnteroNoNegativo(dormitoriosLimpios)) {
        erroresLocales.cantidad_dormitorios =
            'La cantidad de dormitorios debe ser un entero mayor o igual a 0.';
    }

    if (!esEnteroNoNegativo(banosLimpios)) {
        erroresLocales.cantidad_banos =
            'La cantidad de baños debe ser un entero mayor o igual a 0.';
    }

    if (
        capacidadLimpia &&
        !esEnteroPositivo(capacidadLimpia)
    ) {
        erroresLocales.capacidad =
            'La capacidad debe ser un entero mayor a 0.';
    }

    if (!categoriaId) {
        erroresLocales.categoria_id =
            'Debés seleccionar una categoría.';
    }

    if (!localidadId) {
        erroresLocales.localidad_id =
            'Debés seleccionar una localidad.';
    }

    if (Object.keys(erroresLocales).length > 0) {
        setErroresCampos(erroresLocales);
        return;
    }

    try {
        setPublicando(true);

        const payload = {
            titulo: tituloLimpio,
            descripcion: descripcionLimpia,
            precio: Number(precioLimpio),
            expensas: expensasLimpias
                ? Number(expensasLimpias)
                : 0,
            direccion: direccionLimpia,
            cantidad_ambientes:
                Number(ambientesLimpios),
            cantidad_dormitorios:
                Number(dormitoriosLimpios),
            cantidad_banos:
                Number(banosLimpios),
            capacidad: capacidadLimpia
                ? Number(capacidadLimpia)
                : null,
            disponible,
            categoria_id: Number(categoriaId),
            localidad_id: Number(localidadId),
            servicios:
                serviciosSeleccionados.map(Number),
        };

        const response = await api.post(
            '/propiedades',
            payload
        );

        const propiedadId =
            response.data?.data?.id;

        if (!propiedadId) {
            throw new Error(
                'La API no devolvió el ID de la propiedad creada.'
            );
        }

        setTotalImagenes(imagenes.length);
        setImagenActual(0);

        for (let i = 0; i < imagenes.length; i++) {
            setImagenActual(i + 1);

            await subirImagen(
                imagenes[i],
                Number(propiedadId)
            );
        }

        setImagenActual(0);
        setTotalImagenes(0);

        setMensajeExito(
            'Propiedad creada correctamente'
        );

        setMostrarExito(true);

        escalaExito.setValue(0.7);

        Animated.spring(escalaExito, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
        }).start();

        setTimeout(() => {
            setMostrarExito(false);
            router.replace('/account');
        }, 2000);

    } catch (error: any) {
        console.log(
            'ERROR PUBLICAR:',
            error
        );

        console.log(
            'STATUS:',
            error?.response?.status
        );

        console.log(
            'DATA:',
            error?.response?.data
        );

        const validationErrors =
            error?.response?.data?.validation_errors;

        if (
            validationErrors &&
            typeof validationErrors === 'object'
        ) {
            const errores: Record<string, string> = {};

            Object.entries(
                validationErrors
            ).forEach(
                ([campo, mensajesCampo]) => {
                    if (
                        Array.isArray(
                            mensajesCampo
                        )
                    ) {
                        errores[campo] =
                            mensajesCampo.join('\n');
                    } else {
                        errores[campo] =
                            String(mensajesCampo);
                    }
                }
            );

            setErroresCampos(errores);

            return;
        }

        setErrorPublicacion(
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            'No se pudo publicar la propiedad.'
        );
    } finally {
        setPublicando(false);
    }
};
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
            <Modal
                visible={mostrarExito}
                transparent
                animationType="fade"
            >
                <View style={styles.successOverlay}>
                    <Animated.View
                        style={[
                            styles.successPopup,
                            {
                                transform: [
                                    {
                                        scale: escalaExito,
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.successIcon}>
                            <Text style={styles.successIconText}>
                                ✓
                            </Text>
                        </View>

                        <Text style={styles.successTitle}>
                            ¡Listo!
                        </Text>

                        <Text style={styles.successMessage}>
                            {mensajeExito}
                        </Text>
                    </Animated.View>
                </View>
            </Modal>
            <ScrollView
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        Publicar propiedad
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Completá los datos de la propiedad
                    </Text>
                </View>

                {errorCatalogos ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>
                            {errorCatalogos}
                        </Text>
                    </View>
                ) : null}

                {loadingCatalogos ? (
                    <Text style={styles.loadingText}>
                        Cargando categorías, localidades y servicios...
                    </Text>
                ) : null}

                <View style={styles.content}>

                    {/* Información básica */}

                    <Text style={styles.sectionTitleFirst}>
                        Información básica
                    </Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Título
                        </Text>

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
                            numberOfLines={5}
                            textAlignVertical="top"
                        />

                        {erroresCampos.descripcion ? (
                            <Text style={styles.fieldError}>
                                {erroresCampos.descripcion}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Precio
                        </Text>

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

                    <View style={styles.field}>
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

                    {/* Ubicación */}

                    <Text style={styles.sectionTitle}>
                        Ubicación
                    </Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Dirección
                        </Text>

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

                    {/* Características */}

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
                                    {erroresCampos.cantidad_ambientes}
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
                                    {erroresCampos.cantidad_dormitorios}
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>
                                Baños
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ej: 1"
                                placeholderTextColor={
                                    theme.colors.textMuted
                                }
                                keyboardType="numeric"
                                value={cantidadBanos}
                                onChangeText={
                                    setCantidadBanos
                                }
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

                    {/* Servicios */}

                    <Text style={styles.sectionTitle}>
                        Servicios
                    </Text>

                    <PropertySelect
                        label="Servicios disponibles"
                        placeholder="Seleccioná los servicios"
                        options={servicios}
                        value={serviciosSeleccionados}
                        onChange={setServiciosSeleccionados}
                        multiple
                        disabled={loadingCatalogos}
                    />

                    {/* Imágenes */}

                    <Text style={styles.sectionTitle}>
                        Imágenes
                    </Text>

                    <Text style={styles.helperText}>
                        Agregá imágenes de la propiedad. La primera será la imagen principal.
                    </Text>

                    <TouchableOpacity
                        style={styles.addImagesButton}
                        activeOpacity={0.85}
                        onPress={seleccionarImagenes}
                        disabled={publicando}
                    >
                        <Text style={styles.addImagesButtonText}>
                            + Agregar imágenes
                        </Text>
                    </TouchableOpacity>

                    {publicando && totalImagenes > 0 ? (
                    <View style={styles.uploadProgressContainer}>
                        <Text style={styles.uploadProgressText}>
                            Subiendo imágenes... {imagenActual} de {totalImagenes}
                        </Text>

                        <View style={styles.progressBarBackground}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width: `${
                                            (imagenActual / totalImagenes) * 100
                                        }%`,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                ) : null}

                    {imagenes.length > 0 ? (
                        <View style={styles.imagesContainer}>
                            {imagenes.map((imagen, index) => (
                                <View
                                    key={`${imagen.uri}-${index}`}
                                    style={styles.imageWrapper}
                                >
                                    <Image
                                        source={{
                                            uri: imagen.uri,
                                        }}
                                        style={styles.previewImage}
                                    />

                                    {index === 0 ? (
                                        <View
                                            style={
                                                styles.mainImageBadge
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.mainImageBadgeText
                                                }
                                            >
                                                Principal
                                            </Text>
                                        </View>
                                    ) : null}

                                    <Pressable
                                        style={
                                            styles.removeImageButton
                                        }
                                        onPress={() =>
                                            eliminarImagen(index)
                                        }
                                        disabled={publicando}
                                    >
                                        <Text
                                            style={
                                                styles.removeImageText
                                            }
                                        >
                                            ×
                                        </Text>
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.noImagesContainer}>
                            <Text style={styles.noImagesText}>
                                Todavía no agregaste imágenes.
                            </Text>
                        </View>
                    )}

                    {/* Disponibilidad */}

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

                        <Pressable
                            style={[
                                styles.checkPlaceholder,
                                !disponible &&
                                    styles.checkPlaceholderDisabled,
                            ]}
                            onPress={() =>
                                setDisponible(
                                    !disponible
                                )
                            }
                        >
                            {disponible && (
                                <Text style={styles.checkText}>
                                    ✓
                                </Text>
                            )}
                        </Pressable>
                    </View>

                    {mensajeExito ? (
                        <View style={styles.successContainer}>
                            <Text style={styles.successText}>
                                {mensajeExito}
                            </Text>
                        </View>
                    ) : null}

                    {/* Botón */}

                    <TouchableOpacity
                        style={[
                            styles.publishButton,
                            publicando &&
                                styles.publishButtonDisabled,
                        ]}
                        activeOpacity={0.85}
                        onPress={handlePublicar}
                        disabled={publicando}
                    >
                        <Text style={styles.publishButtonText}>
                            {publicando
                                ? totalImagenes > 0
                                    ? `Subiendo imágenes ${imagenActual}/${totalImagenes}...`
                                    : 'Publicando...'
                                : 'Publicar propiedad'}
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

    content: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: 100,
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
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
    },

    headerSubtitle: {
        marginTop: theme.spacing.sm,
        color: '#ffffff',
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.9,
    },

    sectionTitleFirst: {
        fontSize: 19,
        fontWeight: '700',
        color: theme.colors.textDark,
        marginTop: 4,
        marginBottom: theme.spacing.md,
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

    availabilityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
        padding: theme.spacing.md,
        marginTop: theme.spacing.lg,
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

    addImagesButton: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: 10,
        backgroundColor: theme.colors.background,
    },

    addImagesButtonText: {
        color: theme.colors.primary,
        fontSize: 15,
        fontWeight: '700',
    },

    imagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },

    imageWrapper: {
        width: 105,
        height: 105,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: theme.colors.inputBg,
    },

    previewImage: {
        width: '100%',
        height: '100%',
    },

    mainImageBadge: {
        position: 'absolute',
        left: 5,
        bottom: 5,
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: theme.colors.primary,
    },

    mainImageBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '700',
    },

    removeImageButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 25,
        height: 25,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },

    removeImageText: {
        color: '#ffffff',
        fontSize: 20,
        lineHeight: 22,
        fontWeight: '700',
    },

    noImagesContainer: {
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
    },

    noImagesText: {
        fontSize: 13,
        color: theme.colors.textMuted,
        textAlign: 'center',
    },

    errorContainer: {
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.errorBg,
    },

    errorText: {
        fontSize: 14,
        color: theme.colors.errorText,
    },

    fieldError: {
        marginTop: 5,
        fontSize: 12,
        color: theme.colors.errorText,
    },

    successContainer: {
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: '#dcfce7',
    },

    successText: {
        fontSize: 14,
        color: '#16a34a',
        fontWeight: '600',
        textAlign: 'center',
    },

    loadingText: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        fontSize: 14,
        color: theme.colors.textMuted,
        textAlign: 'center',
    },

    publishButton: {
        minHeight: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
    },

    publishButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },

    publishButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },

    uploadProgressContainer: {
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
    },

    uploadProgressText: {
        fontSize: 13,
        color: theme.colors.textDark,
        fontWeight: '600',
        marginBottom: theme.spacing.sm,
    },

    progressBarBackground: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: theme.colors.border,
    },

    progressBarFill: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
    },

    successOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },

    successPopup: {
        width: '78%',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        borderRadius: 18,
        backgroundColor: '#ffffff',
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },

    successIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dcfce7',
        marginBottom: theme.spacing.md,
    },

    successIconText: {
        color: '#16a34a',
        fontSize: 32,
        fontWeight: '700',
    },

    successTitle: {
        color: theme.colors.textDark,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: theme.spacing.sm,
    },

    successMessage: {
        color: theme.colors.textMuted,
        fontSize: 14,
        textAlign: 'center',
    },
});