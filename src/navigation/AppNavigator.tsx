import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import { RootStackParamList } from './types';

import { TabNavigator } from './TabNavigator';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { PetDetailScreen } from '../screens/pets/PetDetailScreen';
import { PetFormScreen } from '../screens/pets/PetFormScreen';
import { AddExpenseScreen } from '../screens/expenses/AddExpenseScreen';
import { RemindersScreen } from '../screens/reminders/RemindersScreen';
import { Loader } from '../components/Loader';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen message="Loading..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        {!user ? (
          <Stack.Screen
            name="MainTabs"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PetDetail"
              component={PetDetailScreen}
              options={({ route }) => ({
                title: route.params?.name || 'Pet Profile',
                headerBackTitle: 'Back',
              })}
            />
            <Stack.Screen
              name="PetForm"
              component={PetFormScreen}
              options={({ route }) => ({
                title:
                  route.params.mode === 'add' ? 'Add Pet' : 'Edit Pet',
                headerBackTitle: 'Back',
                presentation: 'modal',
              })}
            />
            <Stack.Screen
              name="AddExpense"
              component={AddExpenseScreen}
              options={{
                title: 'Add Expense',
                headerBackTitle: 'Back',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="Reminders"
              component={RemindersScreen}
              options={{
                title: 'Reminders',
                headerBackTitle: 'Back',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
