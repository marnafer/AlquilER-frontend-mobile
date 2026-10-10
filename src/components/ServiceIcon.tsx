import { StyleSheet, Text, View } from 'react-native';

import { iconoServicio } from '../utils/servicios';
import { theme } from '../theme/theme';

export default function ServiceIcon({ nombre }: { nombre: string }) {
    return (
        <View style={styles.container} accessible accessibilityLabel={nombre}>
            <Text style={styles.icon} accessibilityElementsHidden>
                {iconoServicio(nombre)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 52,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: theme.colors.primaryBg,
    },
    icon: {
        fontSize: 25,
    },
});
