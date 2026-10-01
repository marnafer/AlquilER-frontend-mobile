import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { theme } from '../theme/theme';

const ScreenHeader = ({
    title,
    subtitle,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {title}
            </Text>

            {subtitle ? (
                <Text style={styles.subtitle}>
                    {subtitle}
                </Text>
            ) : null}
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
    },

    title: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
    },

    subtitle: {
        marginTop:
            theme.spacing.sm,
        color: '#ffffff',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        opacity: 0.9,
    },
});

export default ScreenHeader;