import {
    useFocusEffect,
    useRouter,
} from 'expo-router';

import {
    useCallback,
    useState,
} from 'react';

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { MODULOS } from '../services/adminConfig';
import { obtenerPerfil } from '../services/api';
import { theme } from '../theme/theme';

const ES_ADMIN = 'Administrador';

export default function AdminHomeScreen() {
    const router = useRouter();

    const [cargando, setCargando] = useState(true);
    const [autorizado, setAutorizado] = useState(false);
    const [error, setError] = useState('');

    const verificarAcceso = useCallback(async () => {
        setCargando(true);
        setError('');

        const res = await obtenerPerfil();

        if (res.success) {
            const rol =
                res.data?.rol?.nombre ||
                res.data?.rol?.valor ||
                res.data?.rol?.id;

            const esAdmin =
                String(rol).toLowerCase() === 'administrador' ||
                String(rol) === '1';

            setAutorizado(esAdmin);

            if (!esAdmin) {
                setError(
                    'No tenés permisos de administración.'
                );
            }
        } else {
            setAutorizado(false);

            setError(
                res.message ||
                    'No se pudo verificar tu acceso al panel.'
            );
        }

        setCargando(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            verificarAcceso();
        }, [verificarAcceso])
    );

    if (cargando) {
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

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <ScreenHeader
                title="Panel de control"
                subtitle="Gestioná los datos maestros y los usuarios de AlquilER."
            />

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={verificarAcceso}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.retryButtonText}>
                            Reintentar
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {autorizado ? (
                <View style={styles.grid}>
                    {MODULOS.map((modulo) => (
                        <TouchableOpacity
                            key={modulo.clave}
                            style={styles.card}
                            onPress={() =>
                                router.push(
                                    `/admin/${modulo.clave}`
                                )
                            }
                            activeOpacity={0.85}
                        >
                            <View style={styles.cardIcono}>
                                <Text style={styles.cardEmoji}>
                                    {modulo.emoji}
                                </Text>
                            </View>

                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitulo}>
                                    {modulo.titulo}
                                </Text>

                                <Text style={styles.cardDesc}>
                                    {modulo.desc}
                                </Text>
                            </View>

                            <Text style={styles.cardFlecha}>
                                ›
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    content: {
        paddingBottom: theme.spacing.xl + 90,
    },

    loadingContainer: {
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

    grid: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        gap: theme.spacing.md,
    },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: 14,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    cardIcono: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primaryBg,
    },

    cardEmoji: {
        fontSize: 22,
    },

    cardInfo: {
        flex: 1,
        marginLeft: theme.spacing.md,
        minWidth: 0,
    },

    cardTitulo: {
        color: theme.colors.textDark,
        fontSize: 16,
        fontWeight: '700',
    },

    cardDesc: {
        marginTop: 3,
        color: theme.colors.textMuted,
        fontSize: 13,
        lineHeight: 18,
    },

    cardFlecha: {
        color: theme.colors.textMuted,
        fontSize: 24,
        marginLeft: theme.spacing.sm,
    },
});