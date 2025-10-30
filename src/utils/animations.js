import { Animated } from 'react-native';

export const createEnhancedFadeAnimation = (value, duration = 800, delay = 0) => {
    return Animated.timing(value, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
    });
};

export const createDramaticSlideAnimation = (value, from = 60, duration = 800, delay = 0) => {
    return Animated.timing(value, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
    });
};

export const createBouncyScaleAnimation = (value, duration = 800, delay = 0) => {
    return Animated.spring(value, {
        toValue: 1,
        friction: 5, // More bouncy
        tension: 60, // More dramatic
        delay,
        useNativeDriver: true,
    });
};

export const createVibrantFloatingAnimation = (value, distance = -35, duration = 2500) => {
    return Animated.loop(
        Animated.sequence([
            Animated.timing(value, {
                toValue: distance,
                duration,
                useNativeDriver: true,
            }),
            Animated.timing(value, {
                toValue: 0,
                duration,
                useNativeDriver: true,
            }),
        ])
    );
};

export const createSparkleAnimation = (value, duration = 1500) => {
    return Animated.loop(
        Animated.sequence([
            Animated.timing(value, {
                toValue: 1,
                duration,
                useNativeDriver: true,
            }),
            Animated.timing(value, {
                toValue: 0,
                duration,
                useNativeDriver: true,
            }),
        ])
    );
};

export const createRainbowRotateAnimation = (value, duration = 8000) => {
    return Animated.loop(
        Animated.timing(value, {
            toValue: 1,
            duration,
            useNativeDriver: true,
        })
    );
};

export const createPulseScaleAnimation = (value, scale = 1.1, duration = 1200) => {
    return Animated.loop(
        Animated.sequence([
            Animated.timing(value, {
                toValue: scale,
                duration: duration / 2,
                useNativeDriver: true,
            }),
            Animated.timing(value, {
                toValue: 1,
                duration: duration / 2,
                useNativeDriver: true,
            }),
        ])
    );
};

export const createStaggeredEntranceAnimation = (animations, stagger = 150) => {
    return Animated.stagger(stagger, animations);
};

export const interpolateColorRotation = (animatedValue) => {
    return animatedValue.interpolate({
        inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
        outputRange: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF6B6B'],
    });
};

export const interpolateEnhancedRotation = (animatedValue, degrees = '360deg') => {
    return animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', degrees],
    });
};
