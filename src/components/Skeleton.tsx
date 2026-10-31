import { useEffect, useState } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { theme } from '../theme/theme';

type SkeletonProps = {
    style?: StyleProp<ViewStyle>;
    color?: string;
};

export default function Skeleton({
    style,
    color = theme.colors.border,
}: SkeletonProps) {
    const [opacity] = useState(() => new Animated.Value(0.45));

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 750,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.45,
                    duration: 750,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();

        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            accessible={false}
            style={[
                styles.base,
                { backgroundColor: color, opacity },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    base: {
        overflow: 'hidden',
    },
});
