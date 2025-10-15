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
    Text,
    HelperText
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, gradients } from '../../theme/colors';

const { width } = Dimensions.get('window');

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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }

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
                'Welcome to Adbeam! 🎉',
                'Your account has been created successfully. Start earning points by recycling!',
                [{ text: 'Get Started' }]
            );
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
                colors={gradients.primary}
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
                        <Text style={styles.title}>Join Adbeam</Text>
                        <Text style={styles.subtitle}>
                            Create your account and start making a difference
                        </Text>
                    </View>

                    {/* Registration Form */}
                    <View style={styles.cardContainer}>
                        <BlurView intensity={20} tint="light" style={styles.cardBlur}>
                            <LinearGradient
                                colors={[colors.surface.white, colors.surface.light]}
                                style={styles.card}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.cardContent}>
                                    <Text style={styles.formTitle}>Create Account</Text>

                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            label="Full Name"
                                            value={formData.displayName}
                                            onChangeText={(value) => updateField('displayName', value)}
                                            mode="outlined"
                                            autoCapitalize="words"
                                            textContentType="name"
                                            left={<TextInput.Icon icon="account-outline" />}
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
                                            label="Student Email"
                                            value={formData.email}
                                            onChangeText={(value) => updateField('email', value)}
                                            mode="outlined"
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            autoCompleteType="email"
                                            textContentType="emailAddress"
                                            left={<TextInput.Icon icon="email-outline" />}
                                            style={styles.input}
                                            disabled={isLoading}
                                            error={hasErrors('email')}
                                            theme={{
                                                colors: {
                                                    primary: colors.primary.main,
                                                    outline: colors.primary.light,
                                                    error: colors.status.error
                                                }
                                            }}
                                        />
                                        <HelperText type="error" visible={hasErrors('email')}>
                                            Please enter a valid email address
                                        </HelperText>
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            label="Student Number"
                                            value={formData.studentNumber}
                                            onChangeText={(value) => updateField('studentNumber', value)}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            maxLength={9}
                                            left={<TextInput.Icon icon="school-outline" />}
                                            style={styles.input}
                                            disabled={isLoading}
                                            error={hasErrors('studentNumber')}
                                            theme={{
                                                colors: {
                                                    primary: colors.primary.main,
                                                    outline: colors.primary.light,
                                                    error: colors.status.error
                                                }
                                            }}
                                        />
                                        <HelperText type="error" visible={hasErrors('studentNumber')}>
                                            Student number must be 9 digits
                                        </HelperText>
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            label="Password"
                                            value={formData.password}
                                            onChangeText={(value) => updateField('password', value)}
                                            mode="outlined"
                                            secureTextEntry={!showPassword}
                                            autoCompleteType="password"
                                            textContentType="newPassword"
                                            left={<TextInput.Icon icon="lock-outline" />}
                                            right={
                                                <TextInput.Icon
                                                    icon={showPassword ? "eye-off-outline" : "eye-outline"}
                                                    onPress={() => setShowPassword(!showPassword)}
                                                />
                                            }
                                            style={styles.input}
                                            disabled={isLoading}
                                            error={hasErrors('password')}
                                            theme={{
                                                colors: {
                                                    primary: colors.primary.main,
                                                    outline: colors.primary.light,
                                                    error: colors.status.error
                                                }
                                            }}
                                        />
                                        <HelperText type="error" visible={hasErrors('password')}>
                                            Password must be at least 6 characters
                                        </HelperText>
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            label="Confirm Password"
                                            value={formData.confirmPassword}
                                            onChangeText={(value) => updateField('confirmPassword', value)}
                                            mode="outlined"
                                            secureTextEntry={!showConfirmPassword}
                                            textContentType="newPassword"
                                            left={<TextInput.Icon icon="lock-check-outline" />}
                                            right={
                                                <TextInput.Icon
                                                    icon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                                />
                                            }
                                            style={styles.input}
                                            disabled={isLoading}
                                            error={hasErrors('confirmPassword')}
                                            theme={{
                                                colors: {
                                                    primary: colors.primary.main,
                                                    outline: colors.primary.light,
                                                    error: colors.status.error
                                                }
                                            }}
                                        />
                                        <HelperText type="error" visible={hasErrors('confirmPassword')}>
                                            Passwords do not match
                                        </HelperText>
                                    </View>

                                    <LinearGradient
                                        colors={gradients.success} // Bright green for CTA
                                        style={styles.registerButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <TouchableOpacity
                                            onPress={handleRegister}
                                            disabled={isLoading}
                                            style={styles.registerButtonContent}
                                        >
                                            {isLoading ? (
                                                <View style={styles.loadingContainer}>
                                                    <Text style={styles.registerButtonText}>Creating Account...</Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.registerButtonText}>Create Account</Text>
                                            )}
                                        </TouchableOpacity>
                                    </LinearGradient>

                                    <View style={styles.dividerContainer}>
                                        <View style={styles.dividerLine} />
                                        <Text style={styles.dividerText}>or</Text>
                                        <View style={styles.dividerLine} />
                                    </View>

                                    <View style={styles.loginSection}>
                                        <Text style={styles.loginText}>
                                            Already have an account?{' '}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('Login')}
                                            disabled={isLoading}
                                        >
                                            <LinearGradient
                                                colors={gradients.backgroundSecondary} // Vibrant green
                                                style={styles.gradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <Text style={styles.loginLink}>
                                                    Sign In
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </LinearGradient>
                        </BlurView>
                    </View>
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
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoBackground: {
        width: 70,
        height: 70,
        borderRadius: 35,
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
        fontSize: 28,
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
        padding: 28,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 28,
        color: colors.text.primary,
        letterSpacing: -0.3,
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: colors.surface.white,
        fontSize: 16,
    },
    registerButton: {
        borderRadius: 16,
        marginTop: 16,
        marginBottom: 24,
        shadowColor: colors.success.main,
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    registerButtonContent: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    registerButtonText: {
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
        marginVertical: 20,
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
    loginSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    loginText: {
        color: colors.text.secondary,
        fontSize: 16,
        fontWeight: '400',
    },
    loginLinkGradient: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    loginLink: {
        color: colors.text.inverse,
        fontSize: 16,
        fontWeight: '700',
    },
});
