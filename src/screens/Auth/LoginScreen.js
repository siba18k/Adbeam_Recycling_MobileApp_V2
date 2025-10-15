import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import {
    TextInput,
    Button,
    Text,
    Card,
    Divider
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, gradients } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login, resetPassword } = useAuth();

    const validateForm = () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return false;
        }

        if (!password) {
            Alert.alert('Error', 'Please enter your password');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        const result = await login(email, password);

        if (!result.success) {
            Alert.alert('Login Failed', result.error);
        }

        setIsLoading(false);
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            Alert.alert(
                'Email Required',
                'Please enter your email address first, then tap "Forgot Password" again.',
                [{ text: 'OK' }]
            );
            return;
        }

        const result = await resetPassword(email);

        if (result.success) {
            Alert.alert(
                'Reset Email Sent',
                'Please check your email for password reset instructions.',
                [{ text: 'OK' }]
            );
        } else {
            Alert.alert('Error', result.error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={gradients.success}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Background decoration */}
                <View style={styles.backgroundDecoration}>
                    <LinearGradient
                        colors={[colors.surface.glass, 'transparent']}
                        style={[styles.decorationCircle, styles.circle1]}
                    />
                    <LinearGradient
                        colors={[colors.surface.glass, 'transparent']}
                        style={[styles.decorationCircle, styles.circle2]}
                    />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={[colors.surface.white, colors.surface.light]}
                                style={styles.logoBackground}
                            >
                                <Ionicons name="leaf" size={40} color={colors.success.main} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>
                            Sign in to continue your eco-journey
                        </Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.cardContainer}>
                        <BlurView intensity={20} tint="light" style={styles.cardBlur}>
                            <LinearGradient
                                colors={[colors.surface.white, colors.surface.light]}
                                style={styles.card}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.cardContent}>
                                    <Text style={styles.formTitle}>Sign In</Text>

                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            label="Email Address"
                                            value={email}
                                            onChangeText={setEmail}
                                            mode="outlined"
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            autoCompleteType="email"
                                            textContentType="emailAddress"
                                            left={<TextInput.Icon icon="email-outline" />}
                                            style={styles.input}
                                            disabled={isLoading}
                                            theme={{
                                                colors: {
                                                    primary: colors.primary.main,
                                                    outline: colors.primary.light
                                                }
                                            }}
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            label="Password"
                                            value={password}
                                            onChangeText={setPassword}
                                            mode="outlined"
                                            secureTextEntry={!showPassword}
                                            autoCompleteType="password"
                                            textContentType="password"
                                            left={<TextInput.Icon icon="lock-outline" />}
                                            right={
                                                <TextInput.Icon
                                                    icon={showPassword ? "eye-off-outline" : "eye-outline"}
                                                    onPress={() => setShowPassword(!showPassword)}
                                                />
                                            }
                                            style={styles.input}
                                            disabled={isLoading}
                                            theme={{
                                                colors: {
                                                    primary: colors.primary.main,
                                                    outline: colors.primary.light
                                                }
                                            }}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleForgotPassword}
                                        style={styles.forgotPassword}
                                        disabled={isLoading}
                                    >
                                        <Text style={styles.forgotPasswordText}>
                                            Forgot Password?
                                        </Text>
                                    </TouchableOpacity>

                                    <LinearGradient
                                        colors={gradients.accent} // Changed from gradients.secondary
                                        style={styles.registerLinkGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <TouchableOpacity
                                            onPress={handleLogin}
                                            disabled={isLoading}
                                            style={styles.loginButtonContent}
                                        >
                                            {isLoading ? (
                                                <View style={styles.loadingContainer}>
                                                    <Text style={styles.loginButtonText}>Signing In...</Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.loginButtonText}>Sign In</Text>
                                            )}
                                        </TouchableOpacity>
                                    </LinearGradient>

                                    <View style={styles.dividerContainer}>
                                        <View style={styles.dividerLine} />
                                        <Text style={styles.dividerText}>or</Text>
                                        <View style={styles.dividerLine} />
                                    </View>

                                    <View style={styles.registerSection}>
                                        <Text style={styles.registerText}>
                                            Don't have an account?{' '}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('Register')}
                                            disabled={isLoading}
                                        >
                                            <LinearGradient
                                                colors={gradients.secondary}
                                                style={styles.registerLinkGradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            >
                                                <Text style={styles.registerLink}>
                                                    Sign Up
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </LinearGradient>
                        </BlurView>
                    </View>

                    {/* Demo Credentials */}
                    {__DEV__ && (
                        <View style={styles.demoContainer}>
                            <TouchableOpacity
                                style={styles.demoButton}
                                onPress={() => {
                                    setEmail('demo@student.uj.ac.za');
                                    setPassword('demo123');
                                }}
                            >
                                <LinearGradient
                                    colors={[colors.status.warning, '#f59e0b']}
                                    style={styles.demoButtonGradient}
                                >
                                    <Text style={styles.demoButtonText}>Use Demo Account</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    backgroundDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    decorationCircle: {
        position: 'absolute',
        borderRadius: 200,
    },
    circle1: {
        width: 400,
        height: 400,
        top: -200,
        right: -200,
    },
    circle2: {
        width: 300,
        height: 300,
        bottom: -150,
        left: -150,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logoBackground: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.shadow.light,
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.text.inverse,
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: colors.text.inverse,
        textAlign: 'center',
        opacity: 0.9,
        fontWeight: '400',
    },
    cardContainer: {
        marginBottom: 24,
    },
    cardBlur: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    card: {
        borderRadius: 24,
        shadowColor: colors.shadow.heavy,
        shadowOffset: {
            width: 0,
            height: 16,
        },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },
    cardContent: {
        padding: 32,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 32,
        color: colors.text.primary,
        letterSpacing: -0.3,
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: colors.surface.white,
        fontSize: 16,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 32,
        paddingVertical: 4,
    },
    forgotPasswordText: {
        color: colors.primary.main,
        fontSize: 14,
        fontWeight: '600',
    },
    loginButton: {
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: colors.primary.main,
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    loginButtonContent: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonText: {
        color: colors.text.inverse,
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.text.light,
    },
    dividerText: {
        marginHorizontal: 16,
        color: colors.text.secondary,
        fontSize: 14,
        fontWeight: '500',
    },
    registerSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    registerText: {
        color: colors.text.secondary,
        fontSize: 16,
        fontWeight: '400',
    },
    registerLinkGradient: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    registerLink: {
        color: colors.text.inverse,
        fontSize: 16,
        fontWeight: '700',
    },
    demoContainer: {
        alignItems: 'center',
    },
    demoButton: {
        borderRadius: 12,
    },
    demoButtonGradient: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    demoButtonText: {
        color: colors.text.inverse,
        fontSize: 14,
        fontWeight: '600',
    },
});
