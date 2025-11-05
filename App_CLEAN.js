import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Text,
    Dimensions,
    Platform,
    Alert,
    BackHandler
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import NetInfo from '@react-native-community/netinfo';

// Screens
import VouchersScreen from './src/screens/VouchersScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';

// Context Providers
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { OfflineProvider, useOffline } from './src/context/OfflineContext';

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

// Admin/Staff Screens
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import StaffDashboardScreen from './src/screens/StaffDashboardScreen';
import StaffScannerScreen from './src/screens/StaffScannerScreen';

// Settings Screens
import SettingsScreen from './src/screens/SettingsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';

// Analytics Components (CLEAN - No Duplicates)
import AnalyticsScreen from './src/components/analytics/AnalyticsScreen';
import AdminAnalytics from './src/components/analytics/AdminAnalytics';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

// Enhanced Theme Configuration
const THEME = {
    colors: {
        user: {
            primary: '#059669',
            secondary: '#10b981',
            accent: '#34d399',
            background: ['#ecfdf5', '#d1fae5', '#ffffff'],
            tabBar: '#ffffff',
            shadow: '#14532d'
        },
        admin: {
            primary: '#8b5cf6',
            secondary: '#a78bfa',
            accent: '#c4b5fd',
            background: ['#f3e8ff', '#e9d5ff', '#ffffff'],
            tabBar: '#ffffff',
            shadow: '#581c87'
        },
        staff: {
            primary: '#f59e0b',
            secondary: '#fbbf24',
            accent: '#fcd34d',
            background: ['#fef3c7', '#fde68a', '#ffffff'],
            tabBar: '#ffffff',
            shadow: '#92400e'
        }
    },
    animations: {
        duration: 300,
        springConfig: {
            tension: 100,
            friction: 8
        }
    }
};

// Enhanced Connection Status Component
function ConnectionStatus() {
    const { isOffline, queueSize } = useOffline();
    const [connectionType, setConnectionType] = useState('unknown');
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setConnectionType(state.type);

            if (!state.isConnected && !isOffline) {
                // Show offline banner
                Animated.parallel([
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    })
                ]).start();
            } else if (state.isConnected && isOffline) {
                // Hide offline banner
                Animated.parallel([
                    Animated.timing(slideAnim, {
                        toValue: -100,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    })
                ]).start();
            }
        });

        return unsubscribe;
    }, [isOffline]);

    if (!isOffline) return null;

    return (
        <Animated.View
            style={[
                styles.connectionBanner,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim
                }
            ]}
        >
            <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={styles.connectionGradient}
            >
                <View style={styles.connectionContent}>
                    <Ionicons name="wifi-off" size={16} color="white" />
                    <Text style={styles.connectionText}>
                        Offline Mode
                    </Text>
                    {queueSize > 0 && (
                        <>
                            <View style={styles.connectionDivider} />
                            <Ionicons name="cloud-upload-outline" size={14} color="white" />
                            <Text style={styles.connectionQueue}>
                                {queueSize} queued
                            </Text>
                        </>
                    )}
                    <Text style={styles.connectionType}>
                        ({connectionType})
                    </Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

