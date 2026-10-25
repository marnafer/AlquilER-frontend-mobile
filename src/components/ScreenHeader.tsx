import {
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { theme } from '../theme/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
};

const ScreenHeader = ({ title, subtitle }: ScreenHeaderProps) => {
    return (
        <View style={styles.container}>
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

            <Image
                source={require('../../assets/images/logo512.png')}
                style={styles.logo}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
        backgroundColor: theme.colors.primary,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        position: 'relative',
    },

    titleContainer: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 53,
    },

    title: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        flexShrink: 1,
    },

    subtitle: {
        marginTop: theme.spacing.sm,
        color: '#ffffff',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        opacity: 0.9,
    },

    logo: {
        position: 'absolute',
        top: -4,
        right: theme.spacing.sm,
        width: 76,
        height: 76,
    },
});

export default ScreenHeader;