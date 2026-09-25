import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { theme } from '../theme/theme';

const oscurecerColor = (color: string, porcentaje: number) => {
    const hex = color.replace('#', '');

    if (hex.length !== 6) {
        return color;
    }

    const rojo = parseInt(hex.substring(0, 2), 16);
    const verde = parseInt(hex.substring(2, 4), 16);
    const azul = parseInt(hex.substring(4, 6), 16);

    const factor = 1 - porcentaje;

    return `rgb(
        ${Math.round(rojo * factor)},
        ${Math.round(verde * factor)},
        ${Math.round(azul * factor)}
    )`;
};

export default function AppHeader() {
    const router = useRouter();
    const [menuAbierto, setMenuAbierto] = useState(false);

    const navegar = (ruta: '/home' | '/explore') => {
        setMenuAbierto(false);
        router.push(ruta);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() =>
                        setMenuAbierto((actual) => !actual)
                    }
                    activeOpacity={0.8}
                >
                    <Text style={styles.menuIcon}>
                        ☰
                    </Text>
                </TouchableOpacity>

                <Text style={styles.logo}>
                    AlquilER
                </Text>
            </View>

            {menuAbierto && (
                <View style={styles.menu}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navegar('/home')}
                    >
                        <View style={styles.menuIconContainer}>
                            <Text style={styles.menuIconItem}>
                                🏠
                            </Text>
                        </View>

                        <Text style={styles.menuText}>
                            Inicio
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navegar('/explore')}
                    >
                        <View style={styles.menuIconContainer}>
                            <Text style={styles.menuIconItem}>
                                🔎
                            </Text>
                        </View>

                        <Text style={styles.menuText}>
                            Explorar
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 100,
    },

    header: {
        height: 60,
        backgroundColor: oscurecerColor(
            theme.colors.primary,
            0.15
        ),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },

    menuButton: {
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },

    menuIcon: {
        color: '#ffffff',
        fontSize: 28,
        lineHeight: 30,
    },

    logo: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '800',
    },

    menu: {
        position: 'absolute',
        top: 60,
        left: 0,
        width: '50%',
        backgroundColor: '#ffffff',
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 2,
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: {
            width: 3,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },

    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
    },

    menuIconContainer: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor:oscurecerColor(
            theme.colors.primary,
            0.10
        ),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    menuDivider: {
        width: '75%',
        height: 1,
        alignSelf: 'center',
        backgroundColor: theme.colors.border,
        opacity: 0.7,
    },

    menuIconItem: {
        fontSize: 18,
    },

    menuText: {
        color: theme.colors.textDark,
        fontSize: 15,
        fontWeight: '600',
    },
});