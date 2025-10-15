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

// Auth Screens (fixed paths)
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Main App Screens (fixed paths)
import DashboardScreen from './src/screens/DashboardScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import RewardDetailScreen from './src/screens/RewardDetailScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';

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

// Main Tab Navigator - for authenticated users
function MainTabs() {
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
                        case 'Leaderboard':
                            iconName = focused ? 'trophy' : 'trophy-outline';
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
                    fontSize: 12,
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

// Main App Stack - includes tabs and modal screens
function AppStack() {
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
                name="AdminDashboard"
                component={AdminDashboardScreen}
                options={{
                    title: 'Admin Dashboard',
                    headerStyle: { backgroundColor: '#059669' },
                    headerTintColor: '#fff',
                }}
            />
        </Stack.Navigator>
    );
}

// Root Navigator - decides between Auth and App based on auth state
function RootNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return user ? <AppStack /> : <AuthStack />;
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
