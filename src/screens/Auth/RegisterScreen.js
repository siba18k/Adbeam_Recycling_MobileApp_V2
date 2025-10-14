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
    Divider,
    HelperText
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen({ navigation }) {
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        studentNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        const { displayName, email, studentNumber, password, confirmPassword } = formData;

        if (!displayName.trim()) {
            Alert.alert('Error', 'Please enter your full name');
            return false;
        }

        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }

        // UJ email validation (optional - adjust as needed)
        if (!email.toLowerCase().includes('uj.ac.za') && !email.toLowerCase().includes('student.uj.ac.za')) {
            Alert.alert(
                'Invalid Email',
                'Please use your University of Johannesburg email address (e.g., student@uj.ac.za)'
            );
            return false;
        }

        if (!studentNumber.trim()) {
            Alert.alert('Error', 'Please enter your student number');
            return false;
        }

        // Student number validation (9 digits for UJ)
        if (!/^\d{9}$/.test(studentNumber)) {
            Alert.alert('Error', 'Student number must be 9 digits');
            return false;
        }

        if (!password) {
            Alert.alert('Error', 'Please enter a password');
            return false;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return false;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return false;
        }

        return true;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        const { displayName, email, studentNumber, password } = formData;

        const result = await register(email, password, displayName, studentNumber);

        if (result.success) {
            Alert.alert(
                'Registration Successful!',
                'Welcome to Adbeam Recycling! You can now start earning points by recycling.',
                [{ text: 'OK' }]
            );
            // User will be automatically redirected by AuthContext
        } else {
            Alert.alert('Registration Failed', result.error);
        }

        setIsLoading(false);
    };

    const hasErrors = (field) => {
        switch (field) {
            case 'email':
                return formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
            case 'studentNumber':
                return formData.studentNumber && !/^\d{9}$/.test(formData.studentNumber);
            case 'password':
                return formData.password && formData.password.length < 6;
            case 'confirmPassword':
                return formData.confirmPassword && formData.password !== formData.confirmPassword;
            default:
                return false;
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
                        <Headline style={styles.title}>Join Adbeam</Headline>
                        <Paragraph style={styles.subtitle}>
                            Create your account and start making a difference
                        </Paragraph>
                    </View>

                    {/* Registration Form */}
                    <Card style={styles.card}>
                        <Card.Content style={styles.cardContent}>
                            <Text style={styles.formTitle}>Create Account</Text>

                            <TextInput
                                label="Full Name"
                                value={formData.displayName}
                                onChangeText={(value) => updateField('displayName', value)}
                                mode="outlined"
                                autoCapitalize="words"
                                textContentType="name"
                                left={<TextInput.Icon icon="account" />}
                                style={styles.input}
                                disabled={isLoading}
                            />

                            <TextInput
                                label="Student Email"
                                value={formData.email}
                                onChangeText={(value) => updateField('email', value)}
                                mode="outlined"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoCompleteType="email"
                                textContentType="emailAddress"
                                left={<TextInput.Icon icon="email" />}
                                style={styles.input}
                                disabled={isLoading}
                                error={hasErrors('email')}
                            />
                            <HelperText type="error" visible={hasErrors('email')}>
                                Please enter a valid email address
                            </HelperText>

                            <TextInput
                                label="Student Number"
                                value={formData.studentNumber}
                                onChangeText={(value) => updateField('studentNumber', value)}
                                mode="outlined"
                                keyboardType="numeric"
                                maxLength={9}
                                left={<TextInput.Icon icon="school" />}
                                style={styles.input}
                                disabled={isLoading}
                                error={hasErrors('studentNumber')}
                            />
                            <HelperText type="error" visible={hasErrors('studentNumber')}>
                                Student number must be 9 digits
                            </HelperText>

                            <TextInput
                                label="Password"
                                value={formData.password}
                                onChangeText={(value) => updateField('password', value)}
                                mode="outlined"
                                secureTextEntry={!showPassword}
                                autoCompleteType="password"
                                textContentType="newPassword"
                                left={<TextInput.Icon icon="lock" />}
                                right={
                                    <TextInput.Icon
                                        icon={showPassword ? "eye-off" : "eye"}
                                        onPress={() => setShowPassword(!showPassword)}
                                    />
                                }
                                style={styles.input}
                                disabled={isLoading}
                                error={hasErrors('password')}
                            />
                            <HelperText type="error" visible={hasErrors('password')}>
                                Password must be at least 6 characters
                            </HelperText>

                            <TextInput
                                label="Confirm Password"
                                value={formData.confirmPassword}
                                onChangeText={(value) => updateField('confirmPassword', value)}
                                mode="outlined"
                                secureTextEntry={!showConfirmPassword}
                                textContentType="newPassword"
                                left={<TextInput.Icon icon="lock-check" />}
                                right={
                                    <TextInput.Icon
                                        icon={showConfirmPassword ? "eye-off" : "eye"}
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    />
                                }
                                style={styles.input}
                                disabled={isLoading}
                                error={hasErrors('confirmPassword')}
                            />
                            <HelperText type="error" visible={hasErrors('confirmPassword')}>
                                Passwords do not match
                            </HelperText>

                            <Button
                                mode="contained"
                                onPress={handleRegister}
                                loading={isLoading}
                                disabled={isLoading}
                                style={styles.registerButton}
                                contentStyle={styles.buttonContent}
                            >
                                Create Account
                            </Button>

                            <Divider style={styles.divider} />

                            <View style={styles.loginSection}>
                                <Text style={styles.loginText}>
                                    Already have an account?{' '}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Login')}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.loginLink}>
                                        Login here
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Card.Content>
                    </Card>
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
        marginBottom: 5,
    },
    registerButton: {
        backgroundColor: '#4CAF50',
        marginTop: 20,
        marginBottom: 20,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    divider: {
        marginVertical: 15,
    },
    loginSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#666',
        fontSize: 14,
    },
    loginLink: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: 'bold',
    },
});