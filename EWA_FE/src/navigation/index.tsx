import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { RootStackParamList, TabParamList } from '../types';
import { useApp } from '../context/AppContext';

// Screens
import LoginScreen from '../screens/Login';
import DashboardScreen from '../screens/Dashboard';
import WithdrawScreen from '../screens/Withdraw';
import TopUpScreen from '../screens/TopUp';
import HistoryScreen from '../screens/History';
import BillPaymentScreen from '../screens/BillPayment';
import LinkBankScreen from '../screens/LinkBank';
import OffersScreen from '../screens/Offers';
import ProfileScreen from '../screens/Profile';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.indigo700,
        tabBarInactiveTintColor: colors.slate400,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ focused, color }) => {
          const iconSize = 22;
          if (route.name === 'Dashboard') return <MaterialCommunityIcons name="wallet" size={iconSize + 2} color={color} />;
          if (route.name === 'Offers') return <MaterialCommunityIcons name="tag" size={iconSize} color={color} />;
          if (route.name === 'History') return <MaterialCommunityIcons name="clock" size={iconSize} color={color} />;
          if (route.name === 'Profile') return <MaterialCommunityIcons name="account" size={iconSize + 1} color={color} />;
          return null;
        },
        tabBarLabel: ({ focused, color }) => {
          const labels: Record<string, string> = {
            Dashboard: 'EWA',
            Offers: 'Ưu đãi',
            History: 'Lịch sử',
            Profile: 'Cá nhân',
          };
          return (
            <Text style={[
              styles.tabLabel, 
              { color, fontWeight: focused ? '900' : '500' }
            ]}>
              {labels[route.name]}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Offers" component={OffersScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoggedIn } = useApp();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
              name="Withdraw"
              component={WithdrawScreen}
              options={{ presentation: 'card', gestureEnabled: true }}
            />
            <Stack.Screen
              name="TopUp"
              component={TopUpScreen}
              options={{ presentation: 'card', gestureEnabled: true }}
            />
            <Stack.Screen
              name="BillPayment"
              component={BillPaymentScreen}
              options={{ presentation: 'card', gestureEnabled: true }}
            />
            <Stack.Screen
              name="LinkBank"
              component={LinkBankScreen}
              options={{ presentation: 'card', gestureEnabled: true }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopColor: 'rgba(241,245,249,0.5)',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 10,
    position: 'absolute',
  },
  tabItem: {
    height: 52,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
