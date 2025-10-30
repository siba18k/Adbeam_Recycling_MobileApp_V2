import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation, route }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Floating animations for decorative elements
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const float3 = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Main entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous floating animations
        const floatingAnimation1 = Animated.loop(
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
        );

        const floatingAnimation2 = Animated.loop(
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
        );

        const floatingAnimation3 = Animated.loop(
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
        );

        const rotateAnimation = Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: 20000,
                useNativeDriver: true,
            })
        );

        floatingAnimation1.start();
        floatingAnimation2.start();
        floatingAnimation3.start();
        rotateAnimation.start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleLogin = async () => {
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
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

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                            },
                        ]}
                    >
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoCircle}>
                                <Ionicons name="leaf" size={50} color="#145a32" />
                            </View>
                            <Text style={styles.appName}>AdBeam Recycling</Text>
                        </View>

                        {/* Login Card */}
                        <View style={styles.card}>
                            <Text style={styles.title}>Welcome Back!</Text>
                            <Text style={styles.subtitle}>Login to continue your eco-journey</Text>

                            {/* Email Input */}
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#27ae60" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#95a5a6"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color="#27ae60" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#95a5a6"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="#7f8c8d"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Login Button */}
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#27ae60', '#229954']}
                                    style={styles.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <Text style={styles.buttonText}>Logging in...</Text>
                                    ) : (
                                        <Text style={styles.buttonText}>Login</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Register Link */}
                            <Text style={styles.registerText}>
                                Don't have an account?{' '}
                                <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
                                    Sign Up
                                </Text>
                            </Text>

                            <Text style={styles.devModeText}>🌱 Every login helps save our planet</Text>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    content: {
        width: '100%',
        alignItems: 'center',
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
        top: 100,
        right: -50,
    },
    circle2: {
        width: 100,
        height: 100,
        backgroundColor: '#2ecc71',
        top: 200,
        left: -30,
    },
    circle3: {
        width: 120,
        height: 120,
        backgroundColor: '#27ae60',
        bottom: 150,
        right: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#27ae60',
        shadowOpacity: 0.3,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 5 },
        elevation: 8,
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#145a32',
        marginTop: 10,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        width: '85%',
        paddingVertical: 30,
        paddingHorizontal: 20,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 5,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#145a32',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#3e6551',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputWrapper: {
        width: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#2ecc71',
        paddingHorizontal: 15,
        height: 50,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#145a32',
        fontSize: 16,
    },
    eyeIcon: {
        padding: 5,
    },
    button: {
        width: '90%',
        marginTop: 5,
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#bdc3c7',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#7f8c8d',
        fontSize: 12,
        fontWeight: '600',
    },
    registerText: {
        marginTop: 15,
        color: '#3e6551',
        fontSize: 14,
    },
    link: {
        color: '#145a32',
        fontWeight: '700',
    },
    devModeText: {
        marginTop: 15,
        fontSize: 11,
        color: '#27ae60',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingHorizontal: 10,
    },
});
