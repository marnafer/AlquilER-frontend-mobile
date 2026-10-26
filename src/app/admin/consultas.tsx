import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import ScreenHeader from '../../components/ScreenHeader';
import {
  eliminarConsultaAdmin,
  listarConsultasAdmin,
  restaurarConsultaAdmin,
} from '../../services/adminService';
import { enviarMensaje, obtenerMensajes } from '../../services/messageService';
import type {
  AdminConsultation,
  AdminMessage,
} from '../../types/admin';
import type { ConversationMessage } from '../../types/conversation';
import { theme } from '../../theme/theme';
import { useAdminAccess } from '../../screens/admin/useAdminAccess';

export default function AdminConsultasScreen() {
  const router = useRouter();
  const { verificando, autorizado } = useAdminAccess();
  const [consultas, setConsultas] = useState<AdminConsultation[]>([]);
  const [consultaActiva, setConsultaActiva] = useState<AdminConsultation | null>(null);
  const [mensajes, setMensajes] = useState<ConversationMessage[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [papelera, setPapelera] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [borrador, setBorrador] = useState('');
  const [mutando, setMutando] = useState(false);
  const [aviso, setAviso] = useState<AdminMessage | null>(null);

  const cargarConsultas = useCallback(async () => {
    if (!autorizado) return;

    setCargando(true);
    try {
      const response = await listarConsultasAdmin(papelera);
      if (!response.success) {
        setConsultas([]);
        setAviso({
          tipo: 'error',
          texto: response.message || response.error || 'No se pudieron cargar las consultas.',
        });
        return;
      }

      setConsultas(response.data.items);
      setConsultaActiva((actual) =>
        actual && response.data.items.some((item) => item.id === actual.id)
          ? actual
          : null
      );
    } catch (error) {
      console.error('No se pudieron cargar las consultas administrativas.', error);
      setConsultas([]);
      setAviso({
        tipo: 'error',
        texto: error instanceof Error ? error.message : 'No se pudieron cargar las consultas.',
      });
    } finally {
      setCargando(false);
    }
  }, [autorizado, papelera]);

  useFocusEffect(
    useCallback(() => {
      void cargarConsultas();
    }, [cargarConsultas])
  );

  useEffect(() => {
    let activo = true;

    const cargarMensajes = async (consultaId: number) => {
      setCargandoMensajes(true);
      try {
        const response = await obtenerMensajes(consultaId, { limite: 100 });
        if (!activo) return;

        if (!response.success) {
          setMensajes([]);
          setAviso({
            tipo: 'error',
            texto: response.message || response.error || 'No se pudieron cargar los mensajes.',
          });
          return;
        }

        setMensajes(response.data.items);
      } catch (error) {
        console.error('No se pudieron cargar los mensajes de la consulta.', error);
        if (activo) {
          setMensajes([]);
          setAviso({
            tipo: 'error',
            texto: error instanceof Error ? error.message : 'No se pudieron cargar los mensajes.',
          });
        }
      } finally {
        if (activo) setCargandoMensajes(false);
      }
    };

    if (consultaActiva) {
      void cargarMensajes(consultaActiva.id);
    } else {
      setMensajes([]);
      setCargandoMensajes(false);
    }

    return () => {
      activo = false;
    };
  }, [consultaActiva]);

  const consultasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase();
    if (!termino) return consultas;

    return consultas.filter((consulta) => {
      const texto = [
        consulta.usuario?.nombre,
        consulta.usuario?.apellido,
        consulta.usuario?.email,
        consulta.propiedad?.titulo,
        consulta.ultimo_mensaje,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      return texto.includes(termino);
    });
  }, [busqueda, consultas]);

  const enviar = async () => {
    const texto = borrador.trim();
    if (!consultaActiva || !texto) return;

    setMutando(true);
    setAviso(null);
    try {
      const response = await enviarMensaje(consultaActiva.id, texto);
      if (!response.success) {
        setAviso({
          tipo: 'error',
          texto: response.message || response.error || 'No se pudo enviar el mensaje.',
        });
        return;
      }

      setMensajes((actuales) => [...actuales, response.data]);
      setBorrador('');
      void cargarConsultas();
      setAviso({ tipo: 'exito', texto: 'Mensaje enviado.' });
    } catch (error) {
      console.error('No se pudo enviar el mensaje administrativo.', error);
      setAviso({
        tipo: 'error',
        texto: error instanceof Error ? error.message : 'No se pudo enviar el mensaje.',
      });
    } finally {
      setMutando(false);
    }
  };

  const ejecutarCambioPapelera = async (
    consulta: AdminConsultation,
    accion: 'eliminar' | 'restaurar'
  ) => {
    setMutando(true);
    setAviso(null);
    try {
      const response = accion === 'eliminar'
        ? await eliminarConsultaAdmin(consulta.id)
        : await restaurarConsultaAdmin(consulta.id);

      if (!response.success) {
        setAviso({
          tipo: 'error',
          texto: response.message || response.error || 'No se pudo actualizar la consulta.',
        });
        return;
      }

      if (consultaActiva?.id === consulta.id) {
        setConsultaActiva(null);
      }
      setAviso({
        tipo: 'exito',
        texto: response.message || (accion === 'eliminar'
          ? 'La consulta se eliminó.'
          : 'La consulta se restauró.'),
      });
      await cargarConsultas();
    } catch (error) {
      console.error('No se pudo actualizar la consulta administrativa.', error);
      setAviso({
        tipo: 'error',
        texto: error instanceof Error ? error.message : 'No se pudo actualizar la consulta.',
      });
    } finally {
      setMutando(false);
    }
  };

  const confirmarEliminacion = (consulta: AdminConsultation) => {
    Alert.alert(
      'Eliminar consulta',
      'La conversación se moverá a la papelera.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => void ejecutarCambioPapelera(consulta, 'eliminar'),
        },
      ]
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
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/admin')}>
          <Text style={styles.buttonText}>Volver al panel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title="Consultas"
        subtitle="Revisá las conversaciones entre usuarios y propietarios."
      />
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.replace('/admin')}
        >
          <Text style={styles.buttonText}>Volver al panel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => {
            setAviso(null);
            setPapelera((actual) => !actual);
          }}
          disabled={mutando}
        >
          <Text style={styles.buttonText}>{papelera ? 'Ver activas' : 'Ver papelera'}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar por usuario, propiedad o mensaje"
        autoCapitalize="none"
      />

      {aviso ? (
        <Text style={[styles.notice, aviso.tipo === 'error' ? styles.error : styles.success]}>
          {aviso.texto}
        </Text>
      ) : null}

      {cargando ? (
        <ActivityIndicator style={styles.loading} size="large" color={theme.colors.primary} />
      ) : consultasFiltradas.length === 0 ? (
        <Text style={styles.muted}>No hay consultas para mostrar.</Text>
      ) : (
        consultasFiltradas.map((consulta) => {
          const nombre = [
            consulta.usuario?.nombre,
            consulta.usuario?.apellido,
          ].filter(Boolean).join(' ') || 'Usuario';

          return (
            <TouchableOpacity
              key={consulta.id}
              style={[
                styles.consultationCard,
                consultaActiva?.id === consulta.id && styles.selectedCard,
              ]}
              onPress={() => setConsultaActiva(consulta)}
              activeOpacity={0.85}
            >
              <Text style={styles.cardTitle}>{consulta.propiedad?.titulo || `Consulta #${consulta.id}`}</Text>
              <Text style={styles.cardLine}>{nombre}{consulta.usuario?.email ? ` · ${consulta.usuario.email}` : ''}</Text>
              <Text style={styles.preview} numberOfLines={2}>
                {consulta.ultimo_mensaje || 'Sin mensajes'}
              </Text>
              <Text style={styles.date}>{consulta.ultima_actividad || consulta.fecha_consulta}</Text>
              <View style={styles.actionRow}>
                {papelera ? (
                  <TouchableOpacity
                    style={[styles.button, styles.restoreButton]}
                    onPress={() => void ejecutarCambioPapelera(consulta, 'restaurar')}
                    disabled={mutando}
                  >
                    <Text style={styles.buttonText}>Restaurar</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={() => confirmarEliminacion(consulta)}
                    disabled={mutando}
                  >
                    <Text style={styles.buttonText}>Eliminar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {consultaActiva && !papelera ? (
        <View style={styles.messagesPanel}>
          <Text style={styles.panelTitle}>
            Conversación · {consultaActiva.propiedad?.titulo || `#${consultaActiva.id}`}
          </Text>
          {cargandoMensajes ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : mensajes.length === 0 ? (
            <Text style={styles.muted}>Todavía no hay mensajes.</Text>
          ) : (
            mensajes.map((mensaje) => (
              <View key={mensaje.id} style={styles.message}>
                <Text style={styles.messageAuthor}>
                  {[mensaje.usuario?.nombre, mensaje.usuario?.apellido].filter(Boolean).join(' ') || 'Usuario'}
                  {' · '}
                  {mensaje.fecha_mensaje}
                </Text>
                <Text style={styles.messageText}>{mensaje.mensaje}</Text>
              </View>
            ))
          )}
          <TextInput
            style={[styles.search, styles.messageInput]}
            value={borrador}
            onChangeText={setBorrador}
            placeholder="Escribí una respuesta"
            multiline
            editable={!mutando}
          />
          <TouchableOpacity
            style={[styles.button, styles.sendButton, (!borrador.trim() || mutando) && styles.disabled]}
            onPress={() => void enviar()}
            disabled={!borrador.trim() || mutando}
          >
            <Text style={styles.buttonText}>{mutando ? 'Enviando...' : 'Enviar mensaje'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
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
  title: { color: theme.colors.textDark, fontSize: 22, fontWeight: '700' },
  muted: { color: theme.colors.textMuted, textAlign: 'center', margin: theme.spacing.md },
  toolbar: { flexDirection: 'row', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  secondaryButton: { backgroundColor: '#64748b' },
  search: {
    margin: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: theme.colors.textDark,
  },
  notice: { marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm },
  error: { color: theme.colors.errorText },
  success: { color: theme.colors.success },
  loading: { margin: theme.spacing.xl },
  consultationCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  selectedCard: { borderColor: theme.colors.primary, borderWidth: 2 },
  cardTitle: { color: theme.colors.textDark, fontWeight: '700', fontSize: 16 },
  cardLine: { color: theme.colors.textMuted, marginTop: 4 },
  preview: { color: theme.colors.textDark, marginTop: theme.spacing.sm },
  date: { color: theme.colors.textMuted, fontSize: 12, marginTop: theme.spacing.sm },
  actionRow: { flexDirection: 'row', marginTop: theme.spacing.sm },
  deleteButton: { backgroundColor: theme.colors.danger },
  restoreButton: { backgroundColor: theme.colors.success },
  messagesPanel: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    gap: theme.spacing.sm,
  },
  panelTitle: { color: theme.colors.textDark, fontSize: 16, fontWeight: '700' },
  message: { padding: theme.spacing.sm, borderRadius: 8, backgroundColor: theme.colors.inputBg },
  messageAuthor: { color: theme.colors.textMuted, fontSize: 12, marginBottom: 4 },
  messageText: { color: theme.colors.textDark },
  messageInput: { marginHorizontal: 0, minHeight: 80, textAlignVertical: 'top' },
  sendButton: { alignSelf: 'flex-end' },
  disabled: { opacity: 0.5 },
});
