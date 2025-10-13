import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserProfile, getUserProfile } from '../services/simpleDatabase';

const AuthContext = createContext({
    user: null,
    userProfile: null,
    loading: true,
    register: async () => {},
    login: async () => {},
    logout: async () => {},
    refreshUserProfile: async () => {},
    resetPassword: async () => {}
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    console.log('User authenticated:', firebaseUser.uid);
                    setUser(firebaseUser);
                    await loadUserProfile(firebaseUser.uid);
                } else {
                    console.log('User not authenticated');
                    setUser(null);
                    setUserProfile(null);
                }
            } catch (error) {
                console.error('Auth state change error:', error);
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const loadUserProfile = async (userId) => {
        try {
            const result = await getUserProfile(userId);
            if (result.success) {
                setUserProfile(result.data);
                console.log('User profile loaded:', result.data);
            } else {
                console.log('No user profile found, may need to create one');
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    };

    const register = async (email, password, displayName, studentNumber) => {
        try {
            setLoading(true);

            // Validate inputs
            if (!email || !password || !displayName || !studentNumber) {
                return {
                    success: false,
                    error: 'All fields are required'
                };
            }

            if (password.length < 6) {
                return {
                    success: false,
                    error: 'Password must be at least 6 characters'
                };
            }

            // Create user account
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email.trim().toLowerCase(),
                password
            );

            // Update display name
            await updateProfile(userCredential.user, {
                displayName: displayName.trim()
            });

            // Create user profile in database
            const profileResult = await createUserProfile(userCredential.user.uid, {
                email: email.trim().toLowerCase(),
                displayName: displayName.trim(),
                studentNumber: studentNumber.trim(),
            });

            if (!profileResult.success) {
                console.error('Failed to create user profile:', profileResult.error);
                // Continue anyway, profile can be created later
            }

            console.log('User registered successfully:', userCredential.user.uid);
            return { success: true };

        } catch (error) {
            console.error('Registration error:', error);

            // Handle specific Firebase errors
            let errorMessage = 'Registration failed. Please try again.';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please login instead.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please choose a stronger password.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection.';
            }

            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setLoading(true);

            // Validate inputs
            if (!email || !password) {
                return {
                    success: false,
                    error: 'Email and password are required'
                };
            }

            // Sign in user
            await signInWithEmailAndPassword(
                auth,
                email.trim().toLowerCase(),
                password
            );

            console.log('User logged in successfully');
            return { success: true };

        } catch (error) {
            console.error('Login error:', error);

            // Handle specific Firebase errors
            let errorMessage = 'Login failed. Please try again.';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled. Please contact support.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            }

            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            await signOut(auth);
            console.log('User logged out successfully');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                error: 'Logout failed. Please try again.'
            };
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email) => {
        try {
            if (!email) {
                return {
                    success: false,
                    error: 'Email address is required'
                };
            }

            await sendPasswordResetEmail(auth, email.trim().toLowerCase());
            return {
                success: true,
                message: 'Password reset email sent successfully'
            };
        } catch (error) {
            console.error('Password reset error:', error);

            let errorMessage = 'Failed to send reset email. Please try again.';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            }

            return { success: false, error: errorMessage };
        }
    };

    const refreshUserProfile = async () => {
        if (user) {
            await loadUserProfile(user.uid);
        }
    };

    const value = {
        user,
        userProfile,
        loading,
        register,
        login,
        logout,
        resetPassword,
        refreshUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};