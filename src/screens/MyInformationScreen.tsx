import { Ionicons } from '@expo/vector-icons'; // Importamos la iconografía vectorial
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import PublicarPropiedadSection from '@/components/PublicarPropiedadSection';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';

export default function MyInformationScreen() {
    const router = useRouter();
    const {
        usuario,
        loading,
        logout,
        refrescarUsuario,
    } = useAuth();  

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/home');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (!loading) {
                refrescarUsuario();
            }
        }, [loading, refrescarUsuario])
    );

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
            />

            {usuario ? (
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {usuario.nombre?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>

                    <View style={styles.profileInfo}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {usuario.nombre} {usuario.apellido}
                        </Text>

                        <Text style={styles.userEmail} numberOfLines={1}>
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
                        <Ionicons name="log-out-outline" size={18} color={theme.colors.errorText} />
                        <Text style={styles.logoutText}>Salir</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mi cuenta</Text>

                <View style={styles.menu}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        activeOpacity={0.8}
                        onPress={() => router.push('/profile')}
                    >
                        <View style={styles.menuIcon}>
                            <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                        </View>

                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>Información personal</Text>
                            <Text style={styles.menuDescription}>Consultá y gestioná tus datos personales</Text>
                        </View>

                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mi actividad</Text>

                <View style={styles.menuShadowWrapper}>
                    <View style={styles.menu}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            activeOpacity={0.8}
                            onPress={() => router.push('/my-properties')}
                        >
                            <View style={styles.menuIcon}>
                                <Ionicons name="home-outline" size={20} color={theme.colors.primary} />
                            </View>

                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>Mis propiedades</Text>
                                <Text style={styles.menuDescription}>Administrá las propiedades que publicaste</Text>
                            </View>

                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            activeOpacity={0.8}
                            onPress={() => router.push('/reservations')}
                        >
                            <View style={styles.menuIcon}>
                                <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                            </View>

                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>Mis reservas</Text>
                                <Text style={styles.menuDescription}>Consultá tus reservas y sus estados</Text>
                            </View>

                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            activeOpacity={0.8}
                            onPress={() => router.push('/messages')}
                        >
                            <View style={styles.menuIcon}>
                                <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.primary} />
                            </View>

                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>Mis consultas</Text>
                                <Text style={styles.menuDescription}>Consultá tus conversaciones</Text>
                            </View>

                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            activeOpacity={0.8}
                            onPress={() => router.push('/reviews')}
                        >
                            <View style={styles.menuIcon}>
                                <Ionicons name="star-outline" size={20} color={theme.colors.primary} />
                            </View>

                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>Mis reseñas</Text>
                                <Text style={styles.menuDescription}>Consultá las reseñas que realizaste y las de tus propiedades</Text>
                            </View>

                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomWidth: 0 }]} // Quitamos borde al último
                            activeOpacity={0.8}
                            onPress={() => router.push('/favorites')}
                        >
                            <View style={styles.menuIcon}>
                                <Ionicons name="heart-outline" size={20} color={theme.colors.primary} />
                            </View>

                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>Mis favoritos</Text>
                                <Text style={styles.menuDescription}>Propiedades que guardaste</Text>
                            </View>

                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <PublicarPropiedadSection />
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
        fontSize: 15,
        fontWeight: '500',
    },
    profileCard: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        padding: theme.spacing.md,
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        elevation: 2,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '800',
    },
    profileInfo: {
        flex: 1,
        minWidth: 0,
        marginLeft: theme.spacing.md,
    },
    userName: {
        color: theme.colors.textDark,
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    userEmail: {
        marginTop: 2,
        color: theme.colors.textMuted,
        fontSize: 13,
        fontWeight: '500',
    },
    userRole: {
        marginTop: 4,
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    logoutButton: {
        marginLeft: theme.spacing.sm,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: `${theme.colors.errorText}10`, // Fondo rojo sutil
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    logoutText: {
        color: theme.colors.errorText,
        fontSize: 14,
        fontWeight: '700',
    },
    section: {
        marginTop: theme.spacing.xl,
        paddingHorizontal: theme.spacing.md,
    },
    sectionTitle: {
        marginBottom: theme.spacing.md,
        color: theme.colors.textDark,
        fontSize: 18,
        fontWeight: '800',
    },
    menuShadowWrapper: {
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    menu: {
        borderRadius: 16,
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden', 
    },
    menuItem: {
        minHeight: 76,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth, 
        borderBottomColor: theme.colors.border,
    },
    menuIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${theme.colors.primary}15`, 
    },
    menuContent: {
        flex: 1,
        marginLeft: 16, 
        marginRight: theme.spacing.sm,
    },
    menuTitle: {
        color: theme.colors.textDark,
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 35, 
        paddingTop: 2,  
    },
    menuDescription: {
        marginTop: 2,
        color: theme.colors.textMuted,
        fontSize: 13,
        lineHeight: 20, 
        paddingBottom: 2, 
    },
});