import { StyleSheet, useWindowDimensions, View } from 'react-native';

import Skeleton from './Skeleton';
import { theme } from '../theme/theme';

type PropertyCardSkeletonProps = {
    compacto?: boolean;
};

export default function PropertyCardSkeleton({
    compacto = false,
}: PropertyCardSkeletonProps) {
    const { width } = useWindowDimensions();
    const cardWidth = compacto
        ? width * 0.4
        : (width - theme.spacing.md * 3) / 2;

    return (
        <View
            style={[
                styles.card,
                { width: cardWidth },
                !compacto && { height: cardWidth / 1.5 + 165 },
                compacto && styles.compactCard,
            ]}
        >
            <Skeleton style={styles.image} />

            <View style={[styles.details, compacto && styles.compactDetails]}>
                <Skeleton style={styles.title} />
                <Skeleton style={styles.location} />
                <Skeleton style={styles.price} />

                <View style={styles.features}>
                    <Skeleton style={styles.feature} />
                    <Skeleton style={styles.feature} />
                    <Skeleton style={styles.feature} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        backgroundColor: theme.colors.inputBg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    compactCard: {
        borderRadius: 12,
        alignSelf: 'stretch',
    },
    image: {
        width: '100%',
        aspectRatio: 1.5,
    },
    details: {
        padding: 14,
        gap: 9,
    },
    compactDetails: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.md + 4,
        gap: 7,
    },
    title: {
        width: '90%',
        height: 17,
        borderRadius: 5,
    },
    location: {
        width: '75%',
        height: 12,
        borderRadius: 5,
    },
    price: {
        width: '55%',
        height: 18,
        borderRadius: 5,
    },
    features: {
        flexDirection: 'row',
        gap: 8,
    },
    feature: {
        width: 27,
        height: 12,
        borderRadius: 5,
    },
});
