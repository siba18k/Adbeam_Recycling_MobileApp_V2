diff --git a/App.js b/App.js
index 5032423..0000000 100644
--- a/App.js
+++ b/App.js
@@
-import LeaderboardScreen from './src/screens/LeaderboardScreen';
+import LeaderboardScreen from './src/screens/LeaderboardScreen';
+import NotificationsScreen from './src/screens/NotificationsScreen';
@@
-function MainTabs() {
+function MainTabs() {
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
                         case 'Rewards':
                             iconName = focused ? 'gift' : 'gift-outline';
                             break;
                         case 'Vouchers':
                             iconName = focused ? 'qr-code' : 'qr-code-outline';
                             break;
+                        case 'NotificationsTab':
+                            iconName = focused ? 'notifications' : 'notifications-outline';
+                            break;
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
@@
-                headerRight: () => {
-                    if (route.name === 'Scanner' || route.name === 'Profile') return null;
+                headerRight: () => {
+                    if (route.name === 'Scanner' || route.name === 'Profile' || route.name === 'NotificationsTab') return null;
                     return <NotificationButton navigation={navigation} hasUnread={true} userRole="user" />;
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
+            <Tab.Screen
+                name="NotificationsTab"
+                component={NotificationsScreen}
+                options={{ title: 'Notifications' }}
+            />
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
@@
-                <Stack.Screen
-                    name="Notifications"
-                    component={NotificationsScreen}
-                    options={{ headerShown: false }}
-                />
+                {/* Keep the Notifications screen for deep-links, but primary access is via the tab */}
+                <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
