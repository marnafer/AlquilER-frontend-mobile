import type {
  AdminField,
  AdminModuleConfig,
  AdminModuleKey,
  AdminModuleLink,
  AdminOption,
} from '../types/admin';

const estadosReserva: AdminOption[] = [
  { id: 'pendiente', nombre: 'Pendiente' },
  { id: 'confirmada', nombre: 'Confirmada' },
  { id: 'rechazada', nombre: 'Rechazada' },
  { id: 'finalizada', nombre: 'Finalizada' },
  { id: 'cancelada', nombre: 'Cancelada' },
];

const estadosReservaCrear: AdminOption[] = estadosReserva.slice(0, 2);
const siNo: AdminOption[] = [
  { id: 1, nombre: 'Sí' },
  { id: 0, nombre: 'No' },
];

const camposNombre: AdminField[] = [
  {
    name: 'nombre',
    label: 'Nombre',
    tipo: 'text',
    requerido: true,
    min: 3,
    max: 100,
  },
];

export const MODULOS: AdminModuleLink[] = [
  { clave: 'usuarios', emoji: '👥', titulo: 'Usuarios', desc: 'Cuentas registradas en el sistema.' },
  { clave: 'categorias', emoji: '🏷️', titulo: 'Categorías', desc: 'Tipos de propiedades.' },
  { clave: 'provincias', emoji: '🗺️', titulo: 'Provincias', desc: 'Provincias disponibles.' },
  { clave: 'localidades', emoji: '📍', titulo: 'Localidades', desc: 'Ciudades de cada provincia.' },
  { clave: 'roles', emoji: '🛡️', titulo: 'Roles', desc: 'Roles del sistema.' },
  { clave: 'servicios', emoji: '🔧', titulo: 'Servicios', desc: 'Servicios de las propiedades.' },
  { clave: 'resenas', emoji: '⭐', titulo: 'Reseñas', desc: 'Reseñas de propiedades e inquilinos.' },
  { clave: 'reservas', emoji: '📅', titulo: 'Reservas', desc: 'Reservas y su estado de alquiler.' },
  { clave: 'consultas', emoji: '💬', titulo: 'Consultas', desc: 'Consultas de los interesados.' },
  { clave: 'logs', emoji: '🕐', titulo: 'Registros', desc: 'Actividad de los usuarios.' },
  { clave: 'propiedades', emoji: '🏢', titulo: 'Propiedades', desc: 'Todas las propiedades del sistema.' },
];

