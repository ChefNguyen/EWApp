import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { RootStackParamList, TabParamList } from '../types';
import { useApp } from '../context/AppContext';

// Screens
import LoginScreen from '../screens/Login';
import DashboardScreen from '../screens/Dashboard';
import WithdrawScreen from '../screens/Withdraw';
import TopUpScreen from '../screens/TopUp';
import HistoryScreen from '../screens/History';
import ChatScreen from '../screens/Chat';
import BillPaymentScreen from '../screens/BillPayment';
import LinkBankScreen from '../screens/LinkBank';
import OffersScreen from '../screens/Offers';
import ProfileScreen from '../screens/Profile';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const primaryNavItems: {
  key: 'Dashboard' | 'Offers' | 'History' | 'Profile';
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  target?: keyof RootStackParamList;
}[] = [
  { key: 'Dashboard', label: 'EWA', icon: 'wallet' },
  { key: 'Offers', label: 'Ưu đãi', icon: 'tag', target: 'Offers' },
  { key: 'History', label: 'Lịch sử', icon: 'clock', target: 'History' },
  { key: 'Profile', label: 'Cá nhân', icon: 'account', target: 'Profile' },
];

function CustomTabBar({ navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabShell, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.primaryBubble}>
        {primaryNavItems.map(item => {
          const isHome = item.key === 'Dashboard';
          const color = isHome ? colors.indigo700 : colors.slate400;

          const onPress = () => {
            if (item.target) {
              navigation.getParent()?.navigate(item.target);
              return;
            }

            navigation.navigate('Dashboard');
          };

          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={isHome ? { selected: true } : {}}
              onPress={onPress}
              style={[styles.primaryTabItem, isHome && styles.primaryTabItemActive]}
            >
              <MaterialCommunityIcons name={item.icon} size={isHome ? 24 : 22} color={color} />
              <Text style={[styles.tabLabel, { color }, isHome && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.getParent()?.navigate('Chat')}
        style={styles.chatBubble}
      >
        <View style={styles.robotHead}>
          <View style={styles.robotAntenna} />
          <MaterialCommunityIcons name="robot-happy-outline" size={28} color={colors.indigo700} />
        </View>
      </Pressable>
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
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
            <Stack.Screen
              name="Offers"
              component={OffersScreen}
              options={{ presentation: 'card', gestureEnabled: false }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{ presentation: 'card', gestureEnabled: false }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ presentation: 'card', gestureEnabled: false }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ presentation: 'card', gestureEnabled: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: 'rgba(248,250,252,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.7)',
  },
  primaryBubble: {
    flex: 1,
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.85)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 12,
  },
  primaryTabItem: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  primaryTabItemActive: {
    backgroundColor: colors.indigo50,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 3,
  },
  tabLabelActive: {
    fontWeight: '900',
  },
  chatBubble: {
    width: 76,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.indigo100,
    shadowColor: colors.indigo900,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 14,
  },
  chatBubbleActive: {
    backgroundColor: colors.indigo900,
    borderColor: colors.indigo500,
  },
  robotHead: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.indigo50,
    borderWidth: 1,
    borderColor: colors.indigo100,
  },
  robotHeadActive: {
    backgroundColor: colors.indigo600,
    borderColor: colors.indigo400,
  },
  robotAntenna: {
    position: 'absolute',
    top: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.indigo500,
  },
  chatLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.indigo700,
    letterSpacing: 0.2,
    marginTop: 3,
  },
  chatLabelActive: {
    color: colors.white,
  },
});
