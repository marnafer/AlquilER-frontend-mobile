import {
    actualizarRecurso,
    aprobarReserva,
    cancelarReserva,
    crearRecurso,
    eliminarRecurso,
    finalizarReserva,
    obtenerRecurso,
    rechazarReserva,
    restaurarRecurso,
    separarReservas,
} from '../services/api';

export const MODULOS = [
    {
        clave: 'usuarios',
        emoji: '👥',
        titulo: 'Usuarios',
        desc: 'Cuentas registradas en el sistema.',
    },
    {
        clave: 'categorias',
        emoji: '🏷️',
        titulo: 'Categorías',
        desc: 'Tipos de propiedades.',
    },
    {
        clave: 'provincias',
        emoji: '🗺️',
        titulo: 'Provincias',
        desc: 'Provincias disponibles.',
    },
    {
        clave: 'localidades',
        emoji: '📍',
        titulo: 'Localidades',
        desc: 'Ciudades de cada provincia.',
    },
    {
        clave: 'roles',
        emoji: '🛡️',
        titulo: 'Roles',
        desc: 'Roles del sistema.',
    },
    {
        clave: 'servicios',
        emoji: '🔧',
        titulo: 'Servicios',
        desc: 'Servicios de las propiedades.',
    },
    {
        clave: 'resenas',
        emoji: '⭐',
        titulo: 'Reseñas',
        desc: 'Reseñas de propiedades e inquilinos.',
    },
    {
        clave: 'reservas',
        emoji: '📅',
        titulo: 'Reservas',
        desc: 'Reservas y su estado de alquiler.',
    },
    {
        clave: 'consultas',
        emoji: '💬',
        titulo: 'Consultas',
        desc: 'Consultas de los interesados.',
    },
    {
        clave: 'logs',
        emoji: '🕐',
        titulo: 'Registros',
        desc: 'Actividad de los usuarios.',
    },
    {
        clave: 'propiedades',
        emoji: '🏢',
        titulo: 'Propiedades',
        desc: 'Todas las propiedades del sistema.',
    },
];

const ESTADOS_RESERVA = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'confirmada', label: 'Confirmada' },
    { value: 'rechazada', label: 'Rechazada' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'cancelada', label: 'Cancelada' },
];

const ESTADOS_RESERVA_CREAR = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'confirmada', label: 'Confirmada' },
];

const TRANSICIONES = {
    pendiente: ['pendiente', 'confirmada', 'rechazada', 'cancelada'],
    confirmada: ['confirmada', 'finalizada', 'cancelada'],
    rechazada: ['rechazada'],
    finalizada: ['finalizada'],
    cancelada: ['cancelada'],
};

const COLORES_ESTADO_RESERVA = {
    pendiente: '#d97706',
    confirmada: '#16a34a',
    rechazada: '#dc2626',
    finalizada: '#2563eb',
    cancelada: '#64748b',
};

const COLORES_DISPONIBILIDAD = {
    1: '#16a34a',
    0: '#dc2626',
};

const COLORES_DESTACADA = {
    1: '#7c3aed',
    0: '#94a3b8',
};

const opcionesEstadoReserva = (item) => {
    const permitidos =
        TRANSICIONES[item?.estado] || [item?.estado].filter(Boolean);

    return ESTADOS_RESERVA.filter((e) =>
        permitidos.includes(e.value)
    );
};

const nombreRol = (rolId, externos) => {
    const rol = (externos?.roles || []).find(
        (r) => String(r.id) === String(rolId)
    );

    return rol ? rol.nombre : `#${rolId}`;
};

