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
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { theme } from '../theme/theme';

export default function MyInformationScreen() {
    const router = useRouter();

    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { logout } = useAuth();

    const cargarUsuario = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/usuarios/me');

            if (response.data?.success) {
                setUsuario(response.data.data);
            } else {
                setUsuario(null);
            }
        } catch (error) {
            console.error(
                'MY INFORMATION: error al cargar usuario',
                error.response?.data
            );

            setUsuario(null);

            setError(
                error.response?.data?.error ||
                'No se pudo cargar tu información'
            );
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarUsuario();
        }, [])
    );

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/home');
        } catch (error) {
            console.error(
                'Error al cerrar sesión:',
                error
            );
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
                    Cargando información...
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
                title="Mi información"
                subtitle="Gestioná tu cuenta y tu actividad"
                showBackButton
            />
            

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                </View>
            ) : null}

            {usuario ? (
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {usuario.nombre
                                ?.charAt(0)
                                ?.toUpperCase() || '?'}
                        </Text>
                    </View>

                    <View style={styles.profileInfo}>
                        <Text
                            style={styles.userName}
                            numberOfLines={1}
                        >
                            {usuario.nombre} {usuario.apellido}
                        </Text>

                        <Text
                            style={styles.userEmail}
                            numberOfLines={1}
                        >
                            {usuario.email}
                        </Text>

                        {usuario.rol ? (
                            <Text style={styles.userRole}>
                                {usuario.rol.nombre}
                            </Text>
                        ) : null}
                    </View>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.logoutText}>
                            Salir
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Mi cuenta
                </Text>

                <View style={styles.menu}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        activeOpacity={0.8}
                        onPress={() =>
                            router.push('/profile')
                        }
                    >
                        <View style={styles.menuIcon}>
                            <Text style={styles.menuIconText}>
                                👤
                            </Text>
                        </View>

                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>
                                Información personal
                            </Text>

                            <Text style={styles.menuDescription}>
                                Consultá y gestioná tus datos personales
                            </Text>
                        </View>

                        <Text style={styles.menuArrow}>
                            ›
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Ayuda e información
                </Text>

                <View style={styles.menu}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        activeOpacity={0.8}
                        onPress={() => router.push('/ayuda')}
                    >
                        <View style={styles.menuIcon}>
                            <Text style={styles.menuIconText}>
                                ❔
                            </Text>
                        </View>

                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>
                                Centro de ayuda
                            </Text>

                            <Text style={styles.menuDescription}>
                                Contacto, preguntas frecuentes y políticas
                            </Text>
                        </View>

                        <Text style={styles.menuArrow}>
                            ›
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Mi actividad
                </Text>

                <View style={styles.menu}>
                   <TouchableOpacity
                        style={styles.menuItem}
                        activeOpacity={0.8}
                        onPress={() =>
                            router.push('/my-properties')
                        }
                    >
                        <View style={styles.menuIcon}>
                            <Text style={styles.menuIconText}>
                                🏠
                            </Text>
                        </View>

                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>
                                Mis propiedades
                            </Text>

                            <Text style={styles.menuDescription}>
                                Administrá las propiedades que publicaste
                            </Text>
                        </View>

                        <Text style={styles.menuArrow}>
                            ›
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        activeOpacity={0.8}
                        onPress={() =>
                            router.push('/reservas')
                        }
                    >
                        <View style={styles.menuIcon}>
                            <Text style={styles.menuIconText}>
                                📅
                            </Text>
                        </View>

                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>
                                Mis reservas
                            </Text>

                            <Text style={styles.menuDescription}>
                                Consultá tus reservas y sus estados
                            </Text>
                        </View>

                        <Text style={styles.menuArrow}>
                            ›
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        activeOpacity={0.8}
                        onPress={() =>
                            router.push('/consultas')
                        }
                    >
                        <View style={styles.menuIcon}>
                            <Text style={styles.menuIconText}>
                                💬
                            </Text>
                        </View>

                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>
                                Mis consultas
                            </Text>

                            <Text style={styles.menuDescription}>
                                Consultá tus conversaciones
                            </Text>
                        </View>

                        <Text style={styles.menuArrow}>
                            ›
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        activeOpacity={0.8}
                        onPress={() =>
                            router.push('/favorites')
                        }
                    >
                        <View style={styles.menuIcon}>
                            <Text style={styles.menuIconText}>
                                ❤️
                            </Text>
                        </View>

                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>
                                Mis favoritos
                            </Text>

                            <Text style={styles.menuDescription}>
                                Propiedades que guardaste
                            </Text>
                        </View>

                        <Text style={styles.menuArrow}>
                            ›
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Publicar
                </Text>

                <TouchableOpacity
                    style={styles.publishButton}
                    activeOpacity={0.8}
                    onPress={() =>
                        router.push('/publicar-propiedad')
                    }
                >
                    <Text style={styles.publishIcon}>
                        ＋
                    </Text>

                    <View style={styles.publishContent}>
                        <Text style={styles.publishTitle}>
                            Publicar una propiedad
                        </Text>

                        <Text style={styles.publishDescription}>
                            Agregá una nueva propiedad al sistema
                        </Text>
                    </View>

                    <Text style={styles.menuArrow}>
                        ›
                    </Text>
                </TouchableOpacity>
            </View>
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

    profileCard: {
        marginHorizontal:
            theme.spacing.md,
        marginTop:
            theme.spacing.lg,
        padding:
            theme.spacing.md,
        borderRadius: 16,
        backgroundColor:
            theme.colors.inputBg,
        borderWidth: 1,
        borderColor:
            theme.colors.border,
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
        color: theme.colors.white,
        fontSize: 22,
        fontWeight: '700',
    },

    profileInfo: {
        flex: 1,
        minWidth: 0,
        marginLeft:
            theme.spacing.md,
    },

    userName: {
        color:
            theme.colors.textDark,
        fontSize: 18,
        fontWeight: '700',
    },

    userEmail: {
        marginTop: 3,
        color:
            theme.colors.textMuted,
        fontSize: 13,
    },

    userRole: {
        marginTop: 3,
        color:
            theme.colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },

    section: {
        marginTop:
            theme.spacing.xl,
        paddingHorizontal:
            theme.spacing.md,
    },

    sectionTitle: {
        marginBottom:
            theme.spacing.sm,
        color:
            theme.colors.textDark,
        fontSize: 18,
        fontWeight: '700',
    },

    menu: {
        borderRadius: 16,
        backgroundColor:
            theme.colors.inputBg,
        borderWidth: 1,
        borderColor:
            theme.colors.border,
        overflow: 'hidden',
    },

    menuItem: {
        minHeight: 76,
        paddingHorizontal:
            theme.spacing.md,
        paddingVertical:
            theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor:
            theme.colors.border,
    },

    menuIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
            theme.colors.background,
    },

    menuIconText: {
        fontSize: 20,
    },

    menuContent: {
        flex: 1,
        marginLeft:
            theme.spacing.md,
    },

    menuTitle: {
        color:
            theme.colors.textDark,
        fontSize: 15,
        fontWeight: '700',
    },

    menuDescription: {
        marginTop: 3,
        color:
            theme.colors.textMuted,
        fontSize: 12,
        lineHeight: 17,
    },

    menuArrow: {
        marginLeft:
            theme.spacing.sm,
        color:
            theme.colors.textMuted,
        fontSize: 28,
        fontWeight: '300',
    },

    publishButton: {
        minHeight: 76,
        paddingHorizontal:
            theme.spacing.md,
        paddingVertical:
            theme.spacing.sm,
        borderRadius: 16,
        backgroundColor:
            theme.colors.inputBg,
        borderWidth: 1,
        borderColor:
            theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },

    publishIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        textAlign: 'center',
        textAlignVertical: 'center',
        backgroundColor:
            theme.colors.primary,
        color: theme.colors.white,
        fontSize: 25,
        lineHeight: 42,
    },

    publishContent: {
        flex: 1,
        marginLeft:
            theme.spacing.md,
    },

    publishTitle: {
        color:
            theme.colors.textDark,
        fontSize: 15,
        fontWeight: '700',
    },

    publishDescription: {
        marginTop: 3,
        color:
            theme.colors.textMuted,
        fontSize: 12,
        lineHeight: 17,
    },

    logoutButton: {
        marginLeft: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },

    logoutText: {
        color: theme.colors.errorText,
        fontSize: 14,
        fontWeight: '600',
    },
});