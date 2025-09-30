import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ContractorsScreen from './src/screens/ContractorsScreen';
import CreateContractorScreen from './src/screens/CreateContractorScreen';
import EditContractorScreen from './src/screens/EditContractorScreen';
import ContractsScreen from './src/screens/ContractsScreen';
import CreateContractScreen from './src/screens/CreateContractScreen';
import EditContractScreen from './src/screens/EditContractScreen';
import DocumentContractorsScreen from './src/screens/DocumentContractorsScreen';
import ContractorDocumentsScreen from './src/screens/ContractorDocumentsScreen';
import AllDocumentManagementsScreen from './src/screens/AllDocumentManagementsScreen';
import DataAnalysisScreen from './src/screens/DataAnalysisScreen';
import ComparisonsScreen from './src/screens/ComparisonsScreen';
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
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'Home',
          }}
        />
        <Stack.Screen 
          name="Contractors" 
          component={ContractorsScreen}
          options={{
            title: 'Contratistas',
          }}
        />
        <Stack.Screen 
          name="CreateContractor" 
          component={CreateContractorScreen}
          options={{
            title: 'Crear Contratista',
          }}
        />
        <Stack.Screen 
          name="EditContractor" 
          component={EditContractorScreen}
          options={{
            title: 'Editar Contratista',
          }}
        />
        <Stack.Screen 
          name="Contracts" 
          component={ContractsScreen}
          options={{
            title: 'Contratos',
          }}
        />
        <Stack.Screen 
          name="CreateContract" 
          component={CreateContractScreen}
          options={{
            title: 'Crear Contrato',
          }}
        />
        <Stack.Screen 
          name="EditContract" 
          component={EditContractScreen}
          options={{
            title: 'Editar Contrato',
          }}
        />
        <Stack.Screen 
          name="DocumentContractors" 
          component={DocumentContractorsScreen}
          options={{
            title: 'Gestión Documental',
          }}
        />
        <Stack.Screen 
          name="ContractorDocuments" 
          component={ContractorDocumentsScreen}
          options={{
            title: 'Documentos del Contratista',
          }}
        />
        <Stack.Screen 
          name="AllDocumentManagements" 
          component={AllDocumentManagementsScreen}
          options={{
            title: 'Todas las Gestiones',
          }}
        />
        <Stack.Screen 
          name="DataAnalysis" 
          component={DataAnalysisScreen}
          options={{
            title: 'Análisis de Datos',
          }}
        />
        <Stack.Screen 
          name="Comparisons" 
          component={ComparisonsScreen}
          options={{
            title: 'Comparaciones',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
