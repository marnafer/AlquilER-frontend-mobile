import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import PropertySelect from '../../components/PropertySelect';
import ScreenHeader from '../../components/ScreenHeader';
import {
  actualizarRecursoAdmin,
  cambiarEstadoReservaAdmin,
  crearRecursoAdmin,
  eliminarRecursoAdmin,
  listarRecursosAdmin,
  restaurarRecursoAdmin,
} from '../../services/adminService';
import { obtenerConfiguracionAdmin } from '../../services/adminConfig';
import type {
  AdminField,
  AdminJsonValue,
  AdminModuleKey,
  AdminOption,
  AdminRecord,
} from '../../types/admin';
import { theme } from '../../theme/theme';
import { useAdminAccess } from '../../screens/admin/useAdminAccess';

type AdminResourceKey = Exclude<AdminModuleKey, 'consultas'>;
type AdminManageKey = Exclude<AdminModuleKey, 'consultas' | 'logs'>;
type AdminCreateKey = Exclude<AdminModuleKey, 'consultas' | 'logs' | 'propiedades'>;
type FormMode = 'crear' | 'editar';
type Notice = { type: 'success' | 'error'; text: string };

function isResourceKey(key: AdminModuleKey): key is AdminResourceKey {
  return key !== 'consultas';
}

function isCreateKey(key: AdminResourceKey): key is AdminCreateKey {
  return key !== 'logs' && key !== 'propiedades';
}

function isManageKey(key: AdminResourceKey): key is AdminManageKey {
  return key !== 'logs';
}

function isOptionList(
  options: AdminField['opciones']
): options is readonly AdminOption[] {
  return Array.isArray(options);
}

function readPath(record: AdminRecord, path: string): AdminJsonValue | undefined {
  let value: AdminJsonValue | undefined = record;

  for (const segment of path.split('.')) {
    if (
      value === null ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return undefined;
    }
    value = value[segment];
  }

  return value;
}