// Enhanced Notification Button with Advanced Features
function NotificationButton({ navigation, hasUnread = false, userRole = 'user' }) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const [notificationCount, setNotificationCount] = useState(0);

    const colors = THEME.colors[userRole] || THEME.colors.user;

    useEffect(() => {
        if (hasUnread) {
            // Pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Glow animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Bounce animation for new notifications
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(bounceAnim, {
                    toValue: 0,
                    tension: 100,
                    friction: 5,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [hasUnread]);

    const handlePress = async () => {
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        navigation.navigate('Notifications');
    };

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.6],
    });

    const bounceTranslate = bounceAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -8],
    });

    return (
        <TouchableOpacity
            style={styles.notificationContainer}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <Animated.View style={{
                position: 'relative',
                transform: [
                    { scale: hasUnread ? pulseAnim : 1 },
                    { translateY: bounceTranslate }
                ]
            }}>
                {/* Glow Effect */}
                {hasUnread && (
                    <Animated.View style={[
                        styles.notificationGlow,
                        {
                            backgroundColor: colors.accent,
                            opacity: glowOpacity
                        }
                    ]} />
                )}

                <LinearGradient
                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                    style={styles.notificationButton}
                >
                    <Ionicons
                        name={hasUnread ? "notifications" : "notifications-outline"}
                        size={22}
                        color="white"
                    />

                    {/* Notification Badge */}
                    {hasUnread && notificationCount > 0 && (
                        <Animated.View style={styles.notificationBadge}>
                            <LinearGradient
                                colors={['#ef4444', '#dc2626']}
                                style={styles.notificationBadgeGradient}
                            >
                                <Text style={styles.notificationBadgeText}>
                                    {notificationCount > 99 ? '99+' : notificationCount}
                                </Text>
                            </LinearGradient>
                        </Animated.View>
                    )}

                    {/* Simple dot indicator when count is 0 */}
                    {hasUnread && notificationCount === 0 && (
                        <Animated.View style={styles.notificationDot}>
                            <LinearGradient
                                colors={['#ef4444', '#dc2626']}
                                style={styles.notificationDotGradient}
                            />
                        </Animated.View>
                    )}
                </LinearGradient>
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
                cardStyleInterpolator: ({ current, layouts }) => {
                    return {
                        cardStyle: {
                            transform: [
                                {
                                    translateX: current.progress.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [layouts.screen.width, 0],
                                    }),
                                },
                            ],
                        },
                    };
                },
            }}
        >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

// Main Tab Navigator with Analytics Tab
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route, navigation }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    let iconColor = focused ? THEME.colors.user.primary : '#6b7280';

                    switch (route.name) {
                        case 'Dashboard':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'Scanner':
                            iconName = focused ? 'scan' : 'scan-outline';
                            break;
                        case 'Analytics':
                            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                            break;
                        case 'Rewards':
                            iconName = focused ? 'gift' : 'gift-outline';
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
                tabBarActiveTintColor: THEME.colors.user.primary,
                tabBarInactiveTintColor: '#6b7280',
                tabBarStyle: {
                    backgroundColor: THEME.colors.user.tabBar,
                    borderTopWidth: 0,
                    elevation: 20,
                    shadowColor: THEME.colors.user.shadow,
                    shadowOffset: { width: 0, height: -4 },
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
                    backgroundColor: THEME.colors.user.primary,
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
                    if (route.name === 'Scanner' || route.name === 'Profile') return null;
                    return <NotificationButton navigation={navigation} hasUnread={true} userRole="user" />;
                },
                headerRightContainerStyle: {
                    paddingRight: 16,
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
            <Tab.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Scan' }} />
            <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
            <Tab.Screen name="Rewards" component={RewardsScreen} options={{ title: 'Rewards' }} />
            <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Leaderboard' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        </Tab.Navigator>
    );
}

// Admin Tab Navigator with Analytics Access
function AdminTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route, navigation }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    let iconColor = focused ? THEME.colors.admin.primary : '#6b7280';

                    switch (route.name) {
                        case 'AdminDashboard':
                            iconName = focused ? 'shield' : 'shield-outline';
                            break;
                        case 'AdminAnalytics':
                            iconName = focused ? 'analytics' : 'analytics-outline';
                            break;
                        case 'StaffScanner':
                            iconName = focused ? 'qr-code' : 'qr-code-outline';
                            break;
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                        default:
                            iconName = 'circle';
                    }

                    return <Ionicons name={iconName} size={size} color={iconColor} />;
                },
                tabBarActiveTintColor: THEME.colors.admin.primary,
                tabBarInactiveTintColor: '#6b7280',
                tabBarStyle: {
                    backgroundColor: THEME.colors.admin.tabBar,
                    borderTopWidth: 0,
                    elevation: 20,
                    shadowColor: THEME.colors.admin.shadow,
                    shadowOffset: { width: 0, height: -4 },
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
                    backgroundColor: THEME.colors.admin.primary,
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
                    if (route.name === 'Profile') return null;
                    return <NotificationButton navigation={navigation} hasUnread={false} userRole="admin" />;
                },
                headerRightContainerStyle: {
                    paddingRight: 16,
                },
            })}
        >
            <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
            <Tab.Screen name="AdminAnalytics" component={AdminAnalytics} options={{ title: 'Analytics' }} />
            <Tab.Screen name="StaffScanner" component={StaffScannerScreen} options={{ title: 'Voucher Scanner' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        </Tab.Navigator>
    );
}