const configUsuarios = {
    clave: 'usuarios',
    titulo: 'Usuarios',
    descripcion:
        'Gestioná las cuentas registradas en el sistema.',
    principal: 'nombre',
    ruta: '/usuarios',
    papelera: true,
    obtener: ({ papelera, filtros = {} }) =>
        obtenerRecurso('/usuarios', {
            solo_eliminados: papelera ? 1 : 0,
            ...filtros,
        }),
    crear: (data) => crearRecurso('/admin/usuarios', data),
    actualizar: (id, data) =>
        actualizarRecurso('/usuarios', id, data),
    eliminar: (id) => eliminarRecurso('/usuarios', id),
    restaurar: (id) => restaurarRecurso('/usuarios', id),
    externos: [{ clave: 'roles', cargar: () => obtenerRecurso('/roles') }],
    columnas: [
        { key: 'id', label: 'ID' },
        {
            key: 'nombre',
            label: 'Nombre',
            render: (item) =>
                `${item.nombre ?? ''} ${item.apellido ?? ''}`.trim(),
        },
        { key: 'email', label: 'Email' },
        { key: 'telefono', label: 'Teléfono' },
        {
            key: 'rol_id',
            label: 'Rol',
            render: (item, externos) =>
                nombreRol(item.rol_id, externos),
        },
    ],
    campos: [
        {
            name: 'nombre',
            label: 'Nombre',
            tipo: 'text',
            requerido: true,
            min: 2,
            max: 50,
            placeholder: 'Juan',
        },
        {
            name: 'apellido',
            label: 'Apellido',
            tipo: 'text',
            requerido: true,
            min: 2,
            max: 50,
            placeholder: 'Pérez',
        },
        {
            name: 'email',
            label: 'Email',
            tipo: 'email',
            requerido: true,
            max: 100,
            placeholder: 'juan@mail.com',
        },
        {
            name: 'telefono',
            label: 'Teléfono',
            tipo: 'text',
            requerido: true,
            min: 6,
            max: 15,
            placeholder: '3434556677',
        },
        {
            name: 'domicilio',
            label: 'Domicilio',
            tipo: 'text',
            requerido: true,
            min: 5,
            max: 100,
            placeholder: 'Calle y número',
        },
        {
            name: 'contrasena',
            label: 'Contraseña',
            tipo: 'password',
            requerido: (modo) => modo === 'crear',
            min: 6,
            max: 255,
            ayuda: 'Solo para usuarios nuevos. Dejalo vacío si no querés cambiarla.',
        },
        {
            name: 'rol_id',
            label: 'Rol',
            tipo: 'select',
            opciones: 'roles',
            requerido: true,
            soloCrear: true,
            ayuda: 'El rol se asigna en el alta y no se puede cambiar desde este panel.',
        },
    ],
};

const configCategorias = {
    clave: 'categorias',
    titulo: 'Categorías',
    descripcion:
        'Gestioná las categorías de propiedades publicadas.',
    principal: 'nombre',
    ruta: '/categorias',
    nombreSingular: 'categoría',
    papelera: true,
    obtener: ({ papelera }) =>
        obtenerRecurso('/categorias', {
            solo_eliminados: papelera ? 1 : 0,
        }),
    crear: (data) => crearRecurso('/categorias', data),
    actualizar: (id, data) =>
        actualizarRecurso('/categorias', id, data),
    eliminar: (id) => eliminarRecurso('/categorias', id),
    restaurar: (id) => restaurarRecurso('/categorias', id),
    columnas: [
        { key: 'id', label: 'ID' },
        { key: 'nombre', label: 'Nombre' },
    ],
    campos: [
        {
            name: 'nombre',
            label: 'Nombre',
            tipo: 'text',
            requerido: true,
            min: 3,
            max: 50,
            placeholder: 'Ej: Casa',
            ayuda: 'Solo letras, números, espacios, guiones y &.',
        },
    ],
};

const configProvincias = {
    ...configCategorias,
    clave: 'provincias',
    titulo: 'Provincias',
    descripcion: 'Gestioná las provincias del catálogo.',
    principal: 'nombre',
    ruta: '/provincias',
    nombreSingular: 'provincia',
    columnas: [
        { key: 'id', label: 'ID' },
        { key: 'nombre', label: 'Nombre' },
    ],
    campos: [
        {
            name: 'nombre',
            label: 'Nombre',
            tipo: 'text',
            requerido: true,
            min: 3,
            max: 100,
            placeholder: 'Ej: Entre Ríos',
            ayuda: 'Solo letras y espacios.',
        },
    ],
};

const configRoles = {
    ...configCategorias,
    clave: 'roles',
    titulo: 'Roles',
    descripcion: 'Gestioná los roles del sistema.',
    principal: 'nombre',
    ruta: '/roles',
    nombreSingular: 'rol',
    columnas: [
        { key: 'id', label: 'ID' },
        { key: 'nombre', label: 'Nombre' },
    ],
    campos: [
        {
            name: 'nombre',
            label: 'Nombre',
            tipo: 'text',
            requerido: true,
            min: 3,
            max: 30,
            placeholder: 'Ej: usuario',
            ayuda: 'Solo letras y espacios.',
        },
    ],
};

