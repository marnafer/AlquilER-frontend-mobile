
import { useEffect, useState } from 'react';

import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { obtenerResenasPropiedad } from '@/services/reviewService';
import { theme } from '@/theme/theme';

interface Calificador {
    nombre?: string;
    apellido?: string;
}

interface Resena {
    id: number;
    calificacion: number;
    comentario?: string | null;
    fecha_publicacion?: string | null;
    calificador?: Calificador | null;
}

interface ResenasResponse {
    success?: boolean;
    message?: string;
    data?: {
        items?: Resena[];
        total?: number;
        promedio?: number | string | null;
    };
    items?: Resena[];
    total?: number;
    promedio?: number | string | null;
}

interface PropertyReviewsProps {
    propiedadId: number | string;
}

function formatearFecha(fecha?: string | null): string {
    if (!fecha) {
        return '';
    }

    const fechaValida = new Date(fecha);

    if (Number.isNaN(fechaValida.getTime())) {
        return '';
    }

    return fechaValida.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function obtenerNombre(calificador?: Calificador | null): string {
    const nombre = [
        calificador?.nombre,
        calificador?.apellido,
    ]
        .filter(Boolean)
        .join(' ')
        .trim();

    return nombre || 'Usuario';
}

function Estrellas({ calificacion }: { calificacion: number }) {
    const valor = Math.max(0, Math.min(5, Math.round(calificacion)));

    return (
        <Text style={styles.estrellas}>
            {'★'.repeat(valor)}
            <Text style={styles.estrellasVacias}>
                {'★'.repeat(5 - valor)}
            </Text>
        </Text>
    );
}

export default function PropertyReviews({
    propiedadId,
}: PropertyReviewsProps) {
    const [resenas, setResenas] = useState<Resena[]>([]);
    const [promedio, setPromedio] = useState(0);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let activo = true;

        async function cargarResenas() {
            setCargando(true);
            setError(null);

            try {
                const respuesta = await obtenerResenasPropiedad(
                    Number(propiedadId),
                ) as ResenasResponse;

                if (!activo) {
                    return;
                }

                if (
                    respuesta?.success === false
                    || !respuesta
                ) {
                    setError(
                        respuesta?.message
                        || 'No se pudieron cargar las reseñas.',
                    );
                    return;
                }

                // La respuesta habitual del backend está dentro de data.
                const datos = respuesta.data ?? respuesta;

                setResenas(
                    Array.isArray(datos.items) ? datos.items : [],
                );

                setTotal(
                    Number(datos.total ?? datos.items?.length ?? 0),
                );

                setPromedio(Number(datos.promedio ?? 0));
            } catch {
                if (activo) {
                    setError('No se pudieron cargar las reseñas.');
                }
            } finally {
                if (activo) {
                    setCargando(false);
                }
            }
        }

        cargarResenas();

        return () => {
            activo = false;
        };
    }, [propiedadId]);

    
return (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>
            Reseñas
        </Text>

        {cargando ? (
            <View style={styles.estado}>
                <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                />
                <Text style={styles.textoEstado}>
                    Cargando reseñas...
                </Text>
            </View>
        ) : error ? (
            <Text style={styles.textoEstado}>
                {error}
            </Text>
        ) : (
            <>
                <View style={styles.resumen}>
                    <Text style={styles.promedio}>
                        {promedio.toLocaleString('es-AR', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                        })}
                    </Text>

                    <View style={styles.resumenDetalle}>
                        <Estrellas calificacion={promedio} />
                        <Text style={styles.cantidad}>
                            {total} {total === 1 ? 'reseña' : 'reseñas'}
                        </Text>
                    </View>
                </View>

                {resenas.length === 0 ? (
                    <Text style={styles.textoEstado}>
                        Esta propiedad todavía no tiene reseñas.
                    </Text>
                ) : (
                    resenas.map((resena) => (
                        <View key={resena.id} style={styles.resena}>
                            <View style={styles.encabezadoResena}>
                                <View style={styles.autor}>
                                    <Text style={styles.nombre}>
                                        {obtenerNombre(resena.calificador)}
                                    </Text>

                                    <Estrellas
                                        calificacion={resena.calificacion}
                                    />
                                </View>

                                {!!resena.fecha_publicacion && (
                                    <Text style={styles.fecha}>
                                        {formatearFecha(
                                            resena.fecha_publicacion,
                                        )}
                                    </Text>
                                )}
                            </View>

                            {!!resena.comentario?.trim() && (
                                <Text style={styles.comentario}>
                                    {resena.comentario.trim()}
                                </Text>
                            )}
                        </View>
                    ))
                )}
            </>
        )}
    </View>
);

}

const styles = StyleSheet.create({
    
section: {
    marginHorizontal: theme.spacing.lg,
},

sectionTitle: {
    marginBottom: theme.spacing.sm,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDark,
},

resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
},

promedio: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.textDark,
},

resumenDetalle: {
    gap: 4,
},

estrellas: {
    color: '#E5A000',
    fontSize: 17,
    letterSpacing: 1,
},

estrellasVacias: {
    color: theme.colors.border,
},

cantidad: {
    fontSize: 14,
    color: theme.colors.textMuted,
},

estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
},

textoEstado: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.textMuted,
},

resena: {
    paddingVertical: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
},

encabezadoResena: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
},

autor: {
    flex: 1,
    gap: 4,
},

nombre: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textDark,
},

fecha: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'right',
},

comentario: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textDark,
},

});
