import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Provider as PaperProvider } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { AuthProvider, useAuth } from "./src/context/AuthContext"
import { OfflineProvider } from "./src/context/OfflineContext"

// Screens
import LoginScreen from "./src/screens/Auth/LoginScreen"
import RegisterScreen from "./src/screens/Auth/RegisterScreen"
import DashboardScreen from "./src/screens/Dashboard/DashboardScreen"
import ScannerScreen from "./src/screens/Scanner/ScannerScreen"
import RewardsScreen from "./src/screens/Rewards/RewardsScreen"
import LeaderboardScreen from "./src/screens/Leaderboard/LeaderboardScreen"
import ProfileScreen from "./src/screens/Profile/ProfileScreen"
import AdminDashboardScreen from "./src/screens/Admin/AdminDashboardScreen"
import RewardDetailScreen from "./src/screens/Rewards/RewardDetailScreen"
// import ActivityHistoryScreen from "./src/screens/Dashboard/ActivityHistoryScreen"

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  const { user } = useAuth()

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarIcon: () => null,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: "#10b981",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {user?.isAdmin && <Tab.Screen name="Admin" component={AdminDashboardScreen} />}
    </Tab.Navigator>
  )
}

function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return null // Or return <LoadingScreen /> if you have one
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="RewardDetail" component={RewardDetailScreen} />
          {/* <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} /> */}
        </>
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <OfflineProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </OfflineProvider>
      </AuthProvider>
    </PaperProvider>
  )
}