const configServicios = {
    ...configCategorias,
    clave: 'servicios',
    titulo: 'Servicios',
    descripcion:
        'Gestioná los servicios que pueden tener las propiedades.',
    principal: 'nombre',
    ruta: '/servicios',
    nombreSingular: 'servicio',
    columnas: [
        { key: 'id', label: 'ID' },
        { key: 'nombre', label: 'Nombre' },
    ],
    campos: [
        {
            name: 'nombre',
            label: 'Nombre',
            tipo: 'text',
            requerido: true,
            min: 3,
            max: 50,
            placeholder: 'Ej: Gas natural',
            ayuda: 'Solo letras, números, espacios, guiones y &.',
        },
    ],
};

const configLocalidades = {
    clave: 'localidades',
    titulo: 'Localidades',
    descripcion:
        'Gestioná las localidades y su provincia asociada.',
    principal: 'nombre',
    ruta: '/localidades',
    nombreSingular: 'localidad',
    papelera: true,
    obtener: ({ papelera }) =>
        obtenerRecurso('/localidades', {
            solo_eliminados: papelera ? 1 : 0,
        }),
    crear: (data) => crearRecurso('/localidades', data),
    actualizar: (id, data) =>
        actualizarRecurso('/localidades', id, data),
    eliminar: (id) => eliminarRecurso('/localidades', id),
    restaurar: (id) => restaurarRecurso('/localidades', id),
    externos: [
        { clave: 'provincias', cargar: () => obtenerRecurso('/provincias') },
    ],
    columnas: [
        { key: 'id', label: 'ID' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'codigo_postal', label: 'C.P.' },
        {
            key: 'provincia_id',
            label: 'Provincia',
            render: (item, externos) => {
                const prov = (externos?.provincias || []).find(
                    (p) =>
                        String(p.id) ===
                        String(item.provincia_id)
                );

                return prov ? prov.nombre : `#${item.provincia_id}`;
            },
        },
    ],
    campos: [
        {
            name: 'nombre',
            label: 'Nombre',
            tipo: 'text',
            requerido: true,
            min: 2,
            max: 100,
            placeholder: 'Ej: Crespo',
        },
        {
            name: 'codigo_postal',
            label: 'Código postal',
            tipo: 'text',
            requerido: true,
            min: 2,
            max: 15,
            placeholder: 'Ej: 3116',
        },
        {
            name: 'provincia_id',
            label: 'Provincia',
            tipo: 'select',
            opciones: 'provincias',
            requerido: true,
        },
    ],
};

