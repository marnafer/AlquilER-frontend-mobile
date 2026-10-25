import { useRouter } from 'expo-router';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';

import { theme } from '../theme/theme';

import type { Property } from '../types/property';
import type { ReservationStatus } from '../types/reservation';
import type { Review } from '../types/review';

type ReviewButtonReservation = {
  id: number;
  estado: ReservationStatus;
  usuario_id: number;
  propiedad?: Pick<Property, 'usuario_id'> | null;
};

type ReviewButtonProps = {
  reserva: ReviewButtonReservation | null;
  usuarioId: number | null | undefined;
  resenas: Pick<Review, 'calificador_id' | 'tipo'>[] | null;
};

export default function ReviewButton({
  reserva,
  usuarioId,
  resenas,
}: ReviewButtonProps) {
    const router = useRouter();

    if (
        !reserva ||
        reserva.estado !== 'finalizada' ||
        usuarioId === null ||
        usuarioId === undefined ||
        !Array.isArray(resenas)
    ) {
        return null;
    }

    const miResena = resenas.find(
        (resena) =>
            Number(resena.calificador_id) === Number(usuarioId)
    );

    const resenaDeLaOtraPersona = resenas.find(
        (resena) =>
            Number(resena.calificador_id) !== Number(usuarioId)
    );

    const inquilinoId = reserva.usuario_id;
    const propietarioId = reserva.propiedad?.usuario_id;

    const esInquilino =
        String(usuarioId) === String(inquilinoId);

    const esPropietario =
        String(usuarioId) === String(propietarioId);

    // Solo pueden calificar los participantes de la reserva.
    if (!esInquilino && !esPropietario) {
        return null;
    }

    const tipoEsperado = esInquilino
        ? 'propiedad'
        : 'inquilino';

    const yaCalifico = resenas.some((resena) =>
        resena.tipo === tipoEsperado &&
        String(resena.calificador_id) === String(usuarioId)
    );

    if (yaCalifico) {
        return null;
    }

    return (
        <TouchableOpacity
            style={styles.boton}
            activeOpacity={0.8}
            onPress={() =>
                router.push({
                    pathname: '/create-review',
                    params: {
                        reservaId: String(reserva.id),
                    },
                })
            }
        >
            <Text style={styles.texto}>
                ★ Dejar una reseña
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    boton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 15,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    texto: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
