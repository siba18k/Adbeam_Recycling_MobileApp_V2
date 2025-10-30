import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    // Floating animations
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const float3 = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    // Feature animations
    const feature1Anim = useRef(new Animated.Value(0)).current;
    const feature2Anim = useRef(new Animated.Value(0)).current;
    const feature3Anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Staggered entrance animations
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(slideUpAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]),
            Animated.stagger(200, [
                Animated.spring(feature1Anim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.spring(feature2Anim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.spring(feature3Anim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Continuous floating animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(float1, {
                    toValue: -15,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(float1, {
                    toValue: 0,
                    duration: 2500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float2, {
                    toValue: -20,
                    duration: 3500,
                    useNativeDriver: true,
                }),
                Animated.timing(float2, {
                    toValue: 0,
                    duration: 3500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float3, {
                    toValue: -18,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.timing(float3, {
                    toValue: 0,
                    duration: 4000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: 15000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleGetStarted = async () => {
        try {
            await AsyncStorage.setItem('hasSeenWelcome', 'true');
            navigation.replace('Login');
        } catch (error) {
            console.log('Error saving welcome status:', error);
            navigation.replace('Login');
        }
    };

    return (
        <LinearGradient colors={['#a8e6cf', '#dcedc1', '#ffffff']} style={styles.container}>
            {/* Animated Decorative Elements */}
            <Animated.View
                style={[
                    styles.decorativeCircle,
                    styles.circle1,
                    { transform: [{ translateY: float1 }, { rotate: spin }] },
                ]}
            />
            <Animated.View
                style={[
                    styles.decorativeCircle,
                    styles.circle2,
                    { transform: [{ translateY: float2 }] },
                ]}
            />
            <Animated.View
                style={[
                    styles.decorativeCircle,
                    styles.circle3,
                    { transform: [{ translateY: float3 }] },
                ]}
            />

            <View style={styles.content}>
                {/* Logo with Animation */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.logoCircle}>
                        <Image
                            source={require('../../assets/icon.png')}
                            style={styles.appIcon}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.appName}>AdBeam Recycling</Text>
                    <Text style={styles.tagline}>Recycle. Earn. Redeem.</Text>
                </Animated.View>

                {/* Features with Staggered Animation */}
                <View style={styles.featuresContainer}>
                    <Animated.View
                        style={[
                            styles.feature,
                            {
                                opacity: feature1Anim,
                                transform: [
                                    {
                                        translateX: feature1Anim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-50, 0],
                                        }),
                                    },
                                    { scale: feature1Anim },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.featureIconContainer}>
                            <Ionicons name="scan" size={40} color="#27ae60" />
                        </View>
                        <Text style={styles.featureTitle}>Scan Items</Text>
                        <Text style={styles.featureText}>Scan barcodes or QR codes on recyclable items</Text>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.feature,
                            {
                                opacity: feature2Anim,
                                transform: [
                                    {
                                        translateX: feature2Anim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [50, 0],
                                        }),
                                    },
                                    { scale: feature2Anim },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.featureIconContainer}>
                            <Ionicons name="trophy" size={40} color="#27ae60" />
                        </View>
                        <Text style={styles.featureTitle}>Earn Points</Text>
                        <Text style={styles.featureText}>Get rewarded for every item you recycle</Text>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.feature,
                            {
                                opacity: feature3Anim,
                                transform: [
                                    {
                                        translateX: feature3Anim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-50, 0],
                                        }),
                                    },
                                    { scale: feature3Anim },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.featureIconContainer}>
                            <Ionicons name="gift" size={40} color="#27ae60" />
                        </View>
                        <Text style={styles.featureTitle}>Redeem Rewards</Text>
                        <Text style={styles.featureText}>Exchange points for vouchers and prizes</Text>
                    </Animated.View>
                </View>

                {/* Get Started Button with Animation */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
                        <LinearGradient
                            colors={['#27ae60', '#229954']}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.buttonText}>Get Started</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.Text style={[styles.footerText, { opacity: fadeAnim }]}>
                    Join the green revolution today! 🌱
                </Animated.Text>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 200,
        opacity: 0.15,
    },
    circle1: {
        width: 150,
        height: 150,
        backgroundColor: '#27ae60',
        top: 80,
        right: -40,
    },
    circle2: {
        width: 120,
        height: 120,
        backgroundColor: '#2ecc71',
        top: 250,
        left: -40,
    },
    circle3: {
        width: 100,
        height: 100,
        backgroundColor: '#27ae60',
        bottom: 100,
        right: 30,
    },
    content: {
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#27ae60',
        shadowOpacity: 0.3,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 5 },
        elevation: 8,
    },
    appIcon: {
        width: 80,
        height: 80,
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        color: '#145a32',
        marginTop: 15,
    },
    tagline: {
        fontSize: 16,
        color: '#3e6551',
        marginTop: 5,
        fontStyle: 'italic',
    },
    featuresContainer: {
        width: '100%',
        marginVertical: 20,
    },
    feature: {
        alignItems: 'center',
        marginBottom: 25,
        paddingHorizontal: 20,
    },
    featureIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#27ae60',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 5,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#145a32',
        marginTop: 10,
    },
    featureText: {
        fontSize: 14,
        color: '#3e6551',
        textAlign: 'center',
        marginTop: 5,
    },
    button: {
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: '#27ae60',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    buttonGradient: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    footerText: {
        fontSize: 14,
        color: '#3e6551',
        marginTop: 10,
    },
});