const configPropiedades = {
    clave: 'propiedades',
    titulo: 'Propiedades',
    descripcion: 'Propiedades publicadas en el sistema.',
    principal: 'titulo',
    ruta: '/propiedades',
    nombreSingular: 'propiedad',
    papelera: true,
    obtener: ({ papelera }) =>
        obtenerRecurso('/admin/propiedades', {
            solo_eliminados: papelera ? 1 : 0,
        }),
    actualizar: (id, data) =>
        actualizarRecurso('/propiedades', id, data),
    eliminar: (id) => eliminarRecurso('/propiedades', id),
    restaurar: (id) => restaurarRecurso('/propiedades', id),
    normalizarEdicion: (item) => ({
        ...item,
        disponible: item.disponible ? 1 : 0,
        destacada: item.destacada ? 1 : 0,
    }),
    externos: [
        {
            clave: 'estados',
            cargar: () =>
                Promise.resolve([
                    { value: 1, label: 'Disponible' },
                    { value: 0, label: 'No disponible' },
                ]),
        },
        {
            clave: 'destacados',
            cargar: () =>
                Promise.resolve([
                    { value: 1, label: 'Sí, destacada' },
                    { value: 0, label: 'No destacada' },
                ]),
        },
    ],
    columnas: [
        { key: 'id', label: 'ID' },
        {
            key: 'titulo',
            label: 'Título',
            render: (item) =>
                `${item.titulo ?? ''}${item.direccion ? ` — ${item.direccion}` : ''}`,
        },
        {
            key: 'precio',
            label: 'Precio',
            render: (item) =>
                item.precio != null
                    ? `$${Number(item.precio).toLocaleString('es-AR')}`
                    : '—',
        },
        {
            key: 'disponible',
            label: 'Estado',
            render: (item) =>
                Number(item.disponible) === 1
                    ? 'Disponible'
                    : 'No disponible',
            color: (item) =>
                COLORES_DISPONIBILIDAD[Number(item.disponible)] ||
                COLORES_DISPONIBILIDAD[0],
        },
        {
            key: 'destacada',
            label: 'Destacada',
            render: (item) =>
                Number(item.destacada) === 1
                    ? 'Destacada'
                    : '—',
            color: (item) =>
                COLORES_DESTACADA[Number(item.destacada)] ||
                COLORES_DESTACADA[0],
        },
        {
            key: 'usuario',
            label: 'Propietario',
            render: (item) =>
                item.usuario
                    ? `${item.usuario.nombre} ${item.usuario.apellido || ''}`.trim()
                    : '—',
        },
        {
            key: 'categoria',
            label: 'Categoría',
            render: (item) => item.categoria?.nombre ?? '—',
        },
        {
            key: 'localidad',
            label: 'Localidad',
            render: (item) => item.localidad?.nombre ?? '—',
        },
    ],
    campos: [
        {
            name: 'titulo',
            label: 'Título',
            tipo: 'text',
            requerido: true,
            min: 3,
            max: 120,
        },
        {
            name: 'direccion',
            label: 'Dirección',
            tipo: 'text',
            requerido: true,
            min: 4,
            max: 200,
        },
        {
            name: 'precio',
            label: 'Precio mensual',
            tipo: 'number',
            requerido: true,
            min: 1,
            ayuda: 'Valor numérico sin separadores.',
        },
        {
            name: 'disponible',
            label: 'Estado',
            tipo: 'select',
            opciones: 'estados',
            requerido: true,
            ayuda: 'Si la marcás como no disponible, desaparece del catálogo público.',
        },
        {
            name: 'destacada',
            label: 'Destacada',
            tipo: 'select',
            opciones: 'destacados',
            requerido: true,
            ayuda: 'Las destacadas se muestran en el inicio.',
        },
    ],
};

