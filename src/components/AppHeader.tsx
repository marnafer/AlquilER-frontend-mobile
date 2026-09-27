import {
    StatusBar,
    StyleSheet,
    View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme/theme';

export default function AppHeader() {
    const insets = useSafeAreaInsets();

    return (
        <>
            <StatusBar
                barStyle="light-content"
                backgroundColor={theme.colors.primaryDark}
            />

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