// Staff Tab Navigator (Staff only)
function StaffTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route, navigation }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    let iconColor = focused ? THEME.colors.staff.primary : '#6b7280';

                    switch (route.name) {
                        case 'StaffDashboard':
                            iconName = focused ? 'clipboard' : 'clipboard-outline';
                            break;
                        case 'StaffScanner':
                            iconName = focused ? 'qr-code' : 'qr-code-outline';
                            break;
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                        default:
                            iconName = 'circle';
                    }

                    return <Ionicons name={iconName} size={size} color={iconColor} />;
                },
                tabBarActiveTintColor: THEME.colors.staff.primary,
                tabBarInactiveTintColor: '#6b7280',
                tabBarStyle: {
                    backgroundColor: THEME.colors.staff.tabBar,
                    borderTopWidth: 0,
                    elevation: 20,
                    shadowColor: THEME.colors.staff.shadow,
                    shadowOffset: { width: 0, height: -4 },
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
                    backgroundColor: THEME.colors.staff.primary,
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
                    if (route.name === 'Profile') return null;
                    return <NotificationButton navigation={navigation} hasUnread={false} userRole="staff" />;
                },
                headerRightContainerStyle: {
                    paddingRight: 16,
                },
            })}
        >
            <Tab.Screen name="StaffDashboard" component={StaffDashboardScreen} options={{ title: 'Staff Dashboard' }} />
            <Tab.Screen name="StaffScanner" component={StaffScannerScreen} options={{ title: 'Scanner' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        </Tab.Navigator>
    );
}

// Enhanced Role-Based Access Control
function useRoleBasedAccess() {
    const { userProfile } = useAuth();
    const [permissions, setPermissions] = useState({
        canAccessAdmin: false,
        canAccessStaff: false,
        canManageUsers: false,
        canViewAnalytics: false,
        canScanVouchers: false,
    });

    useEffect(() => {
        if (userProfile?.role) {
            const role = userProfile.role;
            const newPermissions = {
                canAccessAdmin: role === 'admin',
                canAccessStaff: role === 'staff' || role === 'admin',
                canManageUsers: role === 'admin',
                canViewAnalytics: role === 'admin' || role === 'staff',
                canScanVouchers: role === 'staff' || role === 'admin',
            };
            setPermissions(newPermissions);
        }
    }, [userProfile]);

    return permissions;
}

// Enhanced Main App Stack with SHARED SCREENS
function AppStack() {
    const { userProfile, user } = useAuth();
    const { isOffline } = useOffline();
    const permissions = useRoleBasedAccess();
    const [isReady, setIsReady] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // App readiness check
    useEffect(() => {
        const prepareApp = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                setIsReady(true);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }).start();
            } catch (error) {
                console.error('App preparation error:', error);
                setIsReady(true);
            }
        };

        prepareApp();
    }, []);

    // Back button handler for Android
    useEffect(() => {
        const backAction = () => {
            Alert.alert('Exit App', 'Are you sure you want to exit?', [
                { text: 'Cancel', onPress: () => null, style: 'cancel' },
                { text: 'YES', onPress: () => BackHandler.exitApp() },
            ]);
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, []);

    // Determine initial route based on user role
    const getInitialRouteName = () => {
        if (!userProfile || !userProfile.role) {
            return 'MainTabs';
        }

        switch (userProfile.role) {
            case 'admin':
                return permissions.canAccessAdmin ? 'AdminTabs' : 'MainTabs';
            case 'staff':
                return permissions.canAccessStaff ? 'StaffTabs' : 'MainTabs';
            default:
                return 'MainTabs';
        }
    };

    if (!isReady) {
        return <LoadingScreen />;
    }

    return (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <ConnectionStatus />
            <Stack.Navigator
                initialRouteName={getInitialRouteName()}
                screenOptions={{
                    cardStyleInterpolator: ({ current, layouts }) => {
                        return {
                            cardStyle: {
                                transform: [
                                    {
                                        translateX: current.progress.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [layouts.screen.width, 0],
                                        }),
                                    },
                                ],
                            },
                        };
                    },
                }}
            >
                {permissions.canAccessAdmin && (
                    <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
                )}
                {permissions.canAccessStaff && (
                    <Stack.Screen name="StaffTabs" component={StaffTabs} options={{ headerShown: false }} />
                )}
                <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
                <Stack.Screen
                    name="RewardDetail"
                    component={RewardDetailScreen}
                    options={({ navigation, route }) => {
                        const userRole = userProfile?.role || 'user';
                        const colors = THEME.colors[userRole] || THEME.colors.user;
                        return {
                            title: 'Reward Details',
                            headerStyle: { backgroundColor: colors.primary },
                            headerTintColor: '#fff',
                            headerRight: () => <NotificationButton navigation={navigation} hasUnread={false} userRole={userRole} />,
                            headerRightContainerStyle: { paddingRight: 16 },
                        };
                    }}
                />
                <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ headerShown: false }} />
            </Stack.Navigator>
        </Animated.View>
    );
}

