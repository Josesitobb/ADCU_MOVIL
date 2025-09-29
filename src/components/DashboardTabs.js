import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ContractScreen from '../screens/ContractScreen';
import DocumentManagementScreen from '../screens/DocumentManagementScreen';
import DataManagementScreen from '../screens/DataManagementScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { getCurrentUser, logoutUser } from '../services/authService';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const Tab = createBottomTabNavigator();

// Pantalla de Dashboard (Home) con resumen
const DashboardHome = ({ navigation }) => {
  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          onPress: async () => {
            await logoutUser();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Bienvenido de nuevo</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
          </TouchableOpacity>
        </View>

        {/* Tarjetas de Resumen */}
        <View style={styles.summaryGrid}>
          <TouchableOpacity 
            style={styles.summaryCard}
            onPress={() => navigation.navigate('Contract')}
          >
            <Ionicons name="document-text" size={32} color="#3498db" />
            <Text style={styles.summaryTitle}>Mi Contrato</Text>
            <Text style={styles.summarySubtitle}>CTR-2024-001</Text>
            <Text style={styles.summaryStatus}>En Progreso • 65%</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.summaryCard}
            onPress={() => navigation.navigate('Documents')}
          >
            <Ionicons name="folder" size={32} color="#2ecc71" />
            <Text style={styles.summaryTitle}>Documentos</Text>
            <Text style={styles.summarySubtitle}>12 archivos</Text>
            <Text style={styles.summaryStatus}>3 pendientes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryGrid}>
          <TouchableOpacity 
            style={styles.summaryCard}
            onPress={() => navigation.navigate('Data')}
          >
            <Ionicons name="analytics" size={32} color="#f39c12" />
            <Text style={styles.summaryTitle}>Datos</Text>
            <Text style={styles.summarySubtitle}>45 requests</Text>
            <Text style={styles.summaryStatus}>42 exitosos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.summaryCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={32} color="#9b59b6" />
            <Text style={styles.summaryTitle}>Mi Perfil</Text>
            <Text style={styles.summarySubtitle}>Información</Text>
            <Text style={styles.summaryStatus}>Ver perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Actividades Recientes */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          
          <View style={styles.activityItem}>
            <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Documento aprobado: "Planos Arquitectónicos"</Text>
              <Text style={styles.activityTime}>Hace 2 horas</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <Ionicons name="cloud-upload" size={20} color="#3498db" />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Subida de fotos de avance del proyecto</Text>
              <Text style={styles.activityTime}>Ayer a las 3:30 PM</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <Ionicons name="cash" size={20} color="#f39c12" />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Pago procesado: $20,000</Text>
              <Text style={styles.activityTime}>3 días</Text>
            </View>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
};

const DashboardTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Contract') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Documents') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'Data') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#ecf0f1',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardHome}
        options={{
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen 
        name="Contract" 
        component={ContractScreen}
        options={{
          tabBarLabel: 'Contrato',
        }}
      />
      <Tab.Screen 
        name="Documents" 
        component={DocumentManagementScreen}
        options={{
          tabBarLabel: 'Documentos',
        }}
      />
      <Tab.Screen 
        name="Data" 
        component={DataManagementScreen}
        options={{
          tabBarLabel: 'Datos',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 12,
    textAlign: 'center',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryStatus: {
    fontSize: 12,
    color: '#3498db',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  recentSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});

export default DashboardTabs;