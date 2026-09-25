import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme/theme';

export default function AppHeader() {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.header,
                {
                    paddingTop: insets.top + theme.spacing.headerTop,
                },
            ]}
        >
            <View style={styles.content}>
                <Text style={styles.logo}>
                    AlquilER
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: theme.colors.primaryDark,
    },

    content: {
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.lg,
    },

    logo: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '800',
    },
});