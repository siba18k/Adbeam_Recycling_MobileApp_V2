import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function FloatingBackground({ children, circleColors = ['#27ae60', '#2ecc71', '#58d68d'] }) {
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const float3 = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Continuous floating animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(float1, {
                    toValue: -20,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(float1, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float2, {
                    toValue: -15,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.timing(float2, {
                    toValue: 0,
                    duration: 4000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float3, {
                    toValue: -25,
                    duration: 5000,
                    useNativeDriver: true,
                }),
                Animated.timing(float3, {
                    toValue: 0,
                    duration: 5000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: 20000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            {/* Floating Circles */}
            <Animated.View
                style={[
                    styles.floatingCircle,
                    styles.circle1,
                    { backgroundColor: circleColors[0], transform: [{ translateY: float1 }, { rotate: spin }] },
                ]}
            />
            <Animated.View
                style={[
                    styles.floatingCircle,
                    styles.circle2,
                    { backgroundColor: circleColors[1], transform: [{ translateY: float2 }] },
                ]}
            />
            <Animated.View
                style={[
                    styles.floatingCircle,
                    styles.circle3,
                    { backgroundColor: circleColors[2], transform: [{ translateY: float3 }] },
                ]}
            />

            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    floatingCircle: {
        position: 'absolute',
        borderRadius: 200,
        opacity: 0.1,
    },
    circle1: {
        width: 150,
        height: 150,
        top: 100,
        right: -50,
    },
    circle2: {
        width: 120,
        height: 120,
        top: 300,
        left: -40,
    },
    circle3: {
        width: 100,
        height: 100,
        bottom: 150,
        right: 30,
    },
});
