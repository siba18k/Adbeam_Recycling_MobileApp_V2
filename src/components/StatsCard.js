import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function StatsCard({
                                      icon,
                                      value,
                                      label,
                                      colors = ['#27ae60', '#229954'],
                                      onPress,
                                      delay = 0,
                                  }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);
    }, [delay]);

    const CardContent = (
        <LinearGradient colors={colors} style={styles.gradient}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={24} color="white" />
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </LinearGradient>
    );

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                },
            ]}
        >
            {onPress ? (
                <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                    {CardContent}
                </TouchableOpacity>
            ) : (
                CardContent
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    gradient: {
        padding: 20,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 8,
    },
    value: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.95)',
        textAlign: 'center',
        fontWeight: '600',
    },
});
