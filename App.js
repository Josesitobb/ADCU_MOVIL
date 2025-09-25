import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import DashboardTabs from './src/components/DashboardTabs';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Ocultar headers por defecto
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            title: 'Iniciar Sesión',
          }}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardTabs}
          options={{
            title: 'Dashboard',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
