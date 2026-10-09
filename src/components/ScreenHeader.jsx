import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { theme } from '../theme/theme';

const ScreenHeader = ({
    title,
    subtitle,
    showBackButton = false,
}) => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {showBackButton ? (
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Text style={styles.backButtonText}>
                        ←
                    </Text>
                </TouchableOpacity>
            ) : null}

            <View style={styles.titleContainer}>
                <Text style={styles.title}>
                    {title}
                </Text>

                {subtitle ? (
                    <Text style={styles.subtitle}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
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
        position: 'relative',
    },

    titleContainer: {
        alignItems: 'center',
    },

    title: {
        color: theme.colors.white,
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
    },

    subtitle: {
        marginTop:
            theme.spacing.sm,
        color: theme.colors.white,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        opacity: 0.9,
    },

    backButton: {
        position: 'absolute',
        left: theme.spacing.md,
        top: theme.spacing.md,
        width: 60,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primaryDark,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        zIndex: 1,
    },

    backButtonText: {
        color: theme.colors.white,
        fontSize: 35,
        fontWeight: '500',
        lineHeight: 25,
    },
});

export default ScreenHeader;