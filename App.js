import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Context Providers
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { OfflineProvider } from './src/context/OfflineContext';
import { NotificationProvider, useNotifications } from './src/context/NotificationContext';

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
import StaffDashboardScreen from './src/screens/StaffDashboardScreen';
import StaffScannerScreen from './src/screens/StaffScannerScreen';
import VouchersScreen from './src/screens/VouchersScreen';
import NotificationScreen from './src/screens/NotificationScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack - for unauthenticated users
function AuthStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

// Main Tab Navigator - for regular users
function MainTabs() {
    const { unreadCount } = useNotifications();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

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
                        case 'Notifications':
                            iconName = focused ? 'notifications' : 'notifications-outline';
                            break;
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                        default:
                            iconName = 'circle';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
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
                name="Notifications"
                component={NotificationScreen}
                options={{
                    title: 'Notifications',
                    tabBarBadge: unreadCount > 0 ? unreadCount : null
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Profile' }}
            />
        </Tab.Navigator>
    );
}

// Staff Tab Navigator - for staff members
function StaffTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'StaffDashboard':
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

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#f59e0b',
                tabBarInactiveTintColor: '#6b7280',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 0,
                    elevation: 20,
                    shadowColor: '#d97706',
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
                    backgroundColor: '#f59e0b',
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 0,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                },
            })}
        >
            <Tab.Screen
                name="StaffDashboard"
                component={StaffDashboardScreen}
                options={{ title: 'Dashboard' }}
            />
            <Tab.Screen
                name="StaffScanner"
                component={StaffScannerScreen}
                options={{ title: 'Scanner' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Profile' }}
            />
        </Tab.Navigator>
    );
}

// Admin Stack Navigator - for admin users
function AdminStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="AdminTabs"
                component={AdminTabs}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="StaffScanner"
                component={StaffScannerScreen}
                options={{
                    title: 'Staff Voucher Scanner',
                    headerStyle: { backgroundColor: '#f59e0b' },
                    headerTintColor: '#fff',
                }}
            />
        </Stack.Navigator>
    );
}

// Admin Tab Navigator - for admin users
function AdminTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'AdminDashboard':
                            iconName = focused ? 'settings' : 'settings-outline';
                            break;
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                        default:
                            iconName = 'circle';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#8b5cf6',
                tabBarInactiveTintColor: '#6b7280',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 0,
                    elevation: 20,
                    shadowColor: '#7c3aed',
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
                    backgroundColor: '#8b5cf6',
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 0,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                },
            })}
        >
            <Tab.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
                options={{ title: 'Admin' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Profile' }}
            />
        </Tab.Navigator>
    );
}

// Regular User Stack - includes tabs and modal screens
function UserStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="RewardDetail"
                component={RewardDetailScreen}
                options={{
                    title: 'Reward Details',
                    headerStyle: { backgroundColor: '#059669' },
                    headerTintColor: '#fff',
                }}
            />
            <Stack.Screen
                name="Leaderboard"
                component={LeaderboardScreen}
                options={{
                    title: 'Leaderboard',
                    headerStyle: { backgroundColor: '#059669' },
                    headerTintColor: '#fff',
                }}
            />
        </Stack.Navigator>
    );
}

// Root Navigator - decides navigation based on user role
function RootNavigator() {
    const { user, userProfile, loading } = useAuth();

    if (loading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#059669'
            }}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    if (!user) {
        return <AuthStack />;
    }

    // Role-based navigation
    console.log('🔄 User role:', userProfile?.role);

    switch (userProfile?.role) {
        case 'admin':
            return <AdminStack />;
        case 'staff':
            return <StaffTabs />;
        default:
            return <UserStack />;
    }
}

// Main App Component
export default function App() {
    return (
        <PaperProvider>
            <AuthProvider>
                <OfflineProvider>
                    <NotificationProvider>
                        <NavigationContainer>
                            <StatusBar style="auto" />
                            <RootNavigator />
                        </NavigationContainer>
                    </NotificationProvider>
                </OfflineProvider>
            </AuthProvider>
        </PaperProvider>
    );
}
