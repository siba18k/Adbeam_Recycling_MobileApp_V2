import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    TouchableOpacity
} from 'react-native';
import {
    TextInput,
    Button,
    Text,
    Card,
    Headline,
    Paragraph,
    Divider
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

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

        // Basic email validation
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
        // Success is handled by AuthContext - user will be redirected automatically

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
                colors={['#4CAF50', '#45a049']}
                style={styles.gradient}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Ionicons name="leaf" size={60} color="white" />
                        <Headline style={styles.title}>Adbeam Recycling</Headline>
                        <Paragraph style={styles.subtitle}>
                            Welcome back! Login to continue your eco-journey
                        </Paragraph>
                    </View>

                    {/* Login Form */}
                    <Card style={styles.card}>
                        <Card.Content style={styles.cardContent}>
                            <Text style={styles.formTitle}>Login</Text>

                            <TextInput
                                label="Email Address"
                                value={email}
                                onChangeText={setEmail}
                                mode="outlined"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoCompleteType="email"
                                textContentType="emailAddress"
                                left={<TextInput.Icon icon="email" />}
                                style={styles.input}
                                disabled={isLoading}
                            />

                            <TextInput
                                label="Password"
                                value={password}
                                onChangeText={setPassword}
                                mode="outlined"
                                secureTextEntry={!showPassword}
                                autoCompleteType="password"
                                textContentType="password"
                                left={<TextInput.Icon icon="lock" />}
                                right={
                                    <TextInput.Icon
                                        icon={showPassword ? "eye-off" : "eye"}
                                        onPress={() => setShowPassword(!showPassword)}
                                    />
                                }
                                style={styles.input}
                                disabled={isLoading}
                            />

                            <TouchableOpacity
                                onPress={handleForgotPassword}
                                style={styles.forgotPassword}
                                disabled={isLoading}
                            >
                                <Text style={styles.forgotPasswordText}>
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>

                            <Button
                                mode="contained"
                                onPress={handleLogin}
                                loading={isLoading}
                                disabled={isLoading}
                                style={styles.loginButton}
                                contentStyle={styles.buttonContent}
                            >
                                Login
                            </Button>

                            <Divider style={styles.divider} />

                            <View style={styles.registerSection}>
                                <Text style={styles.registerText}>
                                    Don't have an account?{' '}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Register')}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.registerLink}>
                                        Sign up here
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Demo Credentials (Remove in production) */}
                    {__DEV__ && (
                        <Card style={[styles.card, styles.demoCard]}>
                            <Card.Content>
                                <Text style={styles.demoTitle}>Demo Credentials</Text>
                                <Text style={styles.demoText}>
                                    Email: demo@student.uj.ac.za{'\n'}
                                    Password: demo123
                                </Text>
                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        setEmail('demo@student.uj.ac.za');
                                        setPassword('demo123');
                                    }}
                                    style={styles.demoButton}
                                >
                                    Use Demo Account
                                </Button>
                            </Card.Content>
                        </Card>
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
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 10,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: 5,
        fontSize: 16,
    },
    card: {
        elevation: 8,
        borderRadius: 15,
    },
    cardContent: {
        padding: 25,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    input: {
        marginBottom: 15,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: '#4CAF50',
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: '#4CAF50',
        marginBottom: 20,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    divider: {
        marginVertical: 15,
    },
    registerSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerText: {
        color: '#666',
        fontSize: 14,
    },
    registerLink: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: 'bold',
    },
    demoCard: {
        marginTop: 20,
        backgroundColor: '#FFF3E0',
    },
    demoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E65100',
        marginBottom: 10,
    },
    demoText: {
        color: '#BF360C',
        fontSize: 12,
        marginBottom: 10,
    },
    demoButton: {
        borderColor: '#FF9800',
    },
});
