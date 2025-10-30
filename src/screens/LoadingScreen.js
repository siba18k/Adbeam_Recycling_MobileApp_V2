import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LoadingScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Initial fade and scale animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous rotation
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        ).start();

        // Pulsing animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <LinearGradient colors={['#a8e6cf', '#dcedc1', '#ffffff']} style={styles.container}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Logo */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            transform: [{ rotate: spin }, { scale: pulseAnim }],
                        },
                    ]}
                >
                    <LinearGradient
                        colors={['#27ae60', '#229954']}
                        style={styles.logoCircle}
                    >
                        <Ionicons name="leaf" size={60} color="#fff" />
                    </LinearGradient>
                </Animated.View>

                {/* App Name */}
                <Text style={styles.appName}>AdBeam Recycling</Text>
                <Text style={styles.tagline}>Loading your eco-journey...</Text>

                {/* Loading Dots */}
                <View style={styles.dotsContainer}>
                    <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
                    <Animated.View
                        style={[
                            styles.dot,
                            {
                                opacity: pulseAnim,
                                transform: [{ scale: pulseAnim }],
                            },
                        ]}
                    />
                    <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
                </View>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 30,
        shadowColor: '#27ae60',
        shadowOpacity: 0.3,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        color: '#145a32',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: '#3e6551',
        marginBottom: 40,
        fontStyle: 'italic',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#27ae60',
    },
});