// Enhanced Loading State Management
function useAppInitialization() {
    const [initState, setInitState] = useState({
        isLoading: true,
        hasSeenWelcome: null,
        isCheckingWelcome: true,
        error: null,
    });

    const checkWelcomeStatus = async () => {
        try {
            const welcomeSeen = await AsyncStorage.getItem('hasSeenWelcome');
            setInitState(prev => ({
                ...prev,
                hasSeenWelcome: welcomeSeen === 'true',
                isCheckingWelcome: false,
            }));
        } catch (error) {
            console.error('Error checking welcome status:', error);
            setInitState(prev => ({
                ...prev,
                hasSeenWelcome: false,
                isCheckingWelcome: false,
                error: error.message,
            }));
        }
    };

    useEffect(() => {
        checkWelcomeStatus();
    }, []);

    return initState;
}

// Root Navigator with Enhanced State Management
function RootNavigator() {
    const { user, userProfile, loading } = useAuth();
    const initState = useAppInitialization();
    const [appState, setAppState] = useState('active');
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // App state monitoring
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            } else if (nextAppState.match(/inactive|background/)) {
                Animated.timing(fadeAnim, {
                    toValue: 0.8,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            }
            setAppState(nextAppState);
        };
        return () => {};
    }, [appState]);

    // Profile change monitoring
    useEffect(() => {
        if (userProfile) {
            console.log('🔄 User profile updated:', {
                role: userProfile.role,
                displayName: userProfile.displayName,
                level: userProfile.level,
                points: userProfile.points
            });
        }
    }, [userProfile]);

    if (loading || initState.isCheckingWelcome) {
        return (
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                <LoadingScreen />
            </Animated.View>
        );
    }

    if (user) {
        if (!userProfile) {
            console.log('👤 User authenticated but profile not loaded yet...');
            return <LoadingScreen />;
        }

        console.log('🚀 Rendering app for user with role:', userProfile.role);
        return (
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                <AppStack />
            </Animated.View>
        );
    }

    return (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <AuthStack />
        </Animated.View>
    );
}

// Main App Component with Enhanced Provider Setup
export default function App() {
    const [appIsReady, setAppIsReady] = useState(false);

    useEffect(() => {
        async function prepare() {
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e) {
                console.warn(e);
            } finally {
                setAppIsReady(true);
            }
        }
        prepare();
    }, []);

    if (!appIsReady) {
        return <LoadingScreen />;
    }

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

// Enhanced Styles
const styles = StyleSheet.create({
    connectionBanner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        elevation: 100,
    },
    connectionGradient: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    connectionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectionText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    connectionDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 8,
    },
    connectionQueue: {
        color: 'white',
        fontSize: 11,
        marginLeft: 4,
    },
    connectionType: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        marginLeft: 8,
        textTransform: 'uppercase',
    },
    notificationContainer: {
        marginRight: 4,
    },
    notificationGlow: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        top: -5,
        left: -5,
        zIndex: -1,
    },
    notificationButton: {
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
    },
    notificationBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'white',
    },
    notificationBadgeGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    notificationBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'white',
    },
    notificationDotGradient: {
        flex: 1,
    },
});