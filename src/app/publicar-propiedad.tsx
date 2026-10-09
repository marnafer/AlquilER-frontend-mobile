import { useEffect, useRef, useState } from 'react';

import {
    ActivityIndicator,
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

const MAX_IMAGENES_POR_PROPIEDAD = 10;

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

    const scrollViewRef = useRef<ScrollView>(null);

    const posicionesSectores = useRef<Record<string, number>>({});

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

    const [cargandoImagenes, setCargandoImagenes] = useState(false);
    const [imagenesCargando, setImagenesCargando] = useState<Set<string>>(
        new Set()
    );

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

    const centrarSector = (sector: string) => {
        const posicion = posicionesSectores.current[sector];

        if (posicion === undefined) {
            return;
        }

        scrollViewRef.current?.scrollTo({
            y: Math.max(posicion - 20, 0),
            animated: true,
        });
    };

    const centrarPrimerError = (
        errores: Record<string, string>
    ) => {
        const campos = Object.keys(errores);

        if (campos.length === 0) {
            return;
        }

        const campo = campos[0];

        const sectores: Record<string, string> = {
            titulo: 'informacion',
            descripcion: 'informacion',
            precio: 'informacion',
            expensas: 'informacion',
            categoria_id: 'informacion',

            direccion: 'ubicacion',
            localidad_id: 'ubicacion',

            cantidad_ambientes: 'caracteristicas',
            cantidad_dormitorios: 'caracteristicas',
            cantidad_banos: 'caracteristicas',
            capacidad: 'caracteristicas',
        };

        const sector = sectores[campo];

        if (sector) {
            setTimeout(() => {
                centrarSector(sector);
            }, 100);
        }
    };


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
        if (imagenes.length >= MAX_IMAGENES_POR_PROPIEDAD) {
            setErrorPublicacion(
                `Ya alcanzaste el máximo de ${MAX_IMAGENES_POR_PROPIEDAD} imágenes.`
            );

            return;
        }

        setErrorPublicacion('');
        setCargandoImagenes(true);

        const resultado =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.8,
            });

        if (resultado.canceled) {
            setCargandoImagenes(false);
            setImagenesCargando(new Set());

            return;
        }

        const cantidadDisponible =
            MAX_IMAGENES_POR_PROPIEDAD - imagenes.length;

        const nuevasImagenes = resultado.assets.slice(
            0,
            cantidadDisponible
        );

        const seAlcanzaraLimite =
            resultado.assets.length > cantidadDisponible;

        if (seAlcanzaraLimite) {
            setErrorPublicacion(
                `Solo se pueden tener ${MAX_IMAGENES_POR_PROPIEDAD} imágenes por propiedad.`
            );
        }

        if (nuevasImagenes.length === 0) {
            setCargandoImagenes(false);
            setImagenesCargando(new Set());

            return;
        }

        setImagenesCargando(
            new Set(
                nuevasImagenes.map((imagen) => imagen.uri)
            )
        );

        setImagenes((actuales) => [
            ...actuales,
            ...nuevasImagenes,
        ]);
    };


    const finalizarCargaImagen = (uri: string) => {
        setImagenesCargando((actuales) => {
            const nuevas = new Set(actuales);

            nuevas.delete(uri);

            if (nuevas.size === 0) {
                setCargandoImagenes(false);
            }

            return nuevas;
        });
    };


    const eliminarImagen = (index: number) => {
        const imagen = imagenes[index];

        setImagenes((actuales) =>
            actuales.filter((_, i) => i !== index)
        );

        setImagenesCargando((actuales) => {
            const nuevas = new Set(actuales);

            nuevas.delete(imagen.uri);

            if (nuevas.size === 0) {
                setCargandoImagenes(false);
            }

            return nuevas;
        });
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

        if (cargandoImagenes) {
            return;
        }

        if (imagenes.length > MAX_IMAGENES_POR_PROPIEDAD) {
            setErrorPublicacion(
                `No podés publicar una propiedad con más de ${MAX_IMAGENES_POR_PROPIEDAD} imágenes.`
            );

            return;
        }

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
            centrarPrimerError(erroresLocales);
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
                router.replace('/my-properties');
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
                centrarPrimerError(errores);

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
                ref={scrollViewRef}
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

                    <View
                        onLayout={(event) => {
                            posicionesSectores.current.informacion =
                                event.nativeEvent.layout.y;
                        }}
                    >

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

                    </View>

                    {/* Ubicación */}

                    <View
                        onLayout={(event) => {
                            posicionesSectores.current.ubicacion =
                                event.nativeEvent.layout.y;
                        }}
                    >

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

                    </View>

                    {/* Características */}

                    <View
                        onLayout={(event) => {
                            posicionesSectores.current.caracteristicas =
                                event.nativeEvent.layout.y;
                        }}
                    >

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
                        Agregá hasta {MAX_IMAGENES_POR_PROPIEDAD} imágenes.
                        La primera será la imagen principal.
                    </Text>

                    <Text style={styles.imageCountText}>
                        {imagenes.length}/{MAX_IMAGENES_POR_PROPIEDAD} imágenes
                    </Text>

                    <Pressable
                        style={({ pressed }) => [
                            styles.addImagesButton,
                            pressed && styles.addImagesButtonPressed,
                        ]}
                        onPress={seleccionarImagenes}
                        disabled={
                            publicando ||
                            cargandoImagenes ||
                            imagenes.length >= MAX_IMAGENES_POR_PROPIEDAD
                        }
                    >
                        <Text style={styles.addImagesButtonText}>
                            {imagenes.length >= MAX_IMAGENES_POR_PROPIEDAD
                                ? 'Máximo de imágenes alcanzado'
                                : '+ Agregar imágenes'}
                        </Text>
                    </Pressable>

                    {cargandoImagenes ? (
                        <View style={styles.loadingImagesContainer}>
                            <ActivityIndicator
                                size="small"
                                color={theme.colors.primary}
                            />

                            <View style={styles.loadingImagesTextContainer}>
                                <Text style={styles.loadingImagesTitle}>
                                    Cargando imágenes...
                                </Text>
                            </View>
                        </View>
                    ) : null}

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
                                        source={{ uri: imagen.uri }}
                                        style={styles.previewImage}
                                        onLoadEnd={() => finalizarCargaImagen(imagen.uri)}
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
                                        disabled={
                                            publicando ||
                                            cargandoImagenes
                                        }
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
                        !cargandoImagenes && (
                            <View style={styles.noImagesContainer}>
                                <Text style={styles.noImagesText}>
                                    Todavía no agregaste imágenes.
                                </Text>
                            </View>
                        )
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
                        disabled={
                            publicando ||
                            cargandoImagenes
                        }
                    >
                        <Text style={styles.publishButtonText}>
                            {publicando
                                ? 'Publicando propiedad...'
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

    addImagesButtonPressed: {
        backgroundColor: theme.colors.primary,
    },

    loadingImagesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
    },

    loadingImagesTextContainer: {
        marginLeft: theme.spacing.md,
        flex: 1,
    },

    loadingImagesTitle: {
        color: theme.colors.textDark,
        fontSize: 14,
        fontWeight: '600',
    },

    loadingImagesText: {
        marginTop: 3,
        color: theme.colors.textMuted,
        fontSize: 12,
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

    imageCountText: {
        marginTop: 4,
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textDark,
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
        color: theme.colors.white,
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
        color: theme.colors.white,
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
        backgroundColor: theme.colors.successBg,
    },

    successText: {
        fontSize: 14,
        color: theme.colors.successText,
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
        color: theme.colors.white,
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
        backgroundColor: theme.colors.white,
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
        backgroundColor: theme.colors.successBg,
        marginBottom: theme.spacing.md,
    },

    successIconText: {
        color: theme.colors.successText,
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