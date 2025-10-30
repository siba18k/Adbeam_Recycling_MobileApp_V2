import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AnimatedCard({
                                         children,
                                         colors = ['#ffffff', '#f9fafb'],
                                         style,
                                         delay = 0,
                                         duration = 800, // Slower for visibility
                                         vibrant = false,
                                     }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current; // More dramatic slide
    const scaleAnim = useRef(new Animated.Value(0.7)).current; // More dramatic scale
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: duration,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: duration,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6, // More bouncy
                    tension: 50,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);

        if (vibrant) {
            // Add continuous pulse for vibrant cards
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Add subtle rotation
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 10000,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [delay, duration, vibrant]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '5deg'],
    });

    return (
        <Animated.View
            style={[
                styles.container,
                style,
                {
                    opacity: fadeAnim,
                    transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim },
                        { scale: pulseAnim },
                        ...(vibrant ? [{ rotate: spin }] : [])
                    ],
                },
            ]}
        >
            <LinearGradient colors={colors} style={styles.gradient}>
                {children}
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 24, // More rounded
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    gradient: {
        padding: 20,
    },
});
