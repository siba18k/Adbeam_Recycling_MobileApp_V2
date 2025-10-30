import { Animated } from 'react-native';

export const createFadeAnimation = (value, duration = 600, delay = 0) => {
    return Animated.timing(value, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
    });
};

export const createSlideAnimation = (value, from = 30, duration = 600, delay = 0) => {
    return Animated.timing(value, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
    });
};

export const createScaleAnimation = (value, duration = 600, delay = 0) => {
    return Animated.spring(value, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
    });
};

export const createStaggeredAnimation = (animations, stagger = 100) => {
    return Animated.stagger(stagger, animations);
};

export const createFloatingAnimation = (value, distance = -20, duration = 3000) => {
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

export const createRotateAnimation = (value, duration = 20000) => {
    return Animated.loop(
        Animated.timing(value, {
            toValue: 1,
            duration,
            useNativeDriver: true,
        })
    );
};

export const createPulseAnimation = (value, scale = 1.1, duration = 1000) => {
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

export const interpolateRotation = (animatedValue) => {
    return animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
};
