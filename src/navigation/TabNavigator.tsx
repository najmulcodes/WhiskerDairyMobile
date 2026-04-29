import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { Colors } from '../theme/colors';
import { TabParamList } from './types';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { PetsListScreen } from '../screens/pets/PetsListScreen';
import { ExpensesScreen } from '../screens/expenses/ExpensesScreen';
import { HealthSummaryScreen } from '../screens/health/HealthSummaryScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<
  keyof TabParamList,
  { focused: IoniconName; unfocused: IoniconName }
> = {
  Dashboard: { focused: 'home', unfocused: 'home-outline' },
  Pets: { focused: 'paw', unfocused: 'paw-outline' },
  Expenses: { focused: 'wallet', unfocused: 'wallet-outline' },
  Health: { focused: 'heart', unfocused: 'heart-outline' },
  Settings: { focused: 'settings', unfocused: 'settings-outline' },
};

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name as keyof TabParamList];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Pets" component={PetsListScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Health" component={HealthSummaryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