const configReservas = {
    clave: 'reservas',
    titulo: 'Reservas',
    descripcion:
        'Gestioná las reservas de alquiler, cambiá su estado o restaurá eliminadas.',
    principal: 'id',
    ruta: '/reservas',
    nombreSingular: 'reserva',
    papelera: true,
    obtener: async ({ papelera }) => {
        const res = await obtenerRecurso('/reservas', {
            solo_eliminados: papelera ? 1 : 0,
        });

        return separarReservas(res).todas;
    },
    crear: (data) => crearRecurso('/admin/reservas', data),
    actualizar: (id, data) =>
        actualizarRecurso('/reservas', id, {
            estado: data.estado,
        }),
    eliminar: (id) => eliminarRecurso('/reservas', id),
    restaurar: (id) => restaurarRecurso('/reservas', id),
    acciones: [
        {
            etiqueta: 'Confirmar',
            color: '#16a34a',
            permitido: (item) => item.estado === 'pendiente',
            ejecutar: (id) => aprobarReserva(id),
        },
        {
            etiqueta: 'Rechazar',
            color: '#dc2626',
            permitido: (item) => item.estado === 'pendiente',
            ejecutar: (id) => rechazarReserva(id),
        },
        {
            etiqueta: 'Finalizar',
            color: '#2563eb',
            permitido: (item) => item.estado === 'confirmada',
            ejecutar: (id) => finalizarReserva(id),
        },
        {
            etiqueta: 'Cancelar',
            color: '#64748b',
            permitido: (item) =>
                ['pendiente', 'confirmada'].includes(
                    item.estado
                ),
            ejecutar: (id) => cancelarReserva(id),
        },
    ],
    externos: [
        {
            clave: 'estadosCrear',
            cargar: () => Promise.resolve(ESTADOS_RESERVA_CREAR),
        },
        {
            clave: 'usuarios',
            cargar: async () => {
                const res = await obtenerRecurso('/usuarios');

                return (extraer(res)).map((u) => ({
                    id: u.id,
                    nombre: `${u.nombre} ${u.apellido || ''}`.trim() +
                        ` (${u.email})`,
                }));
            },
        },
        {
            clave: 'propiedades',
            cargar: async () => {
                const res = await obtenerRecurso(
                    '/admin/propiedades'
                );

                return (extraer(res))
                    .filter((p) => Number(p.disponible) === 1)
                    .map((p) => ({
                        id: p.id,
                        nombre: `${p.titulo} — ${p.direccion || ''}`.trim(),
                    }));
            },
        },
    ],
    columnas: [
        { key: 'id', label: 'ID' },
        {
            key: 'propiedad',
            label: 'Propiedad',
            render: (item) =>
                item.propiedad?.titulo ||
                `Propiedad #${item.propiedad_id}`,
        },
        {
            key: 'usuario',
            label: 'Inquilino',
            render: (item) =>
                item.usuario
                    ? `${item.usuario.nombre} ${item.usuario.apellido || ''}`.trim()
                    : `Usuario #${item.usuario_id}`,
        },
        {
            key: 'fecha_reserva',
            label: 'Solicitada',
            render: (item) =>
                item.fecha_reserva
                    ? String(item.fecha_reserva).slice(0, 16)
                    : '—',
        },
        {
            key: 'fecha_inicio_alquiler',
            label: 'Alquiler',
            render: (item) =>
                item.fecha_inicio_alquiler &&
                item.fecha_fin_alquiler
                    ? `${String(item.fecha_inicio_alquiler).slice(0, 10)} → ${String(item.fecha_fin_alquiler).slice(0, 10)}`
                    : '—',
        },
        {
            key: 'estado',
            label: 'Estado',
            render: (item) =>
                ESTADOS_RESERVA.find((e) => e.value === item.estado)
                    ?.label ?? item.estado ?? '—',
            color: (item) =>
                COLORES_ESTADO_RESERVA[item.estado] ||
                '#64748b',
        },
    ],
    campos: [
        {
            name: 'usuario_id',
            label: 'Inquilino',
            tipo: 'select',
            opciones: 'usuarios',
            requerido: true,
            soloCrear: true,
        },
        {
            name: 'propiedad_id',
            label: 'Propiedad',
            tipo: 'select',
            opciones: 'propiedades',
            requerido: true,
            soloCrear: true,
            ayuda: 'Solo se muestran propiedades disponibles.',
        },
        {
            name: 'fecha_inicio_alquiler',
            label: 'Inicio de alquiler',
            tipo: 'date',
            requerido: true,
            soloCrear: true,
        },
        {
            name: 'fecha_fin_alquiler',
            label: 'Fin de alquiler',
            tipo: 'date',
            requerido: true,
            soloCrear: true,
        },
        {
            name: 'estado',
            label: 'Estado',
            tipo: 'select',
            opciones: 'estadosCrear',
            requerido: true,
            soloCrear: true,
            ayuda: 'Si elegís "Confirmada" el inquilino recibe una notificación.',
        },
        {
            name: 'estado',
            label: 'Estado',
            tipo: 'select',
            opciones: opcionesEstadoReserva,
            requerido: true,
            soloEditar: true,
            ayuda: 'Solo se ofrecen transiciones válidas para el estado actual de la reserva.',
        },
    ],
};

