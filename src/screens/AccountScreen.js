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

import PropertyCard from '../components/PropertyCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { theme } from '../theme/theme';

export default function AccountScreen() {
    const router = useRouter();

    const [usuario, setUsuario] = useState(null);
    const [propiedades, setPropiedades] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { logout } = useAuth();

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError('');

            const [
                usuarioResponse,
                propiedadesResponse,
            ] = await Promise.all([
                api.get('/usuarios/me'),
                api.get('/propiedades/mis-propiedades'),
            ]);

            if (usuarioResponse.data?.success) {
                setUsuario(
                    usuarioResponse.data.data
                );
            } else {
                setUsuario(null);
            }

            const propiedadesData =
                propiedadesResponse.data?.data?.items ||
                propiedadesResponse.data?.data ||
                [];

            setPropiedades(propiedadesData);
        } catch (error) {
            console.error(
                'ACCOUNT: ERROR',
                error
            );

            console.error(
                'ACCOUNT: respuesta',
                error.response?.data
            );

            setError(
                error.response?.data?.error ||
                'No se pudieron cargar los datos de la cuenta'
            );
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarDatos();
        }, [])
    );

    const handlePropiedad = (propiedad) => {
        router.push(
            `/propiedades/${propiedad.id}`
        );
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/home');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Cargando cuenta...
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
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    Cuenta
                </Text>

                <Text style={styles.headerSubtitle}>
                    Tu información y tus propiedades
                </Text>
            </View>

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                </View>
            ) : null}

            {usuario ? (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionBadge}>
                            Perfil
                        </Text>

                        <Text style={styles.sectionTitle}>
                            Información personal
                        </Text>
                    </View>

                    <View style={styles.userCard}>
                        <View style={styles.userHeader}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {usuario.nombre
                                        ?.charAt(0)
                                        ?.toUpperCase() || '?'}
                                </Text>
                            </View>

                            <View style={styles.userHeaderText}>
                                <Text style={styles.userName}>
                                    {usuario.nombre}{' '}
                                    {usuario.apellido}
                                </Text>

                                {usuario.rol ? (
                                    <Text style={styles.userRole}>
                                        {usuario.rol.nombre}
                                    </Text>
                                ) : null}
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>
                                Email
                            </Text>

                            <Text style={styles.infoValue}>
                                {usuario.email}
                            </Text>
                        </View>

                        {usuario.telefono ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>
                                    Teléfono
                                </Text>

                                <Text style={styles.infoValue}>
                                    {usuario.telefono}
                                </Text>
                            </View>
                        ) : null}

                        {usuario.domicilio ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>
                                    Domicilio
                                </Text>

                                <Text style={styles.infoValue}>
                                    {usuario.domicilio}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>
            ) : null}

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionBadge}>
                        Publicaciones
                    </Text>

                    <Text style={styles.sectionTitle}>
                        Mis propiedades
                    </Text>

                    <Text style={styles.sectionDescription}>
                        {propiedades.length === 0
                            ? 'Todavía no publicaste ninguna propiedad.'
                            : `${propiedades.length} ${
                                propiedades.length === 1
                                    ? 'propiedad publicada'
                                    : 'propiedades publicadas'
                            }`}
                    </Text>
                </View>

                {propiedades.length > 0 ? (
                    <View style={styles.propertiesGrid}>
                        {propiedades.map((propiedad) => (
                            <PropertyCard
                                key={propiedad.id}
                                propiedad={propiedad}
                                onPress={() => handlePropiedad(propiedad)}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>
                            🏠
                        </Text>

                        <Text style={styles.emptyTitle}>
                            No tenés propiedades
                        </Text>

                        <Text style={styles.emptyText}>
                            Cuando publiques una propiedad,
                            aparecerá acá.
                        </Text>
                    </View>
                )}
            </View>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
            >
                <Text style={styles.logoutText}>
                    Cerrar sesión
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:
            theme.colors.background,
    },

    content: {
        paddingBottom:
            theme.spacing.xl + 90,
    },

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
            theme.colors.background,
    },

    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.textMuted,
        fontSize: 14,
    },

    header: {
        paddingHorizontal:
            theme.spacing.lg,
        paddingTop:
            theme.spacing.md,
        paddingBottom:
            theme.spacing.lg,
        backgroundColor:
            theme.colors.primary,
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

    errorBox: {
        marginHorizontal:
            theme.spacing.md,
        marginTop:
            theme.spacing.md,
        padding:
            theme.spacing.md,
        borderRadius: 10,
        backgroundColor:
            theme.colors.errorBg,
    },

    errorText: {
        color: theme.colors.errorText,
        fontSize: 14,
        textAlign: 'center',
    },

    section: {
        marginTop:
            theme.spacing.lg,
    },

    sectionHeader: {
        paddingHorizontal:
            theme.spacing.md,
        marginBottom:
            theme.spacing.md,
    },

    sectionBadge: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
    },

    sectionTitle: {
        color: theme.colors.textDark,
        fontSize: 24,
        fontWeight: '700',
    },

    sectionDescription: {
        marginTop: 4,
        color: theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 20,
    },

    userCard: {
        marginHorizontal:
            theme.spacing.md,
        padding:
            theme.spacing.md,
        borderRadius: 16,
        backgroundColor:
            theme.colors.inputBg,
        borderWidth: 1,
        borderColor:
            theme.colors.border,
    },

    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
            theme.colors.primary,
    },

    avatarText: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '700',
    },

    userHeaderText: {
        flex: 1,
        marginLeft:
            theme.spacing.md,
    },

    userName: {
        color: theme.colors.textDark,
        fontSize: 18,
        fontWeight: '700',
    },

    userRole: {
        marginTop: 3,
        color: theme.colors.textMuted,
        fontSize: 13,
    },

    divider: {
        height: 1,
        marginVertical:
            theme.spacing.md,
        backgroundColor:
            theme.colors.border,
    },

    infoRow: {
        marginBottom:
            theme.spacing.sm,
    },

    infoLabel: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginBottom: 2,
    },

    infoValue: {
        color: theme.colors.textDark,
        fontSize: 14,
    },

    propertiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        rowGap: theme.spacing.md,
    },

    emptyContainer: {
        marginHorizontal:
            theme.spacing.md,
        paddingVertical:
            theme.spacing.xl,
        paddingHorizontal:
            theme.spacing.lg,
        borderRadius: 16,
        backgroundColor:
            theme.colors.inputBg,
        borderWidth: 1,
        borderColor:
            theme.colors.border,
        alignItems: 'center',
    },

    emptyIcon: {
        fontSize: 36,
        marginBottom:
            theme.spacing.sm,
    },

    emptyTitle: {
        color: theme.colors.textDark,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },

    emptyText: {
        marginTop:
            theme.spacing.sm,
        color: theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },

    logoutButton: {
        marginHorizontal:
            theme.spacing.md,
        marginTop:
            theme.spacing.xl,
        paddingVertical:
            theme.spacing.md,
        borderRadius: 10,
        borderWidth: 1,
        borderColor:
            theme.colors.border,
        alignItems: 'center',
    },

    logoutText: {
        color: theme.colors.errorText,
        fontSize: 15,
        fontWeight: '600',
    },
});