import {
    StyleSheet,
    View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme/theme';

export default function AppHeader() {
    const insets = useSafeAreaInsets();

    return (
        <>
            <StatusBar style="light" />

            <View
                style={[
                    styles.header,
                    {
                        height: insets.top,
                    },
                ]}
            />
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        width: '100%',
        backgroundColor: theme.colors.primaryDark,
    },
});