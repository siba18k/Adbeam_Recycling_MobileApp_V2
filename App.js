import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import VouchersScreen from './src/screens/VouchersScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';

// Context Providers
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { OfflineProvider } from './src/context/OfflineContext';

// Auth Screens
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';

// Main App Screens
import DashboardScreen from './src/screens/DashboardScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import RewardDetailScreen from './src/screens/RewardDetailScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';

// Settings Screens
import SettingsScreen from './src/screens/SettingsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Notification Button Component
function NotificationButton({ navigation, hasUnread = true }) {
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const glowAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (hasUnread) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 1800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [hasUnread]);

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
    });

    return (
        <TouchableOpacity
            style={{ marginRight: 4 }}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
        >
            <Animated.View style={{
                position: 'relative',
                transform: [{ scale: hasUnread ? pulseAnim : 1 }]
            }}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 4,
                    }}
                >
                    <Ionicons
                        name={hasUnread ? "notifications" : "notifications-outline"}
                        size={22}
                        color="white"
                    />

                    {hasUnread && (
                        <Animated.View style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            overflow: 'hidden',
                            borderWidth: 2,
                            borderColor: 'white',
                            opacity: glowOpacity.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 0.7],
                            })
                        }}>
                            <LinearGradient
                                colors={['#ef4444', '#dc2626']}
                                style={{ flex: 1 }}
                            />
                        </Animated.View>
                    )}
                </LinearGradient>

                {hasUnread && (
                    <Animated.View style={{
                        position: 'absolute',
                        top: -2,
                        left: -2,
                        right: -2,
                        bottom: -2,
                        borderRadius: 22,
                        backgroundColor: '#fbbf24',
                        zIndex: -1,
                        opacity: glowOpacity
                    }} />
                )}
            </Animated.View>
        </TouchableOpacity>
    );
}

// Auth Stack - for unauthenticated users
function AuthStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

// Main Tab Navigator for regular users
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route, navigation }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    let iconColor = focused ? '#059669' : '#6b7280';

                    switch (route.name) {
                        case 'Dashboard':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'Scanner':
                            iconName = focused ? 'scan' : 'scan-outline';
                            break;
                        case 'Rewards':
                            iconName = focused ? 'gift' : 'gift-outline';
                            break;
                        case 'Vouchers':
                            iconName = focused ? 'qr-code' : 'qr-code-outline';
                            break;
                        case 'Leaderboard':
                            iconName = focused ? 'trophy' : 'trophy-outline';
                            break;
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                        default:
                            iconName = 'circle';
                    }

                    return <Ionicons name={iconName} size={size} color={iconColor} />;
                },
                tabBarActiveTintColor: '#059669',
                tabBarInactiveTintColor: '#6b7280',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 0,
                    elevation: 20,
                    shadowColor: '#14532d',
                    shadowOffset: {
                        width: 0,
                        height: -4,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: '#059669',
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 0,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                },
                headerRight: () => {
                    // Don't show notification button on Scanner or Profile
                    if (route.name === 'Scanner' || route.name === 'Profile') return null;
                    return <NotificationButton navigation={navigation} hasUnread={true} />;
                },
                headerRightContainerStyle: {
                    paddingRight: 16,
                },
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ title: 'Dashboard' }}
            />
            <Tab.Screen
                name="Scanner"
                component={ScannerScreen}
                options={{ title: 'Scan' }}
            />
            <Tab.Screen
                name="Rewards"
                component={RewardsScreen}
                options={{ title: 'Rewards' }}
            />
            <Tab.Screen
                name="Vouchers"
                component={VouchersScreen}
                options={{ title: 'Vouchers' }}
            />
            <Tab.Screen
                name="Leaderboard"
                component={LeaderboardScreen}
                options={{ title: 'Leaderboard' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Profile' }}
            />
        </Tab.Navigator>
    );
}

// FIXED: Enhanced Main App Stack with role-based routing
function AppStack() {
    const { userProfile } = useAuth();

    // Determine initial route based on user role
    const getInitialRouteName = () => {
        if (!userProfile || !userProfile.role) {
            return 'MainTabs'; // Default to regular user dashboard
        }

        switch (userProfile.role) {
            case 'admin':
                return 'AdminDashboard';
            case 'staff':
                return 'AdminDashboard'; // Staff also uses admin dashboard
            default:
                return 'MainTabs';
        }
    };

    return (
        <Stack.Navigator initialRouteName={getInitialRouteName()}>
            {/* Admin/Staff Dashboard as primary screen for admin/staff users */}
            <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
                options={({ navigation }) => ({
                    title: userProfile?.role === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard',
                    headerStyle: { backgroundColor: '#059669' },
                    headerTintColor: '#fff',
                    headerRight: () => <NotificationButton navigation={navigation} hasUnread={false} />,
                    headerRightContainerStyle: { paddingRight: 16 },
                })}
            />

            {/* Regular user tabs */}
            <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{ headerShown: false }}
            />

            {/* Other screens accessible to all roles */}
            <Stack.Screen
                name="RewardDetail"
                component={RewardDetailScreen}
                options={({ navigation }) => ({
                    title: 'Reward Details',
                    headerStyle: { backgroundColor: '#059669' },
                    headerTintColor: '#fff',
                    headerRight: () => <NotificationButton navigation={navigation} hasUnread={false} />,
                    headerRightContainerStyle: { paddingRight: 16 },
                })}
            />

            {/* Settings and utility screens */}
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Privacy"
                component={PrivacyScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Achievements"
                component={AchievementsScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

// Root Navigator - decides between Auth and App based on auth state
function RootNavigator() {
    const { user, userProfile, loading } = useAuth();
    const [hasSeenWelcome, setHasSeenWelcome] = useState(null);
    const [checkingWelcome, setCheckingWelcome] = useState(true);

    useEffect(() => {
        checkWelcomeStatus();
    }, []);

    // IMPORTANT: Re-render when userProfile changes (especially role)
    useEffect(() => {
        if (userProfile) {
            console.log('User profile updated, role:', userProfile.role);
        }
    }, [userProfile]);

    const checkWelcomeStatus = async () => {
        try {
            const welcomeSeen = await AsyncStorage.getItem('hasSeenWelcome');
            setHasSeenWelcome(welcomeSeen === 'true');
        } catch (error) {
            console.log('Error checking welcome status:', error);
            setHasSeenWelcome(false);
        } finally {
            setCheckingWelcome(false);
        }
    };

    // Show LoadingScreen while checking both auth and welcome status
    if (loading || checkingWelcome) {
        return <LoadingScreen />;
    }

    // If user is logged in, show main app
    if (user) {
        // Wait for userProfile to be loaded before showing app
        if (!userProfile) {
            console.log('User authenticated but profile not loaded yet...');
            return <LoadingScreen />;
        }

        console.log('Rendering app for user with role:', userProfile.role);
        return <AppStack />;
    }

    // If user not logged in, show Auth stack
    return <AuthStack />;
}

// Main App Component
export default function App() {
    return (
        <PaperProvider>
            <AuthProvider>
                <OfflineProvider>
                    <NavigationContainer>
                        <StatusBar style="auto" />
                        <RootNavigator />
                    </NavigationContainer>
                </OfflineProvider>
            </AuthProvider>
        </PaperProvider>
    );
}
