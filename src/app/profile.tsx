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
import {
    obtenerPerfil,
} from '../services/api';
import { theme } from '../theme/theme';

export default function ProfileScreen() {
    const router = useRouter();

    const [usuario, setUsuario] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargarPerfil = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await obtenerPerfil();

            if (response?.success) {
                setUsuario(response.data);
            } else {
                setUsuario(null);

                setError(
                    response?.message ||
                    'No se pudo cargar tu perfil'
                );
            }
        } catch (error) {
            console.error(
                'PROFILE: error al cargar perfil:',
                error
            );

            setUsuario(null);

            setError(
                'No se pudo cargar tu perfil'
            );
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarPerfil();
        }, [])
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                    Cargando perfil...
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
                title="Mi perfil"
                subtitle="Información personal"
            />

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                </View>
            ) : null}

            {usuario ? (
                <View style={styles.card}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {usuario.nombre
                                ?.charAt(0)
                                ?.toUpperCase() || '?'}
                        </Text>
                    </View>

                    <View style={styles.info}>
                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Nombre
                            </Text>

                            <Text style={styles.value}>
                                {usuario.nombre}
                            </Text>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Apellido
                            </Text>

                            <Text style={styles.value}>
                                {usuario.apellido}
                            </Text>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Email
                            </Text>

                            <Text style={styles.value}>
                                {usuario.email}
                            </Text>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Teléfono
                            </Text>

                            <Text style={styles.value}>
                                {usuario.telefono}
                            </Text>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Domicilio
                            </Text>

                            <Text style={styles.value}>
                                {usuario.domicilio}
                            </Text>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Rol
                            </Text>

                            <Text style={styles.value}>
                                {usuario.rol?.nombre}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() =>
                            router.push('/editar-perfil')
                        }
                        activeOpacity={0.85}
                    >
                        <Text style={styles.editButtonText}>
                            Editar perfil
                        </Text>
                    </TouchableOpacity>

                    {String(
                        usuario.rol?.nombre ||
                            usuario.rol?.valor
                    ).toLowerCase() === 'administrador' ||
                    String(usuario.rol?.id) === '1' ? (
                        <TouchableOpacity
                            style={[
                                styles.editButton,
                                styles.adminButton,
                            ]}
                            onPress={() =>
                                router.push('/admin')
                            }
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[
                                    styles.editButtonText,
                                    styles.adminButtonText,
                                ]}
                            >
                                Panel de administración
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : null}
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
        marginTop:
            theme.spacing.md,
        color:
            theme.colors.textMuted,
        fontSize: 14,
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
        color:
            theme.colors.errorText,
        fontSize: 14,
        textAlign: 'center',
    },

    card: {
        marginHorizontal:
            theme.spacing.md,
        marginTop:
            theme.spacing.lg,
        padding:
            theme.spacing.lg,
        borderRadius: 16,
        backgroundColor:
            theme.colors.inputBg,
        borderWidth: 1,
        borderColor:
            theme.colors.border,
    },

    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
            theme.colors.primary,
    },

    avatarText: {
        color: theme.colors.white,
        fontSize: 30,
        fontWeight: '700',
    },

    info: {
        marginTop:
            theme.spacing.lg,
    },

    field: {
        paddingVertical:
            theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor:
            theme.colors.border,
    },

    label: {
        marginBottom: 4,
        color:
            theme.colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },

    value: {
        color:
            theme.colors.textDark,
        fontSize: 16,
    },

    editButton: {
        minHeight: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop:
            theme.spacing.lg,
        borderRadius: 12,
        backgroundColor:
            theme.colors.primary,
    },

    editButtonText: {
        color: theme.colors.white,
        fontSize: 15,
        fontWeight: '700',
    },

    adminButton: {
        backgroundColor: theme.colors.textDark,
    },

    adminButtonText: {
        color: theme.colors.white,
    },
});