import {
    useLocalSearchParams,
} from 'expo-router';

import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Share,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { CONFIGURACIONES } from '../services/adminConfig';
import { obtenerPerfil } from '../services/api';
import { theme } from '../theme/theme';
import { extraerItems } from '../utils/formato';

const normalizarOpcion = (op) => ({
    id: String(op?.value ?? op?.id ?? op),
    label: op?.label ?? op?.nombre ?? String(op),
});

const textoValor = (v) => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'object') return '—';

    return String(v);
};

const esCampoRequerido = (campo, modo) =>
    typeof campo.requerido === 'function'
        ? campo.requerido(modo)
        : Boolean(campo.requerido);

export default function AdminCrudScreen() {
    const { recurso } = useLocalSearchParams();

    const config = CONFIGURACIONES[recurso];

    const [autorizado, setAutorizado] = useState(false);
    const [verificando, setVerificando] = useState(true);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const [papelera, setPapelera] = useState(false);
    const [buscando, setBuscando] = useState('');
    const [filtros, setFiltros] = useState({});
    const [ordenKey, setOrdenKey] = useState('');
    const [ordenDireccion, setOrdenDireccion] = useState('asc');
    const [pagina, setPagina] = useState(1);
    const [detalleItem, setDetalleItem] = useState(null);
    const [detalleDatos, setDetalleDatos] = useState(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [errorDetalle, setErrorDetalle] = useState('');
    const [exportando, setExportando] = useState(false);

    const [externos, setExternos] = useState({});

    const [procesandoId, setProcesandoId] = useState(null);

    const [formAbierto, setFormAbierto] = useState(false);
    const [formModo, setFormModo] = useState('crear');
    const [formItem, setFormItem] = useState(null);
    const [formValores, setFormValores] = useState({});
    const [erroresForm, setErroresForm] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState('');

    useEffect(() => {
        let activo = true;

        const verificarAcceso = async () => {
            try {
                const res = await obtenerPerfil();

                if (!activo) return;

                if (res.success) {
                    const rol =
                        res.data?.rol?.nombre ||
                        res.data?.rol?.valor ||
                        res.data?.rol?.id;

                    setAutorizado(
                        String(rol).toLowerCase() ===
                            'administrador' || String(rol) === '1'
                    );
                } else {
                    setAutorizado(false);
                }
            } catch (err) {
                console.error(
                    'ADMIN CRUD: error al verificar acceso',
                    err
                );
                if (activo) {
                    setAutorizado(false);
                }
            } finally {
                if (activo) {
                    setVerificando(false);
                }
            }
        };

        verificarAcceso();

        return () => {
            activo = false;
        };
    }, []);

    useEffect(() => {
        if (!config?.externos) return;

        let activo = true;

        const cargarExternos = async () => {
            const resultado = {};

            await Promise.all(
                config.externos.map(async (ext) => {
                    try {
                        const res = await ext.cargar();

                        resultado[ext.clave] = extraerItems(res);
                    } catch (err) {
                        console.error(
                            `ADMIN CRUD: error al cargar ${ext.clave}`,
                            err
                        );
                        resultado[ext.clave] = [];
                    }
                })
            );

            if (activo) {
                setExternos(resultado);
            }
        };

        cargarExternos();

        return () => {
            activo = false;
        };
    }, [config]);

    const obtenerItems = useCallback(async () => {
        if (!config) return [];

        const filtrosAplicados = Object.entries(filtros).reduce(
            (acc, [k, v]) => {
                if (v !== '' && v !== null && v !== undefined) {
                    acc[k] = v;
                }

                return acc;
            },
            {}
        );

        const res = await config.obtener({
            papelera,
            filtros: filtrosAplicados,
        });

        return extraerItems(res);
    }, [config, papelera, filtros]);

    const cargar = useCallback(async () => {
        if (!config) return;

        setLoading(true);
        setError('');
        setMensaje('');

        try {
            setItems(await obtenerItems());
        } catch (err) {
            console.error('ADMIN CRUD: error al cargar', err);

            setError(
                'No se pudieron cargar los datos. Verificá tu conexión.'
            );
        } finally {
            setLoading(false);
        }
    }, [config, obtenerItems]);

    useEffect(() => {
        if (!config) return;

        let activo = true;

        const cargarInicial = async () => {
            try {
                const nuevosItems = await obtenerItems();

                if (activo) {
                    setItems(nuevosItems);
                }
            } catch (err) {
                console.error('ADMIN CRUD: error al cargar', err);

                if (activo) {
                    setError(
                        'No se pudieron cargar los datos. Verificá tu conexión.'
                    );
                }
            } finally {
                if (activo) {
                    setLoading(false);
                }
            }
        };

        cargarInicial();

        return () => {
            activo = false;
        };
    }, [config, obtenerItems]);

    const camposAplicables = (modo) =>
        (config?.campos || []).filter(
            (campo) =>
                (campo.soloCrear && modo === 'crear') ||
                (campo.soloEditar && modo === 'editar') ||
                (!campo.soloCrear && !campo.soloEditar)
        );

    const resolverOpciones = (campo) => {
        if (typeof campo.opciones === 'function') {
            return (campo.opciones(formItem, externos) || []).map(
                normalizarOpcion
            );
        }

        if (typeof campo.opciones === 'string') {
            return (externos[campo.opciones] || []).map(
                normalizarOpcion
            );
        }

        return (campo.opciones || []).map(normalizarOpcion);
    };

    const valoresDesdeItem = (item, modo) => {
        const valores = {};

        camposAplicables(modo).forEach((campo) => {
            const v = item?.[campo.name];

            valores[campo.name] =
                v === null || v === undefined ? '' : String(v);
        });

        return valores;
    };

    const abrirCrear = () => {
        setFormModo('crear');
        setFormItem(null);

        const valores = {};

        camposAplicables('crear').forEach((campo) => {
            valores[campo.name] = '';
        });

        setFormValores(valores);
        setErroresForm({});
        setErrorForm('');
        setFormAbierto(true);
    };

    const abrirEditar = (item) => {
        setFormModo('editar');
        setFormItem(item);

        const normalizado = config.normalizarEdicion
            ? config.normalizarEdicion(item)
            : item;

        setFormValores(valoresDesdeItem(normalizado, 'editar'));
        setErroresForm({});
        setErrorForm('');
        setFormAbierto(true);
    };

    const validarForm = () => {
        const errores = {};
        const campos = camposAplicables(formModo);

        campos.forEach((campo) => {
            const valor = (formValores[campo.name] ?? '').trim();

            if (esCampoRequerido(campo, formModo) && !valor) {
                errores[campo.name] = 'Este campo es obligatorio.';

                return;
            }

            if (valor) {
                if (
                    campo.tipo === 'number' &&
                    !Number.isFinite(Number(valor))
                ) {
                    errores[campo.name] =
                        'Debe ser un número válido.';

                    return;
                }

                if (campo.min && valor.length < campo.min) {
                    errores[campo.name] = `Debe tener al menos ${campo.min} caracteres.`;

                    return;
                }

                if (campo.max && valor.length > campo.max) {
                    errores[campo.name] = `Debe tener máximo ${campo.max} caracteres.`;
                }
            }
        });

        setErroresForm(errores);

        return Object.keys(errores).length === 0;
    };

    const construirPayload = () => {
        const payload = {};
        const campos = camposAplicables(formModo);

        campos.forEach((campo) => {
            const crudo = formValores[campo.name] ?? '';

            if (crudo === '' || crudo === null || crudo === undefined) {
                if (campo.name === 'contrasena') return;

                if (esCampoRequerido(campo, formModo)) {
                    payload[campo.name] =
                        campo.tipo === 'number'
                            ? Number(crudo)
                            : crudo;
                }

                return;
            }

            if (campo.tipo === 'number') {
                payload[campo.name] = Number(crudo);

                return;
            }

            if (campo.tipo === 'select') {
                const soloNumerico = /^\d+$/.test(crudo);

                payload[campo.name] = soloNumerico
                    ? Number(crudo)
                    : crudo;

                return;
            }

            payload[campo.name] = crudo;
        });

        return payload;
    };

    const guardarForm = async () => {
        if (!validarForm()) return;

        setGuardando(true);
        setErrorForm('');

        const payload = construirPayload();

        try {
            const resultado =
                formModo === 'crear'
                    ? await config.crear(payload)
                    : await config.actualizar(
                          formItem.id,
                          payload
                      );

            if (!resultado?.success) {
                setErrorForm(
                    resultado?.error ||
                    resultado?.message ||
                        'No se pudieron guardar los cambios.'
                );

                return;
            }

            setFormAbierto(false);
            cargar();
        } catch (err) {
            console.error('ADMIN CRUD: error al guardar', err);

            setErrorForm('Error de conexión al guardar.');
        } finally {
            setGuardando(false);
        }
    };

    const confirmarAccion = (texto) => {
        if (
            typeof window !== 'undefined' &&
            window.confirm &&
            !window.confirm(texto)
        ) {
            return false;
        }

        return true;
    };

    const abrirDetalle = async (item) => {
        if (!config?.detalle) return;

        setDetalleItem(item);
        setDetalleDatos(null);
        setErrorDetalle('');
        setCargandoDetalle(true);

        try {
            const datos = await config.detalle.cargar(item, externos);
            if (datos === null || datos === undefined) {
                throw new Error('El detalle no contiene datos.');
            }
            setDetalleDatos(datos);
        } catch (err) {
            console.error('ADMIN CRUD: error al cargar detalle', err);
            setErrorDetalle(
                err?.message || 'No se pudo cargar el detalle.'
            );
        } finally {
            setCargandoDetalle(false);
        }
    };

    const obtenerValorColumna = (item, columna) => {
        const valor = columna.render
            ? columna.render(item, externos)
            : item[columna.key];

        if (
            valor === null ||
            valor === undefined ||
            typeof valor === 'object'
        ) {
            return item[columna.key] ?? '';
        }

        return valor;
    };

    const exportarCsv = async () => {
        if (exportando) return;

        setExportando(true);
        setError('');
        try {
            const escaparCsv = (valor) =>
                `"${String(valor ?? '').replace(/"/g, '""')}"`;
            const filas = [
                config.columnas.map((columna) =>
                    escaparCsv(columna.label)
                ),
                ...itemsOrdenados.map((item) =>
                    config.columnas.map((columna) =>
                        escaparCsv(obtenerValorColumna(item, columna))
                    )
                ),
            ];
            const contenido = `\uFEFF${filas
                .map((fila) => fila.join(';'))
                .join('\r\n')}`;
            const nombre = `${config.csvNombre || config.clave || 'datos'}.csv`;

            if (Platform.OS === 'web') {
                const blob = new Blob([contenido], {
                    type: 'text/csv;charset=utf-8;',
                });
                const url = URL.createObjectURL(blob);
                const enlace = document.createElement('a');
                enlace.href = url;
                enlace.download = nombre;
                document.body.appendChild(enlace);
                enlace.click();
                enlace.remove();
                setTimeout(() => URL.revokeObjectURL(url), 0);
            } else {
                const resultado = await Share.share({
                    title: `Exportar ${config.titulo}`,
                    message: contenido,
                });
                if (resultado.action !== Share.sharedAction) return;
            }
            setMensaje('Exportación preparada correctamente.');
        } catch (err) {
            console.error('ADMIN CRUD: error al exportar CSV', err);
            setError(
                err?.message || 'No se pudo exportar el archivo CSV.'
            );
        } finally {
            setExportando(false);
        }
    };

    const eliminar = async (item) => {
        if (
            !confirmarAccion(
                `¿Eliminar este elemento? Se moverá a la papelera.`
            )
        ) {
            return;
        }

        setProcesandoId(String(item.id));

        const resultado = await config.eliminar(item.id);

        if (resultado?.success) {
            setMensaje('Elemento movido a la papelera.');
        } else {
            setMensaje(
                resultado?.error ||
                resultado?.message ||
                    'No se pudo eliminar.'
            );
        }

        setProcesandoId(null);
        cargar();
    };

    const restaurar = async (item) => {
        setProcesandoId(String(item.id));

        const resultado = await config.restaurar(item.id);

        if (resultado?.success) {
            setMensaje('Elemento restaurado.');
        } else {
            setMensaje(
                resultado?.error ||
                resultado?.message ||
                    'No se pudo restaurar.'
            );
        }

        setProcesandoId(null);
        cargar();
    };

    const ejecutarAccion = async (accion, item) => {
        setProcesandoId(String(item.id));

        const resultado = await accion.ejecutar(item.id);

        if (!resultado?.success) {
            setMensaje(
                resultado?.error ||
                resultado?.message ||
                    'No se pudo ejecutar la acción.'
            );
        }

        setProcesandoId(null);
        cargar();
    };

    if (verificando) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Verificando acceso...
                </Text>
            </View>
        );
    }

    if (!autorizado) {
        return (
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <ScreenHeader
                    title="Panel de control"
                    subtitle="Administración"
                />

                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        No tenés permisos de administración para
                        usar este módulo.
                    </Text>
                </View>
            </ScrollView>
        );
    }

    if (!config) {
        return (
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <ScreenHeader
                    title="Panel de control"
                    subtitle="Administración"
                />

                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error || 'El módulo no existe.'}
                    </Text>
                </View>
            </ScrollView>
        );
    }

    if (formAbierto) {
        const campos = camposAplicables(formModo);

        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={
                    Platform.OS === 'ios' ? 'padding' : undefined
                }
            >
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() =>
                                setFormAbierto(false)
                            }
                            activeOpacity={0.8}
                        >
                            <Text style={styles.backButtonText}>
                                ‹ Cancelar
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>
                            {formModo === 'crear'
                                ? `Nuevo ${config.nombreSingular || 'elemento'}`
                                : `Editar ${config.nombreSingular || 'elemento'}`}
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            Completá los datos y guardá los
                            cambios.
                        </Text>
                    </View>

                    <View style={styles.formContent}>
                        {errorForm ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>
                                    {errorForm}
                                </Text>
                            </View>
                        ) : null}

                        {campos.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    Este módulo no tiene campos
                                    editables.
                                </Text>
                            </View>
                        ) : (
                            campos.map((campo) => {
                                const opciones =
                                    campo.tipo === 'select'
                                        ? resolverOpciones(campo)
                                        : [];

                                const errorCampo =
                                    erroresForm[campo.name];

                                return (
                                    <View
                                        key={campo.name}
                                        style={styles.field}
                                    >
                                        <Text style={styles.label}>
                                            {campo.label}{' '}
                                            {esCampoRequerido(
                                                campo,
                                                formModo
                                            ) ? (
                                                <Text
                                                    style={
                                                        styles.labelReq
                                                    }
                                                >
                                                    *
                                                </Text>
                                            ) : null}
                                        </Text>

                                        {campo.tipo === 'select' ? (
                                            <View style={styles.chips}>
                                                {opciones.map(
                                                    (op) => {
                                                        const activo =
                                                            String(
                                                                formValores[
                                                                    campo
                                                                        .name
                                                                ]
                                                            ) ===
                                                            op.id;

                                                        return (
                                                            <TouchableOpacity
                                                                key={
                                                                    op.id
                                                                }
                                                                style={[
                                                                    styles.chip,
                                                                    activo &&
                                                                        styles.chipActivo,
                                                                ]}
                                                                onPress={() =>
                                                                    setFormValores(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            [campo.name]:
                                                                                op.id,
                                                                        })
                                                                    )
                                                                }
                                                                activeOpacity={
                                                                    0.85
                                                                }
                                                            >
                                                                <Text
                                                                    style={[
                                                                        styles.chipText,
                                                                        activo &&
                                                                            styles.chipTextActivo,
                                                                    ]}
                                                                >
                                                                    {
                                                                        op.label
                                                                    }
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    }
                                                )}
                                            </View>
                                        ) : (
                                            <TextInput
                                                style={[
                                                    styles.input,
                                                    campo.tipo ===
                                                        'textarea' &&
                                                        styles.textArea,
                                                ]}
                                                placeholder={
                                                    campo.placeholder ||
                                                    ''
                                                }
                                                placeholderTextColor={
                                                    theme.colors
                                                        .textMuted
                                                }
                                                value={
                                                    formValores[
                                                        campo.name
                                                    ] ?? ''
                                                }
                                                onChangeText={(t) =>
                                                    setFormValores(
                                                        (prev) => ({
                                                            ...prev,
                                                            [campo.name]:
                                                                t,
                                                        })
                                                    )
                                                }
                                                keyboardType={
                                                    campo.tipo ===
                                                    'number'
                                                        ? 'numeric'
                                                        : campo.tipo ===
                                                            'email'
                                                        ? 'email-address'
                                                        : 'default'
                                                }
                                                secureTextEntry={
                                                    campo.tipo ===
                                                    'password'
                                                }
                                                multiline={
                                                    campo.tipo ===
                                                    'textarea'
                                                }
                                                textAlignVertical={
                                                    campo.tipo ===
                                                    'textarea'
                                                        ? 'top'
                                                        : 'center'
                                                }
                                            />
                                        )}

                                        {errorCampo ? (
                                            <Text
                                                style={
                                                    styles.fieldError
                                                }
                                            >
                                                {errorCampo}
                                            </Text>
                                        ) : null}

                                        {campo.ayuda ? (
                                            <Text
                                                style={
                                                    styles.helper
                                                }
                                            >
                                                {campo.ayuda}
                                            </Text>
                                        ) : null}
                                    </View>
                                );
                            })
                        )}

                        {config.crear || config.actualizar ? (
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    guardando &&
                                        styles.saveButtonDisabled,
                                ]}
                                onPress={guardarForm}
                                disabled={guardando}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={styles.saveButtonText}
                                >
                                    {guardando
                                        ? 'Guardando...'
                                        : 'Guardar'}
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    const textoBuscado = buscando.trim().toLowerCase();
    const itemsFiltrados =
        textoBuscado.length > 0
            ? items.filter((item) =>
                  Object.values(item)
                      .map((v) =>
                          v && typeof v === 'object'
                              ? ''
                              : String(v ?? '')
                      )
                      .join(' ')
                      .toLowerCase()
                      .includes(textoBuscado)
              )
            : items;

    const itemsOrdenados = ordenKey
        ? [...itemsFiltrados].sort((a, b) => {
              const columna = config.columnas.find(
                  (item) => item.key === ordenKey
              );
              const valorA = obtenerValorColumna(a, columna);
              const valorB = obtenerValorColumna(b, columna);
              const numeroA = Number(valorA);
              const numeroB = Number(valorB);
              const ambosNumericos =
                  String(valorA).trim() !== '' &&
                  String(valorB).trim() !== '' &&
                  Number.isFinite(numeroA) &&
                  Number.isFinite(numeroB);
              const comparacion = ambosNumericos
                  ? numeroA - numeroB
                  : String(valorA ?? '').localeCompare(
                        String(valorB ?? ''),
                        'es',
                        { sensitivity: 'base', numeric: true }
                    );
              return ordenDireccion === 'asc'
                  ? comparacion
                  : -comparacion;
          })
        : itemsFiltrados;
    const filasPorPagina = 10;
    const totalPaginas = Math.max(
        1,
        Math.ceil(itemsOrdenados.length / filasPorPagina)
    );
    const paginaActual = Math.min(pagina, totalPaginas);
    const itemsPaginados = itemsOrdenados.slice(
        (paginaActual - 1) * filasPorPagina,
        paginaActual * filasPorPagina
    );
    const inicioPaginas = Math.max(
        1,
        Math.min(paginaActual - 3, totalPaginas - 6)
    );
    const paginasVisibles = Array.from(
        { length: Math.min(7, totalPaginas) },
        (_, indice) => inicioPaginas + indice
    );

    const otrasColumnas = config.columnas.filter(
        (col) =>
            col.key !== config.principal && col.key !== 'id'
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <ScreenHeader
                title={config.titulo}
                subtitle={config.descripcion}
            />

            <View style={styles.toolbar}>
                {config.papelera ? (
                    <TouchableOpacity
                        style={[
                            styles.toolbarButton,
                            papelera &&
                                styles.toolbarButtonActivo,
                        ]}
                        onPress={() => {
                            setPagina(1);
                            setPapelera((v) => !v)
                        }}
                        activeOpacity={0.85}
                    >
                        <Text
                            style={[
                                styles.toolbarButtonText,
                                papelera &&
                                    styles.toolbarButtonTextActivo,
                            ]}
                        >
                            {papelera ? 'Ver activos' : `🗑️ Papelera`}
                        </Text>
                    </TouchableOpacity>
                ) : null}

                {config.crear ? (
                    <TouchableOpacity
                        style={styles.nuevoButton}
                        onPress={abrirCrear}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.nuevoButtonText}>
                            + Nuevo
                        </Text>
                    </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={exportarCsv}
                    disabled={exportando || loading}
                    activeOpacity={0.85}
                >
                    <Text style={styles.toolbarButtonText}>
                        {exportando ? 'Preparando...' : 'Exportar CSV'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar..."
                    placeholderTextColor={
                        theme.colors.textMuted
                    }
                    value={buscando}
                    onChangeText={(texto) => {
                        setBuscando(texto);
                        setPagina(1);
                    }}
                />
            </View>

            <View style={styles.sortWrap}>
                <Text style={styles.filtroLabel}>Ordenar por</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sortOptions}
                >
                    {config.columnas.map((columna) => {
                        const activa = ordenKey === columna.key;
                        return (
                            <TouchableOpacity
                                key={columna.key}
                                style={[
                                    styles.chip,
                                    activa && styles.chipActivo,
                                ]}
                                onPress={() => {
                                    if (activa) {
                                        setOrdenDireccion((direccion) =>
                                            direccion === 'asc'
                                                ? 'desc'
                                                : 'asc'
                                        );
                                    } else {
                                        setOrdenKey(columna.key);
                                        setOrdenDireccion('asc');
                                    }
                                    setPagina(1);
                                }}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        activa && styles.chipTextActivo,
                                    ]}
                                >
                                    {columna.label}
                                    {activa
                                        ? ordenDireccion === 'asc'
                                            ? ' ↑'
                                            : ' ↓'
                                        : ''}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {config.filtros ? (
                <View style={styles.filtros}>
                    {config.filtros.map((filtro) => {
                        if (filtro.opciones) {
                            return (
                                <View
                                    key={filtro.parametro}
                                    style={styles.filtro}
                                >
                                    <Text style={styles.filtroLabel}>
                                        {filtro.label}
                                    </Text>

                                    <View style={styles.chips}>
                                        <TouchableOpacity
                                            style={[
                                                styles.chip,
                                                !filtros[
                                                    filtro.parametro
                                                ] &&
                                                    styles.chipActivo,
                                            ]}
                                            onPress={() => {
                                                setPagina(1);
                                                setFiltros(
                                                    (prev) => ({
                                                        ...prev,
                                                        [filtro.parametro]:
                                                            '',
                                                    })
                                                )
                                            }}
                                            activeOpacity={0.85}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    !filtros[
                                                        filtro
                                                            .parametro
                                                    ] &&
                                                        styles.chipTextActivo,
                                                ]}
                                            >
                                                Todos
                                            </Text>
                                        </TouchableOpacity>

                                        {filtro.opciones.map(
                                            (op) => {
                                                const opc =
                                                    normalizarOpcion(
                                                        op
                                                    );

                                                const activo =
                                                    String(
                                                        filtros[
                                                            filtro
                                                                .parametro
                                                        ] ?? ''
                                                    ) === opc.id;

                                                return (
                                                    <TouchableOpacity
                                                        key={
                                                            opc.id
                                                        }
                                                        style={[
                                                            styles.chip,
                                                            activo &&
                                                                styles.chipActivo,
                                                        ]}
                                                        onPress={() => {
                                                            setPagina(1);
                                                            setFiltros(
                                                                (
                                                                    prev
                                                                ) => ({
                                                                    ...prev,
                                                                    [filtro.parametro]:
                                                                        opc.id,
                                                                })
                                                            )
                                                        }}
                                                        activeOpacity={
                                                            0.85
                                                        }
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.chipText,
                                                                activo &&
                                                                    styles.chipTextActivo,
                                                            ]}
                                                        >
                                                            {
                                                                opc.label
                                                            }
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            }
                                        )}
                                    </View>
                                </View>
                            );
                        }

                        return (
                            <View
                                key={filtro.parametro}
                                style={styles.filtro}
                            >
                                <Text style={styles.filtroLabel}>
                                    {filtro.label}
                                </Text>

                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="AAAA-MM-DD"
                                    placeholderTextColor={
                                        theme.colors.textMuted
                                    }
                                    value={
                                        filtros[
                                            filtro.parametro
                                        ] ?? ''
                                    }
                                    onChangeText={(t) => {
                                        setPagina(1);
                                        setFiltros((prev) => ({
                                            ...prev,
                                            [filtro.parametro]: t,
                                        }));
                                    }}
                                />
                            </View>
                        );
                    })}
                </View>
            ) : null}

            {mensaje ? (
                <View style={styles.messageBox}>
                    <Text style={styles.messageText}>
                        {mensaje}
                    </Text>
                </View>
            ) : null}

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={cargar}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.retryButtonText}>
                            Reintentar
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {loading ? (
                <View style={styles.loadingContainerSmall}>
                    <ActivityIndicator
                        size="large"
                        color={theme.colors.primary}
                    />

                    <Text style={styles.loadingText}>
                        Cargando {config.titulo.toLowerCase()}...
                    </Text>
                </View>
            ) : itemsPaginados.length > 0 ? (
                <View style={styles.lista}>
                    {itemsPaginados.map((item) => {
                        const procesando =
                            procesandoId === String(item.id);

                        const valorPrincipal =
                            config.columnas.find(
                                (col) =>
                                    col.key === config.principal
                            )?.render
                                ? config.columnas.find(
                                      (col) =>
                                          col.key ===
                                          config.principal
                                  ).render(item, externos)
                                : config.principal === 'id'
                                ? `#${item.id ?? item[config.principal]}`
                                : item[config.principal] ??
                                  item.id;

                        return (
                            <View
                                key={item.id}
                                style={styles.card}
                            >
                                <Text style={styles.cardTitle}>
                                    {textoValor(
                                        valorPrincipal
                                    )}
                                </Text>

                                {otrasColumnas
                                    .slice(0, 5)
                                    .map((col) => {
                                        const valor = col.render
                                            ? col.render(
                                                  item,
                                                  externos
                                              )
                                            : item[col.key];

                                        const representable =
                                            textoValor(valor);

                                        if (
                                            representable ===
                                            '—'
                                        ) {
                                            return null;
                                        }

                                        return (
                                            <View
                                                key={col.key}
                                                style={
                                                    styles.cardLine
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.cardLineLabel
                                                    }
                                                >
                                                    {col.label}:
                                                </Text>

                                                <Text
                                                    style={[
                                                        styles.cardLineValue,
                                                        col.color
                                                            ? {
                                                                  color: col.color(
                                                                      item
                                                                  ),
                                                              }
                                                            : null,
                                                    ]}
                                                    numberOfLines={
                                                        1
                                                    }
                                                >
                                                    {representable}
                                                </Text>
                                            </View>
                                        );
                                    })}

                                <View style={styles.cardAcciones}>
                                    {config.detalle ? (
                                        <TouchableOpacity
                                            style={styles.actionSmall}
                                            onPress={() => abrirDetalle(item)}
                                            activeOpacity={0.85}
                                        >
                                            <Text
                                                style={styles.actionSmallText}
                                            >
                                                Ver detalle
                                            </Text>
                                        </TouchableOpacity>
                                    ) : null}

                                    {!config.soloLectura &&
                                    config.actualizar ? (
                                        <TouchableOpacity
                                            style={
                                                styles.actionSmall
                                            }
                                            onPress={() =>
                                                abrirEditar(
                                                    item
                                                )
                                            }
                                            activeOpacity={0.85}
                                        >
                                            <Text
                                                style={
                                                    styles.actionSmallText
                                                }
                                            >
                                                ✏️ Editar
                                            </Text>
                                        </TouchableOpacity>
                                    ) : null}

                                    {(config.acciones || [])
                                        .filter((accion) =>
                                            accion.permitido(
                                                item
                                            )
                                        )
                                        .map((accion) => (
                                            <TouchableOpacity
                                                key={
                                                    accion.etiqueta
                                                }
                                                style={
                                                    styles.actionSmall
                                                }
                                                onPress={() =>
                                                    ejecutarAccion(
                                                        accion,
                                                        item
                                                    )
                                                }
                                                disabled={procesando}
                                                activeOpacity={
                                                    0.85
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        styles.actionSmallText,
                                                        {
                                                            color:
                                                                accion.color,
                                                        },
                                                    ]}
                                                >
                                                    {procesando
                                                        ? '...'
                                                        : accion.etiqueta}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}

                                    {!config.soloLectura ? (
                                        papelera ? (
                                            config.restaurar ? (
                                                <TouchableOpacity
                                                    style={
                                                        styles.actionSmall
                                                    }
                                                    onPress={() =>
                                                        restaurar(
                                                            item
                                                        )
                                                    }
                                                    disabled={
                                                        procesando
                                                    }
                                                    activeOpacity={
                                                        0.85
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.actionSmallText
                                                        }
                                                    >
                                                        {procesando
                                                            ? '...'
                                                            : '♻️ Restaurar'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : null
                                        ) : config.eliminar ? (
                                            <TouchableOpacity
                                                style={[
                                                    styles.actionSmall,
                                                    styles.actionEliminar,
                                                ]}
                                                onPress={() =>
                                                    eliminar(item)
                                                }
                                                disabled={
                                                    procesando
                                                }
                                                activeOpacity={
                                                    0.85
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        styles.actionSmallText,
                                                        styles.actionEliminarText,
                                                    ]}
                                                >
                                                    {procesando
                                                        ? '...'
                                                        : '🗑️ Eliminar'}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : null
                                    ) : null}
                                </View>
                            </View>
                        );
                    })}
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>
                        {config.emoji || '📭'}
                    </Text>

                    <Text style={styles.emptyTitle}>
                        {papelera
                            ? 'La papelera está vacía'
                            : 'No hay elementos'}
                    </Text>

                    <Text style={styles.emptyText}>
                        {papelera
                            ? 'Los elementos eliminados aparecerán acá y podrás restaurarlos.'
                            : 'Los registros aparecerán acá. Probá ajustar los filtros o buscar con otro término.'}
                    </Text>
                </View>
            )}

            {!loading && itemsOrdenados.length > 0 ? (
                <View style={styles.pagination}>
                    <TouchableOpacity
                        style={[
                            styles.toolbarButton,
                            paginaActual <= 1 && styles.disabledButton,
                        ]}
                        onPress={() =>
                            setPagina((actual) => Math.max(1, actual - 1))
                        }
                        disabled={paginaActual <= 1}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.toolbarButtonText}>Anterior</Text>
                    </TouchableOpacity>
                    {paginasVisibles.map((numero) => (
                        <TouchableOpacity
                            key={numero}
                            style={[
                                styles.pageButton,
                                paginaActual === numero &&
                                    styles.pageButtonActive,
                            ]}
                            onPress={() => setPagina(numero)}
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[
                                    styles.pageButtonText,
                                    paginaActual === numero &&
                                        styles.pageButtonTextActive,
                                ]}
                            >
                                {numero}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={[
                            styles.toolbarButton,
                            paginaActual >= totalPaginas &&
                                styles.disabledButton,
                        ]}
                        onPress={() =>
                            setPagina((actual) =>
                                Math.min(totalPaginas, actual + 1)
                            )
                        }
                        disabled={paginaActual >= totalPaginas}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.toolbarButtonText}>
                            Siguiente
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.paginationSummary}>
                        Página {paginaActual} de {totalPaginas}
                    </Text>
                </View>
            ) : null}

            <Modal
                visible={Boolean(detalleItem && config.detalle)}
                transparent
                animationType="fade"
                onRequestClose={() => setDetalleItem(null)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.detailModal}>
                        <Text style={styles.detailTitle}>
                            {typeof config.detalle?.titulo === 'function'
                                ? config.detalle.titulo(detalleItem)
                                : config.detalle?.titulo || 'Detalle'}
                        </Text>
                        <ScrollView
                            style={styles.detailContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {cargandoDetalle ? (
                                <ActivityIndicator
                                    size="large"
                                    color={theme.colors.primary}
                                />
                            ) : errorDetalle ? (
                                <Text style={styles.errorText}>
                                    {errorDetalle}
                                </Text>
                            ) : detalleDatos ? (
                                (config.detalle?.filas || []).map((fila) => (
                                    <View
                                        key={fila.label}
                                        style={styles.detailRow}
                                    >
                                        <Text style={styles.detailLabel}>
                                            {fila.label}
                                        </Text>
                                        <Text style={styles.detailValue}>
                                            {textoValor(
                                                fila.valor(detalleDatos)
                                            )}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.errorText}>
                                    No se recibieron datos para mostrar.
                                </Text>
                            )}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.detailCloseButton}
                            onPress={() => setDetalleItem(null)}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.detailCloseText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },

    loadingContainerSmall: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
    },

    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 14,
    },

    errorBox: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.errorBg,
        alignItems: 'center',
    },

    errorText: {
        color: theme.colors.errorText,
        fontSize: 14,
        textAlign: 'center',
    },

    retryButton: {
        marginTop: theme.spacing.sm,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.errorText,
    },

    retryButtonText: {
        color: theme.colors.errorText,
        fontSize: 13,
        fontWeight: '600',
    },

    messageBox: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.successBg,
    },

    messageText: {
        fontSize: 14,
        color: theme.colors.successText,
        fontWeight: '600',
        textAlign: 'center',
    },

    toolbar: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },

    toolbarButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.inputBg,
    },

    toolbarButtonActivo: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryBg,
    },

    toolbarButtonText: {
        color: theme.colors.textDark,
        fontSize: 13,
        fontWeight: '600',
    },

    toolbarButtonTextActivo: {
        color: theme.colors.primary,
    },

    nuevoButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
    },

    nuevoButtonText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },

    searchWrap: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
    },

    sortWrap: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },

    sortOptions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },

    searchInput: {
        minHeight: 46,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBg,
        paddingHorizontal: 14,
        color: theme.colors.textDark,
        fontSize: 15,
    },

    filtros: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },

    filtro: {
        gap: 6,
    },

    filtroLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textMuted,
    },

    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },

    chip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.inputBg,
    },

    chipActivo: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryBg,
    },

    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textMuted,
    },

    chipTextActivo: {
        color: theme.colors.primary,
    },

    lista: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },

    card: {
        padding: theme.spacing.md,
        borderRadius: 14,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    cardTitle: {
        color: theme.colors.textDark,
        fontSize: 16,
        fontWeight: '700',
    },

    cardLine: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },

    cardLineLabel: {
        color: theme.colors.textMuted,
        fontSize: 13,
        marginRight: 6,
    },

    cardLineValue: {
        flex: 1,
        color: theme.colors.textDark,
        fontSize: 13,
        minWidth: 0,
    },

    cardAcciones: {
        marginTop: theme.spacing.md,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },

    pagination: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },

    pageButton: {
        minWidth: 38,
        minHeight: 38,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        backgroundColor: theme.colors.inputBg,
    },

    pageButtonActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary,
    },

    pageButtonText: {
        color: theme.colors.textDark,
        fontWeight: '600',
    },

    pageButtonTextActive: {
        color: theme.colors.white,
    },

    paginationSummary: {
        width: '100%',
        color: theme.colors.textMuted,
        textAlign: 'center',
        fontSize: 12,
    },

    disabledButton: {
        opacity: 0.45,
    },

    modalBackdrop: {
        flex: 1,
        padding: theme.spacing.md,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },

    detailModal: {
        width: '100%',
        maxHeight: '85%',
        padding: theme.spacing.lg,
        borderRadius: 16,
        backgroundColor: theme.colors.background,
    },

    detailTitle: {
        color: theme.colors.textDark,
        fontSize: 19,
        fontWeight: '700',
        marginBottom: theme.spacing.md,
    },

    detailContent: {
        flexGrow: 0,
    },

    detailRow: {
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },

    detailLabel: {
        marginBottom: 4,
        color: theme.colors.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },

    detailValue: {
        color: theme.colors.textDark,
        fontSize: 14,
    },

    detailCloseButton: {
        marginTop: theme.spacing.md,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
    },

    detailCloseText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },

    actionSmall: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },

    actionEliminar: {
        borderColor: theme.colors.errorText,
    },

    actionSmallText: {
        color: theme.colors.textDark,
        fontSize: 13,
        fontWeight: '600',
    },

    actionEliminarText: {
        color: theme.colors.errorText,
    },

    emptyContainer: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },

    emptyIcon: {
        fontSize: 36,
        marginBottom: theme.spacing.sm,
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
        lineHeight: 20,
        textAlign: 'center',
    },

    header: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
        backgroundColor: theme.colors.primary,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },

    backButton: {
        alignSelf: 'flex-start',
        marginBottom: theme.spacing.md,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },

    backButtonText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '600',
    },

    headerTitle: {
        color: theme.colors.white,
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },

    headerSubtitle: {
        marginTop: theme.spacing.sm,
        color: theme.colors.white,
        fontSize: 13,
        textAlign: 'center',
        opacity: 0.9,
    },

    formContent: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: 60,
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

    labelReq: {
        color: theme.colors.errorText,
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
        minHeight: 110,
        paddingTop: 12,
        paddingBottom: 12,
    },

    fieldError: {
        marginTop: 5,
        fontSize: 12,
        color: theme.colors.errorText,
    },

    helper: {
        marginTop: 5,
        fontSize: 12,
        color: theme.colors.textMuted,
    },

    saveButton: {
        minHeight: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
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