const configResenas = {
    clave: 'resenas',
    titulo: 'Reseñas',
    descripcion:
        'Moderá las reseñas publicadas sobre las propiedades y los inquilinos.',
    principal: 'id',
    ruta: '/resenas',
    nombreSingular: 'reseña',
    papelera: true,
    obtener: ({ papelera, filtros = {} }) =>
        obtenerRecurso('/resenas', {
            solo_eliminados: papelera ? 1 : 0,
            ...filtros,
        }),
    crear: (data) => crearRecurso('/admin/resenas', data),
    actualizar: (id, data) =>
        actualizarRecurso('/resenas', id, data),
    eliminar: (id) => eliminarRecurso('/resenas', id),
    restaurar: (id) => restaurarRecurso('/resenas', id),
    filtros: [
        {
            parametro: 'tipo',
            label: 'Tipo',
            opciones: [
                { value: 'propiedad', label: 'Propiedad' },
                { value: 'inquilino', label: 'Inquilino' },
            ],
        },
        {
            parametro: 'calificacion',
            label: 'Calificación',
            opciones: [5, 4, 3, 2, 1].map((n) => ({
                value: String(n),
                label: `${n} ${n === 1 ? 'estrella' : 'estrellas'}`,
            })),
        },
        { parametro: 'fecha_desde', label: 'Desde', tipo: 'date' },
        { parametro: 'fecha_hasta', label: 'Hasta', tipo: 'date' },
    ],
    externos: [
        {
            clave: 'usuarios',
            cargar: async () => {
                const res = await obtenerRecurso('/usuarios');

                return (extraer(res)).map((u) => ({
                    id: u.id,
                    nombre: `${u.nombre} ${u.apellido || ''}`.trim() +
                        ` (${u.email})`,
                }));
            },
        },
        {
            clave: 'reservasFinalizadas',
            cargar: async () => {
                const res = await obtenerReservas();
                const items = separarReservas(res).todas;

                return items
                    .filter((r) => r.estado === 'finalizada')
                    .map((r) => ({
                        id: r.id,
                        nombre: `#${r.id} — ${r.propiedad?.titulo || `Propiedad ${r.propiedad_id}`}` +
                            ` (${r.usuario ? `${r.usuario.nombre} ${r.usuario.apellido || ''}`.trim() : `Usuario ${r.usuario_id}`})`,
                    }));
            },
        },
    ],
    columnas: [
        { key: 'id', label: 'ID' },
        {
            key: 'tipo',
            label: 'Tipo',
            render: (item) =>
                item.tipo === 'propiedad'
                    ? 'Propiedad'
                    : 'Inquilino',
        },
        {
            key: 'calificacion',
            label: 'Calificación',
            render: (item) =>
                item.calificacion != null
                    ? `${'★'.repeat(Number(item.calificacion))} (${item.calificacion})`
                    : '—',
            color: () => '#f59e0b',
        },
        {
            key: 'comentario',
            label: 'Comentario',
            render: (item) => item.comentario || '—',
        },
        {
            key: 'calificador',
            label: 'Calificador',
            render: (item) =>
                item.calificador
                    ? `${item.calificador.nombre} ${item.calificador.apellido || ''}`.trim()
                    : `Usuario #${item.calificador_id}`,
        },
        {
            key: 'fecha_publicacion',
            label: 'Fecha',
            render: (item) =>
                item.fecha_publicacion
                    ? String(item.fecha_publicacion).slice(0, 10)
                    : '—',
        },
    ],
    campos: [
        {
            name: 'reserva_id',
            label: 'Reserva',
            tipo: 'select',
            opciones: 'reservasFinalizadas',
            requerido: true,
            soloCrear: true,
            ayuda: 'Solo se muestran reservas finalizadas.',
        },
        {
            name: 'calificador_id',
            label: 'Calificador',
            tipo: 'select',
            opciones: 'usuarios',
            requerido: true,
            soloCrear: true,
            ayuda: 'El tipo (propiedad o inquilino) se deduce según quién califique.',
        },
        {
            name: 'calificacion',
            label: 'Calificación',
            tipo: 'number',
            requerido: true,
            min: 1,
            max: 5,
            placeholder: '1 a 5',
            ayuda: 'Valor entre 1 y 5 estrellas.',
        },
        {
            name: 'comentario',
            label: 'Comentario',
            tipo: 'textarea',
            min: 3,
            max: 1000,
            placeholder: 'Escribí el comentario de la reseña...',
            ayuda: 'Opcional. Mínimo 3 caracteres, máximo 1000.',
        },
    ],
};

const configLogs = {
    clave: 'logs',
    titulo: 'Registros de actividad',
    descripcion:
        'Últimas acciones registradas por los usuarios del sistema.',
    principal: 'accion',
    ruta: '/logs-actividad',
    nombreSingular: 'registro',
    soloLectura: true,
    obtener: () => obtenerRecurso('/logs-actividad'),
    columnas: [
        { key: 'id', label: 'ID' },
        {
            key: 'usuario_nombre',
            label: 'Usuario',
            render: (item) =>
                `${item.usuario_nombre || '—'}${item.usuario_email ? ` (${item.usuario_email})` : ''}`,
        },
        { key: 'accion', label: 'Acción' },
        { key: 'ip_address', label: 'IP' },
        {
            key: 'fecha',
            label: 'Fecha',
            render: (item) =>
                String(item.fecha ?? '').slice(0, 16) || '—',
        },
    ],
    campos: [],
};

function extraer(res) {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    return [];
}

export const CONFIGURACIONES = {
    usuarios: configUsuarios,
    categorias: configCategorias,
    provincias: configProvincias,
    localidades: configLocalidades,
    roles: configRoles,
    servicios: configServicios,
    resenas: configResenas,
    reservas: configReservas,
    consultas: null,
    logs: configLogs,
    propiedades: configPropiedades,
};

export { extraer };