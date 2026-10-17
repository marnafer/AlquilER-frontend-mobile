import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  Keyframe,
  ZoomIn,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { theme } from '../theme/theme';


const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    20: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1 }],
      easing: Easing.elastic(0.7),
    },
  });

  const image = <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />;

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {image}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {image}
    </View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.iconContainer}>
        <Animated.View
          entering={ZoomIn.duration(700).easing(Easing.out(Easing.back(1.2)))}
          style={styles.background}
        />

        <Animated.View
          entering={FadeIn.duration(800)}
          style={styles.imageContainer}
        >
          <Image
            style={styles.image}
            source={require('@/assets/images/icon.png')}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      <Animated.Text
        entering={FadeInDown.delay(250).duration(500)}
        style={styles.loadingTitle}
      >
        Preparando tu próximo lugar
      </Animated.Text>

      <Animated.View
        entering={FadeIn.delay(450).duration(500)}
        style={styles.loadingStatus}
      >
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
        />

        <Text style={styles.loadingText}>
          Cargando propiedades...
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage:
        `linear-gradient(180deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
    width: 128,
    height: 128,
    position: 'absolute',
},
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
},
loadingContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: theme.spacing.lg,
},

loadingTitle: {
  marginTop: theme.spacing.lg,
  fontSize: 20,
  fontWeight: '700',
  color: theme.colors.textDark,
  textAlign: 'center',
},

loadingStatus: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.sm,
  marginTop: theme.spacing.md,
},

loadingText: {
  fontSize: theme.sizes.body,
  color: theme.colors.textMuted,
},
});