function displayValue(value: AdminJsonValue | undefined): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  if (Array.isArray(value)) {
    return value.map((entry) => displayValue(entry)).join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function recordId(record: AdminRecord): number | null {
  const id = record.id;
  const parsed = typeof id === 'number' ? id : Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function optionFromRecord(record: AdminRecord): AdminOption | null {
  const id = recordId(record);
  if (id === null) {
    return null;
  }

  const parts = [
    readPath(record, 'nombre'),
    readPath(record, 'apellido'),
    readPath(record, 'titulo'),
    readPath(record, 'email'),
  ]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .slice(0, 3);

  return {
    id,
    nombre: parts.join(' ').trim() || `#${id}`,
  };
}

function getFieldOptions(
  field: AdminField,
  dynamicOptions: Record<string, AdminOption[]>
): AdminOption[] {
  if (isOptionList(field.opciones)) {
    return [...field.opciones];
  }

  if (field.opciones) {
    return dynamicOptions[field.opciones] ?? [];
  }

  return [];
}

function Button({
  label,
  onPress,
  color = theme.colors.primary,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color }, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AdminResourceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ modulo?: string | string[] }>();
  const { verificando, autorizado } = useAdminAccess();
  const moduloParam = Array.isArray(params.modulo) ? params.modulo[0] : params.modulo;
  const config = useMemo(
    () => obtenerConfiguracionAdmin(moduloParam ?? ''),
    [moduloParam]
  );
  const modulo = config && isResourceKey(config.clave) ? config.clave : null;

  const [items, setItems] = useState<AdminRecord[]>([]);
  const [cargando, setCargando] = useState(true);
  const [papelera, setPapelera] = useState(false);
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [filtrosAplicados, setFiltrosAplicados] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<Notice | null>(null);
  const [modo, setModo] = useState<FormMode>('crear');
  const [registroActivo, setRegistroActivo] = useState<AdminRecord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [opcionesDinamicas, setOpcionesDinamicas] = useState<
    Record<string, AdminOption[]>
  >({});
  const [errorFormulario, setErrorFormulario] = useState('');
  const [mutando, setMutando] = useState(false);

  const camposFormulario = useMemo(
    () =>
      (config?.campos ?? []).filter((field) => {
        if (modo === 'crear' && field.soloEditar) return false;
        if (modo === 'editar' && field.soloCrear) return false;
        return true;
      }),
    [config, modo]
  );

  const cargar = useCallback(async () => {
    if (!autorizado || !modulo) {
      return;
    }

    setCargando(true);
    try {
      const response = await listarRecursosAdmin(modulo, papelera, filtrosAplicados);

      if (!response.success) {
        setItems([]);
        setAviso({
          type: 'error',
          text: response.message || response.error || 'No se pudo cargar el listado.',
        });
        return;
      }

      setItems(response.data.items);
    } catch (error) {
      console.error(`No se pudo cargar el módulo administrativo "${modulo}".`, error);
      setItems([]);
      setAviso({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo cargar el listado.',
      });
    } finally {
      setCargando(false);
    }
  }, [autorizado, filtrosAplicados, modulo, papelera]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar])
  );

  useEffect(() => {
    let activo = true;

    const cargarOpciones = async () => {
      if (!modalVisible) {
        setOpcionesDinamicas({});
        return;
      }

      const modulos = [
        ...new Set(
          camposFormulario
            .map((field) =>
              typeof field.opciones === 'string' ? field.opciones : null
            )
            .filter(
              (value): value is AdminResourceKey =>
                value !== null && value !== 'consultas'
            )
        ),
      ];

      try {
        const resultados = await Promise.all(
          modulos.map(async (key) => {
            const response = await listarRecursosAdmin(key, false);
            if (!response.success) {
              throw new Error(
                response.message || response.error || `No se pudieron cargar ${key}.`
              );
            }

            const records = response.data.items.filter((record) => {
              if (key === 'propiedades') {
                return Number(record.disponible) === 1;
              }
              if (key === 'reservas') {
                return record.estado === 'finalizada';
              }
              if (key === 'roles') {
                return Number(record.id) === 1 || Number(record.id) === 2;
              }
              return true;
            });

            return [key, records.map(optionFromRecord).filter(
              (option): option is AdminOption => option !== null
            )] as const;
          })
        );

        if (activo) {
          setOpcionesDinamicas(Object.fromEntries(resultados));
        }
      } catch (error) {
        console.error('No se pudieron cargar las opciones del formulario admin.', error);
        if (activo) {
          setErrorFormulario(
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar las opciones necesarias.'
          );
        }
      }
    };

    void cargarOpciones();

    return () => {
      activo = false;
    };
  }, [camposFormulario, modalVisible]);

  const abrirCrear = () => {
    setModo('crear');
    setRegistroActivo(null);
    setValores({});
    setErrorFormulario('');
    setModalVisible(true);
  };

  const abrirEditar = (record: AdminRecord) => {
    setModo('editar');
    setRegistroActivo(record);
    setErrorFormulario('');
    const nextValues: Record<string, string> = {};
    for (const field of config?.campos ?? []) {
      const value = readPath(record, field.name);
      if (value !== undefined && value !== null) {
        nextValues[field.name] = String(value);
      }
    }
    setValores(nextValues);
    setModalVisible(true);
  };

  const guardar = async () => {
    if (!config || !modulo) {
      return;
    }

    const data: AdminRecord = {};
    for (const field of camposFormulario) {
      const rawValue = valores[field.name]?.trim() ?? '';
      if (field.requerido && !rawValue) {
        setErrorFormulario(`El campo "${field.label}" es obligatorio.`);
        return;
      }
      if (!rawValue) {
        continue;
      }
      if (field.min !== undefined && rawValue.length < field.min && field.tipo !== 'number') {
        setErrorFormulario(`"${field.label}" debe tener al menos ${field.min} caracteres.`);
        return;
      }
      if (field.max !== undefined && rawValue.length > field.max && field.tipo !== 'number') {
        setErrorFormulario(`"${field.label}" no puede superar ${field.max} caracteres.`);
        return;
      }

      if (field.tipo === 'number') {
        const numberValue = Number(rawValue);
        if (
          !Number.isFinite(numberValue) ||
          (field.min !== undefined && numberValue < field.min) ||
          (field.max !== undefined && numberValue > field.max)
        ) {
          setErrorFormulario(`Ingresá un valor válido para "${field.label}".`);
          return;
        }
        data[field.name] = numberValue;
      } else if (field.tipo === 'select') {
        const option = getFieldOptions(field, opcionesDinamicas).find(
          (item) => String(item.id) === rawValue
        );
        data[field.name] = option?.id ?? rawValue;
      } else {
        data[field.name] = rawValue;
      }
    }

    setMutando(true);
    setErrorFormulario('');
    try {
      let response;
      if (modo === 'crear') {
        if (!config.permiteCrear || !isCreateKey(modulo)) {
          return;
        }
        response = await crearRecursoAdmin(modulo, data);
      } else {
        if (!isManageKey(modulo)) {
          setErrorFormulario('Este módulo no permite editar registros.');
          return;
        }
        const id = registroActivo ? recordId(registroActivo) : null;
        if (id === null) {
          setErrorFormulario('No se pudo identificar el registro para actualizar.');
          return;
        }
        response = await actualizarRecursoAdmin(modulo, id, data);
      }

      if (!response.success) {
        setErrorFormulario(
          response.message || response.error || 'No se pudo guardar el registro.'
        );
        return;
      }

      setModalVisible(false);
      setAviso({
        type: 'success',
        text: response.message || 'Los cambios se guardaron correctamente.',
      });
      await cargar();
    } catch (error) {
      console.error('No se pudo guardar el recurso administrativo.', error);
      setErrorFormulario(
        error instanceof Error ? error.message : 'No se pudo guardar el registro.'
      );
    } finally {
      setMutando(false);
    }
  };

  const confirmarEliminacion = (record: AdminRecord) => {
    if (!modulo || !isManageKey(modulo)) return;
    const id = recordId(record);
    if (id === null) {
      setAviso({ type: 'error', text: 'No se pudo identificar el registro.' });
      return;
    }

    Alert.alert(
      'Eliminar registro',
      'El registro se moverá a la papelera.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => void ejecutarMutacion(
            () => eliminarRecursoAdmin(modulo, id),
            'El registro se eliminó correctamente.'
          ),
        },
      ]
    );
  };

  const restaurar = (record: AdminRecord) => {
    if (!modulo || !isManageKey(modulo)) return;
    const id = recordId(record);
    if (id === null) {
      setAviso({ type: 'error', text: 'No se pudo identificar el registro.' });
      return;
    }
    void ejecutarMutacion(
      () => restaurarRecursoAdmin(modulo, id),
      'El registro se restauró correctamente.'
    );
  };

  const ejecutarMutacion = async (
    action: () => ReturnType<typeof eliminarRecursoAdmin>,
    successText: string
  ) => {
    setMutando(true);
    setAviso(null);
    try {
      const response = await action();
      if (!response.success) {
        setAviso({
          type: 'error',
          text: response.message || response.error || 'No se pudo completar la acción.',
        });
        return;
      }
      setAviso({ type: 'success', text: response.message || successText });
      await cargar();
    } catch (error) {
      console.error('Falló una acción del panel administrativo.', error);
      setAviso({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo completar la acción.',
      });
    } finally {
      setMutando(false);
    }
  };

  const cambiarEstado = (record: AdminRecord, accion: 'confirmar' | 'rechazar' | 'finalizar' | 'cancelar') => {
    if (!modulo || modulo !== 'reservas') return;
    const id = recordId(record);
    if (id === null) {
      setAviso({ type: 'error', text: 'No se pudo identificar la reserva.' });
      return;
    }
    void ejecutarMutacion(
      () => cambiarEstadoReservaAdmin(id, accion),
      'El estado de la reserva se actualizó correctamente.'
    );
  };

  if (verificando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.muted}>Verificando acceso...</Text>
      </View>
    );
  }

  if (!autorizado) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Acceso restringido</Text>
        <Text style={styles.muted}>Necesitás permisos de administración para ver esta pantalla.</Text>
        <Button label="Volver" onPress={() => router.replace('/admin')} />
      </View>
    );
  }

  if (!config || !modulo) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Módulo no encontrado</Text>
        <Button label="Volver al panel" onPress={() => router.replace('/admin')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          title={config.titulo}
          subtitle={config.descripcion}
        />
        <View style={styles.toolbar}>
          <Button label="Volver al panel" onPress={() => router.replace('/admin')} color="#475569" />
          {config.permiteCrear && isCreateKey(modulo) ? (
            <Button label="Crear" onPress={abrirCrear} disabled={mutando} />
          ) : null}
          {config.papelera ? (
            <Button
              label={papelera ? 'Ver activos' : 'Ver papelera'}
              onPress={() => {
                setAviso(null);
                setPapelera((value) => !value);
              }}
              color={papelera ? '#475569' : '#64748b'}
              disabled={mutando}
            />
          ) : null}
        </View>

        {config.filtros?.length ? (
          <View style={styles.filterPanel}>
            <Text style={styles.sectionTitle}>Filtros</Text>
            {config.filtros.map((field) => (
              field.tipo === 'select' ? (
                <PropertySelect
                  key={field.name}
                  label={field.label}
                  options={getFieldOptions(field, opcionesDinamicas)}
                  value={filtros[field.name] ?? null}
                  onChange={(value) => setFiltros((current) => ({ ...current, [field.name]: value }))}
                />
              ) : (
                <View key={field.name} style={styles.field}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    value={filtros[field.name] ?? ''}
                    onChangeText={(value) => setFiltros((current) => ({ ...current, [field.name]: value }))}
                    placeholder={field.placeholder ?? field.label}
                    style={styles.input}
                  />
                </View>
              )
            ))}
            <View style={styles.buttonRow}>
              <Button
                label="Aplicar filtros"
                onPress={() => {
                  setAviso(null);
                  setFiltrosAplicados(
                    Object.fromEntries(
                      Object.entries(filtros).filter(([, value]) => value !== '')
                    )
                  );
                }}
                disabled={mutando}
              />
              <Button
                label="Limpiar"
                onPress={() => {
                  setAviso(null);
                  setFiltros({});
                  setFiltrosAplicados({});
                }}
                color="#64748b"
                disabled={mutando}
              />
            </View>
          </View>
        ) : null}

        {aviso ? (
          <Text style={[styles.notice, aviso.type === 'error' ? styles.errorText : styles.successText]}>
            {aviso.text}
          </Text>
        ) : null}

        {cargando ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <Text style={styles.empty}>No hay registros para mostrar.</Text>
        ) : (
          items.map((record, index) => (
            <View key={String(record.id ?? index)} style={styles.recordCard}>
              {config.columnas.map((column) => (
                <View key={column.key} style={styles.recordRow}>
                  <Text style={styles.recordLabel}>{column.label}</Text>
                  <Text style={styles.recordValue}>
                    {column.render
                      ? column.render(record)
                      : displayValue(readPath(record, column.key))}
                  </Text>
                </View>
              ))}
              {!config.soloLectura && !papelera ? (
                <View style={styles.buttonRow}>
                  {config.campos.some((field) => !field.soloCrear) ? (
                    <Button
                      label="Editar"
                      onPress={() => abrirEditar(record)}
                      color="#475569"
                      disabled={mutando}
                    />
                  ) : null}
                  {config.acciones?.map((action) =>
                    action.estadosPermitidos.includes(String(record.estado)) ? (
                      <Button
                        key={action.accion}
                        label={action.label}
                        onPress={() => cambiarEstado(record, action.accion)}
                        color={action.color}
                        disabled={mutando}
                      />
                    ) : null
                  )}
                  {config.papelera ? (
                    <Button
                      label="Eliminar"
                      onPress={() => confirmarEliminacion(record)}
                      color={theme.colors.danger}
                      disabled={mutando}
                    />
                  ) : null}
                </View>
              ) : null}
              {papelera && !config.soloLectura ? (
                <Button
                  label="Restaurar"
                  onPress={() => restaurar(record)}
                  color={theme.colors.success}
                  disabled={mutando}
                />
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{modo === 'crear' ? 'Crear registro' : 'Editar registro'}</Text>
            {camposFormulario.map((field) => (
              <View key={`${field.name}-${field.soloEditar ? 'edit' : 'create'}`} style={styles.field}>
                {field.tipo === 'select' ? (
                  <PropertySelect
                    label={field.label}
                    options={getFieldOptions(field, opcionesDinamicas)}
                    value={valores[field.name] ?? null}
                    onChange={(value) =>
                      setValores((current) => ({ ...current, [field.name]: value }))
                    }
                    placeholder={`Seleccioná ${field.label.toLowerCase()}`}
                  />
                ) : (
                  <>
                    <Text style={styles.label}>{field.label}{field.requerido ? ' *' : ''}</Text>
                    <TextInput
                      value={valores[field.name] ?? ''}
                      onChangeText={(value) =>
                        setValores((current) => ({ ...current, [field.name]: value }))
                      }
                      placeholder={field.placeholder ?? field.label}
                      style={[styles.input, field.tipo === 'textarea' && styles.textarea]}
                      keyboardType={
                        field.tipo === 'number'
                          ? 'numeric'
                          : field.tipo === 'email'
                            ? 'email-address'
                            : 'default'
                      }
                      secureTextEntry={field.tipo === 'password'}
                      multiline={field.tipo === 'textarea'}
                      autoCapitalize={field.tipo === 'email' ? 'none' : 'sentences'}
                    />
                  </>
                )}
              </View>
            ))}
            {errorFormulario ? <Text style={styles.errorText}>{errorFormulario}</Text> : null}
            <View style={styles.buttonRow}>
              <Button label="Guardar" onPress={() => void guardar()} disabled={mutando} />
              <Button
                label="Cancelar"
                onPress={() => setModalVisible(false)}
                color="#64748b"
                disabled={mutando}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 120 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  loading: { padding: theme.spacing.xl, alignItems: 'center' },
  muted: { color: theme.colors.textMuted, textAlign: 'center' },
  title: { color: theme.colors.textDark, fontSize: 22, fontWeight: '700' },
  toolbar: {
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  filterPanel: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    gap: theme.spacing.sm,
  },
  sectionTitle: { color: theme.colors.textDark, fontSize: 16, fontWeight: '700' },
  field: { marginBottom: theme.spacing.md, gap: theme.spacing.sm },
  label: { color: theme.colors.textDark, fontWeight: '600', fontSize: 14 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.textDark,
    backgroundColor: '#fff',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  notice: { marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.md, fontSize: 14 },
  errorText: { color: theme.colors.errorText },
  successText: { color: theme.colors.success },
  empty: { textAlign: 'center', color: theme.colors.textMuted, marginTop: theme.spacing.xl },
  recordCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBg,
    gap: theme.spacing.sm,
  },
  recordRow: { flexDirection: 'row', gap: theme.spacing.sm },
  recordLabel: { flex: 1, color: theme.colors.textMuted, fontWeight: '600' },
  recordValue: { flex: 2, color: theme.colors.textDark },
  modalRoot: { flex: 1, backgroundColor: theme.colors.background },
  modalContent: { padding: theme.spacing.lg, paddingBottom: 48 },
});