const configuraciones: Record<Exclude<AdminModuleKey, 'consultas'>, AdminModuleConfig> = {
  usuarios: {
    clave: 'usuarios',
    titulo: 'Usuarios',
    descripcion: 'Gestioná las cuentas registradas en el sistema.',
    recurso: '/usuarios',
    papelera: true,
    permiteCrear: true,
    columnas: [
      { key: 'id', label: 'ID' },
      { key: 'nombreCompleto', label: 'Nombre', render: (item) => `${item.nombre ?? ''} ${item.apellido ?? ''}`.trim() },
      { key: 'email', label: 'Email' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'rol.nombre', label: 'Rol' },
    ],
    campos: [
      { name: 'nombre', label: 'Nombre', tipo: 'text', requerido: true, min: 2, max: 50 },
      { name: 'apellido', label: 'Apellido', tipo: 'text', requerido: true, min: 2, max: 50 },
      { name: 'email', label: 'Email', tipo: 'email', requerido: true, max: 100 },
      { name: 'telefono', label: 'Teléfono', tipo: 'text', requerido: true, min: 6, max: 15 },
      { name: 'domicilio', label: 'Domicilio', tipo: 'text', requerido: true, min: 5, max: 100 },
      { name: 'contrasena', label: 'Contraseña', tipo: 'password', requerido: true, min: 6, max: 255, soloCrear: true },
      { name: 'rol_id', label: 'Rol', tipo: 'select', opciones: 'roles', requerido: true, soloCrear: true },
    ],
  },
  categorias: {
    clave: 'categorias',
    titulo: 'Categorías',
    descripcion: 'Gestioná las categorías de propiedades publicadas.',
    recurso: '/categorias',
    papelera: true,
    permiteCrear: true,
    columnas: [{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }],
    campos: camposNombre,
  },
  provincias: {
    clave: 'provincias',
    titulo: 'Provincias',
    descripcion: 'Gestioná las provincias del catálogo.',
    recurso: '/provincias',
    papelera: true,
    permiteCrear: true,
    columnas: [{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }],
    campos: [{ ...camposNombre[0], max: 100 }],
  },
  localidades: {
    clave: 'localidades',
    titulo: 'Localidades',
    descripcion: 'Gestioná las localidades y su provincia asociada.',
    recurso: '/localidades',
    papelera: true,
    permiteCrear: true,
    columnas: [
      { key: 'id', label: 'ID' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'codigo_postal', label: 'C.P.' },
      { key: 'provincia.nombre', label: 'Provincia' },
    ],
    campos: [
      { name: 'nombre', label: 'Nombre', tipo: 'text', requerido: true, min: 2, max: 100 },
      { name: 'codigo_postal', label: 'Código postal', tipo: 'text', requerido: true, min: 2, max: 15 },
      { name: 'provincia_id', label: 'Provincia', tipo: 'select', opciones: 'provincias', requerido: true },
    ],
  },
  roles: {
    clave: 'roles',
    titulo: 'Roles',
    descripcion: 'Gestioná los roles del sistema.',
    recurso: '/roles',
    papelera: true,
    permiteCrear: true,
    columnas: [{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }],
    campos: [{ ...camposNombre[0], max: 30 }],
  },
  servicios: {
    clave: 'servicios',
    titulo: 'Servicios',
    descripcion: 'Gestioná los servicios disponibles para las propiedades.',
    recurso: '/servicios',
    papelera: true,
    permiteCrear: true,
    columnas: [{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }],
    campos: [{ ...camposNombre[0], max: 50 }],
  },
  resenas: {
    clave: 'resenas',
    titulo: 'Reseñas',
    descripcion: 'Moderá las reseñas publicadas sobre propiedades e inquilinos.',
    recurso: '/resenas',
    papelera: true,
    permiteCrear: true,
    filtros: [
      {
        name: 'tipo',
        label: 'Tipo',
        tipo: 'select',
        opciones: [
          { id: 'propiedad', nombre: 'Propiedad' },
          { id: 'inquilino', nombre: 'Inquilino' },
        ],
      },
      {
        name: 'calificacion',
        label: 'Calificación',
        tipo: 'select',
        opciones: [5, 4, 3, 2, 1].map((rating) => ({
          id: rating,
          nombre: `${rating} ${rating === 1 ? 'estrella' : 'estrellas'}`,
        })),
      },
      { name: 'fecha_desde', label: 'Desde', tipo: 'date' },
      { name: 'fecha_hasta', label: 'Hasta', tipo: 'date' },
    ],
    columnas: [
      { key: 'id', label: 'ID' },
      { key: 'tipo', label: 'Tipo', render: (item) => item.tipo === 'propiedad' ? 'Propiedad' : 'Inquilino' },
      { key: 'calificacion', label: 'Calificación', render: (item) => `${item.calificacion ?? '—'} ★` },
      { key: 'comentario', label: 'Comentario' },
      { key: 'calificador.nombre', label: 'Calificador' },
      { key: 'fecha_publicacion', label: 'Fecha' },
    ],
    campos: [
      { name: 'reserva_id', label: 'Reserva finalizada', tipo: 'select', opciones: 'reservas', requerido: true, soloCrear: true },
      { name: 'calificador_id', label: 'Calificador', tipo: 'select', opciones: 'usuarios', requerido: true, soloCrear: true },
      { name: 'calificacion', label: 'Calificación (1 a 5)', tipo: 'number', requerido: true, min: 1, max: 5 },
      { name: 'comentario', label: 'Comentario', tipo: 'textarea', min: 3, max: 1000 },
    ],
  },
  reservas: {
    clave: 'reservas',
    titulo: 'Reservas',
    descripcion: 'Gestioná las reservas, sus estados y las solicitudes eliminadas.',
    recurso: '/reservas',
    papelera: true,
    permiteCrear: true,
    acciones: [
      { label: 'Confirmar', accion: 'confirmar', estadosPermitidos: ['pendiente'], color: '#16a34a' },
      { label: 'Rechazar', accion: 'rechazar', estadosPermitidos: ['pendiente'], color: '#dc2626' },
      { label: 'Finalizar', accion: 'finalizar', estadosPermitidos: ['confirmada'], color: '#2563eb' },
      { label: 'Cancelar', accion: 'cancelar', estadosPermitidos: ['pendiente', 'confirmada'], color: '#64748b' },
    ],
    columnas: [
      { key: 'id', label: 'ID' },
      { key: 'propiedad.titulo', label: 'Propiedad' },
      { key: 'usuario.nombre', label: 'Inquilino' },
      { key: 'fecha_inicio_alquiler', label: 'Inicio' },
      { key: 'fecha_fin_alquiler', label: 'Fin' },
      { key: 'estado', label: 'Estado' },
    ],
    campos: [
      { name: 'usuario_id', label: 'Inquilino', tipo: 'select', opciones: 'usuarios', requerido: true, soloCrear: true },
      { name: 'propiedad_id', label: 'Propiedad disponible', tipo: 'select', opciones: 'propiedades', requerido: true, soloCrear: true },
      { name: 'fecha_inicio_alquiler', label: 'Inicio del alquiler', tipo: 'date', requerido: true, soloCrear: true },
      { name: 'fecha_fin_alquiler', label: 'Fin del alquiler', tipo: 'date', requerido: true, soloCrear: true },
      { name: 'estado', label: 'Estado inicial', tipo: 'select', opciones: estadosReservaCrear, requerido: true, soloCrear: true },
    ],
  },
  logs: {
    clave: 'logs',
    titulo: 'Registros de actividad',
    descripcion: 'Actividad reciente registrada en el sistema.',
    recurso: '/logs-actividad',
    soloLectura: true,
    columnas: [
      { key: 'id', label: 'ID' },
      { key: 'usuario_nombre', label: 'Usuario' },
      { key: 'accion', label: 'Acción' },
      { key: 'ip_address', label: 'IP' },
      { key: 'fecha', label: 'Fecha' },
    ],
    campos: [],
  },
  propiedades: {
    clave: 'propiedades',
    titulo: 'Propiedades',
    descripcion: 'Administrá el catálogo de propiedades.',
    recurso: '/admin/propiedades',
    papelera: true,
    columnas: [
      { key: 'id', label: 'ID' },
      { key: 'titulo', label: 'Título' },
      { key: 'precio', label: 'Precio' },
      { key: 'disponible', label: 'Disponible', render: (item) => Number(item.disponible) === 1 ? 'Sí' : 'No' },
      { key: 'destacada', label: 'Destacada', render: (item) => Number(item.destacada) === 1 ? 'Sí' : 'No' },
      { key: 'usuario.nombre', label: 'Propietario' },
    ],
    campos: [
      { name: 'titulo', label: 'Título', tipo: 'text', requerido: true, min: 3, max: 120 },
      { name: 'direccion', label: 'Dirección', tipo: 'text', requerido: true, min: 4, max: 200 },
      { name: 'precio', label: 'Precio mensual', tipo: 'number', requerido: true, min: 1 },
      { name: 'disponible', label: 'Disponible', tipo: 'select', opciones: siNo, requerido: true },
      { name: 'destacada', label: 'Destacada', tipo: 'select', opciones: siNo, requerido: true },
    ],
  },
};

export const CONFIGURACIONES: Record<AdminModuleKey, AdminModuleConfig | null> = {
  ...configuraciones,
  consultas: null,
};

export function obtenerConfiguracionAdmin(
  clave: string
): AdminModuleConfig | null {
  if (!Object.prototype.hasOwnProperty.call(CONFIGURACIONES, clave)) {
    return null;
  }

  return CONFIGURACIONES[clave as AdminModuleKey];
}

export const OPCIONES_BOOLEANAS = siNo;
