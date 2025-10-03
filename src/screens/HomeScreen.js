import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, logoutUser } from '../services/authService';
import apiClient from '../services/authService';

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contractStats, setContractStats] = useState(null);
  const [documentStats, setDocumentStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadUser();
    loadContractStats();
    loadDocumentStats();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const result = await getCurrentUser();
      if (result.success) {
        setUser(result.user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContractStats = async () => {
    try {
      setStatsLoading(true);
      console.log('📊 Cargando estadísticas de contratos...');
      
      const response = await apiClient.get('/Contracts/stats');
      
      if (response.data && response.data.success) {
        console.log('✅ Estadísticas cargadas:', response.data.data);
        setContractStats(response.data.data);
      } else {
        console.error('❌ Error al cargar estadísticas');
        setContractStats(null);
      }
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      setContractStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadDocumentStats = async () => {
    try {
      console.log('📄 Cargando estadísticas de documentos...');
      
      const response = await apiClient.get('/Documents/stats');
      
      if (response.data && response.data.success) {
        console.log('✅ Estadísticas de documentos cargadas:', response.data.data);
        setDocumentStats(response.data.data);
      } else {
        console.error('❌ Error al cargar estadísticas de documentos');
        setDocumentStats(null);
      }
    } catch (error) {
      console.error('❌ Error cargando estadísticas de documentos:', error);
      setDocumentStats(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadUser(),
      loadContractStats(),
      loadDocumentStats()
    ]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              {user && (
                <Text style={styles.userName}>
                  {user.firstName || user.firsName} {user.lastName}
                </Text>
              )}
              <View style={styles.roleContainer}>
                <Ionicons name="shield-checkmark" size={16} color="#3498db" />
                <Text style={styles.roleText}>Funcionario ADCU</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Ionicons name="person-circle" size={40} color="#3498db" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Información del Usuario */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>Mi Información</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cargo:</Text>
            <Text style={styles.infoValue}>{user?.post || 'No especificado'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cédula:</Text>
            <Text style={styles.infoValue}>{user?.idcard}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teléfono:</Text>
            <Text style={styles.infoValue}>{user?.telephone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado:</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: user?.state ? '#2ecc71' : '#e74c3c' }]} />
              <Text style={[styles.statusText, { color: user?.state ? '#2ecc71' : '#e74c3c' }]}>
                {user?.state ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>
        </View>

        {/* Funciones del Sistema */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="grid-outline" size={24} color="#2ecc71" />
            <Text style={styles.cardTitle}>Funciones del Sistema</Text>
          </View>
          
          <View style={styles.functionsGrid}>
            <TouchableOpacity 
              style={styles.functionCard}
              onPress={() => navigation.navigate('DocumentContractors')}
            >
              <Ionicons name="document-text-outline" size={32} color="#3498db" />
              <Text style={styles.functionTitle}>Gestión Documental</Text>
              <Text style={styles.functionSubtitle}>Revisar documentos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.functionCard}
              onPress={() => navigation.navigate('Contractors')}
            >
              <Ionicons name="people-outline" size={32} color="#2ecc71" />
              <Text style={styles.functionTitle}>Contratistas</Text>
              <Text style={styles.functionSubtitle}>Gestionar contratistas</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.functionCard}
              onPress={() => navigation.navigate('Contracts')}
            >
              <Ionicons name="document-outline" size={32} color="#e74c3c" />
              <Text style={styles.functionTitle}>Contratos</Text>
              <Text style={styles.functionSubtitle}>
                {user?.role === 'funcionario' ? 'Consultar contratos' : 'Gestionar contratos'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.functionCard}
              onPress={() => navigation.navigate('DataAnalysis')}
            >
              <Ionicons name="analytics" size={32} color="#f39c12" />
              <Text style={styles.functionTitle}>Análisis de Datos</Text>
              <Text style={styles.functionSubtitle}>Analizar gestiones documentales</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.functionCard}
              onPress={() => navigation.navigate('Verification')}
            >
              <Ionicons name="shield-checkmark" size={32} color="#27ae60" />
              <Text style={styles.functionTitle}>Verificaciones</Text>
              <Text style={styles.functionSubtitle}>Estado final de documentos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.functionCard}>
              <Ionicons name="settings-outline" size={32} color="#9b59b6" />
              <Text style={styles.functionTitle}>Configuración</Text>
              <Text style={styles.functionSubtitle}>Ajustes del sistema</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estadísticas de Contratos */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bar-chart-outline" size={24} color="#f39c12" />
            <Text style={styles.cardTitle}>Estadísticas de Contratos</Text>
            {statsLoading && (
              <ActivityIndicator size="small" color="#f39c12" style={{ marginLeft: 8 }} />
            )}
          </View>
          
          {contractStats ? (
            <View style={styles.statsContainer}>
              {/* Primera fila */}
              <View style={styles.statsRow}>
                <View style={[styles.statItem, styles.statItemPrimary]}>
                  <Text style={[styles.statNumber, styles.statNumberPrimary]}>
                    {contractStats['Total de contratos'] || 0}
                  </Text>
                  <Text style={styles.statLabel}>Total Contratos</Text>
                </View>
                
                <View style={[styles.statItem, styles.statItemSuccess]}>
                  <Text style={[styles.statNumber, styles.statNumberSuccess]}>
                    {contractStats['Contratos activos'] || 0}
                  </Text>
                  <Text style={styles.statLabel}>Activos</Text>
                </View>
              </View>

              {/* Segunda fila */}
              <View style={styles.statsRow}>
                <View style={[styles.statItem, styles.statItemDanger]}>
                  <Text style={[styles.statNumber, styles.statNumberDanger]}>
                    {contractStats['Contratos inactivos'] || 0}
                  </Text>
                  <Text style={styles.statLabel}>Inactivos</Text>
                </View>
                
                <View style={[styles.statItem, styles.statItemWarning]}>
                  <Text style={[styles.statNumber, styles.statNumberWarning]}>
                    {contractStats['Contratos expirados'] || 0}
                  </Text>
                  <Text style={styles.statLabel}>Expirados</Text>
                </View>
              </View>

              {/* Tercera fila */}
              <View style={styles.statsRow}>
                <View style={[styles.statItem, styles.statItemInfo]}>
                  <Text style={[styles.statNumber, styles.statNumberInfo]}>
                    {contractStats['Contratos vinculados'] || 0}
                  </Text>
                  <Text style={styles.statLabel}>Vinculados</Text>
                </View>
                
                <View style={[styles.statItem, styles.statItemSecondary]}>
                  <Text style={[styles.statNumber, styles.statNumberSecondary]}>
                    {contractStats['Contratos no vinculados'] || 0}
                  </Text>
                  <Text style={styles.statLabel}>No Vinculados</Text>
                </View>
              </View>

              {/* Indicador de actualización */}
              <View style={styles.lastUpdateContainer}>
                <Ionicons name="time-outline" size={12} color="#666" />
                <Text style={styles.lastUpdateText}>
                  Actualizado: {new Date().toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.statsErrorContainer}>
              <Ionicons name="alert-circle-outline" size={32} color="#ccc" />
              <Text style={styles.statsErrorText}>
                {statsLoading ? 'Cargando estadísticas...' : 'No se pudieron cargar las estadísticas'}
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={loadContractStats}
                disabled={statsLoading}
              >
                <Ionicons name="refresh" size={16} color="#0066CC" />
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Estadísticas de Documentos */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={24} color="#27ae60" />
            <Text style={styles.cardTitle}>Estadísticas de Documentos</Text>
            {statsLoading && (
              <ActivityIndicator size="small" color="#27ae60" style={{ marginLeft: 8 }} />
            )}
          </View>
          
          {documentStats ? (
            <View style={styles.statsContainer}>
              {/* Primera fila */}
              <View style={styles.statsRow}>
                <View style={[styles.statItem, styles.statItemPrimary]}>
                  <Text style={[styles.statNumber, styles.statNumberPrimary]}>
                    {documentStats['total de documentos'] || 0}
                  </Text>
                  <Text style={styles.statLabel}>Total Gestiones</Text>
                </View>
                
                <View style={[styles.statItem, styles.statItemInfo]}>
                  <Text style={[styles.statNumber, styles.statNumberInfo]}>
                    {documentStats['Documentos en el sistema'] || 0}
                  </Text>
                  <Text style={styles.statLabel}>En el Sistema</Text>
                </View>
              </View>

              {/* Segunda fila */}
              <View style={styles.statsRow}>
                <View style={[styles.statItem, styles.statItemSuccess]}>
                  <Text style={[styles.statNumber, styles.statNumberSuccess]}>
                    {documentStats['documentos activos'] || 0}
                  </Text>
                  <Text style={styles.statLabel}>Activos</Text>
                </View>
                
                <View style={[styles.statItem, styles.statItemDanger]}>
                  <Text style={[styles.statNumber, styles.statNumberDanger]}>
                    {documentStats['documentos inactivos'] || 0}
                  </Text>
                  <Text style={styles.statLabel}>Inactivos</Text>
                </View>
              </View>

              {/* Tercera fila */}
              <View style={styles.statsRow}>
                <View style={[styles.statItem, styles.statItemWarning]}>
                  <Text style={[styles.statNumber, styles.statNumberWarning]}>
                    {documentStats['Contratistas sin gestiones documentales'] || 0}
                  </Text>
                  <Text style={styles.statLabel}>Sin Gestión</Text>
                </View>
                
                <View style={[styles.statItem, styles.statItemSecondary]}>
                  <Text style={[styles.statNumber, styles.statNumberSecondary]}>
                    {documentStats['total de documentos'] > 0 
                      ? Math.round((documentStats['documentos activos'] / documentStats['total de documentos']) * 100)
                      : 0}%
                  </Text>
                  <Text style={styles.statLabel}>% Activos</Text>
                </View>
              </View>

              {/* Indicador de actualización */}
              <View style={styles.lastUpdateContainer}>
                <Ionicons name="time-outline" size={12} color="#666" />
                <Text style={styles.lastUpdateText}>
                  Actualizado: {new Date().toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.statsErrorContainer}>
              <Ionicons name="alert-circle-outline" size={32} color="#ccc" />
              <Text style={styles.statsErrorText}>
                {statsLoading ? 'Cargando estadísticas...' : 'No se pudieron cargar las estadísticas de documentos'}
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={loadDocumentStats}
                disabled={statsLoading}
              >
                <Ionicons name="refresh" size={16} color="#0066CC" />
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ffffff" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
    marginLeft: 6,
  },
  profileButton: {
    padding: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  functionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  functionCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  functionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 8,
    textAlign: 'center',
  },
  functionSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    padding: 12,
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Nuevos estilos para estadísticas de contratos
  statsContainer: {
    paddingVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statItemPrimary: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  statNumberPrimary: {
    color: '#1976d2',
  },
  statItemSuccess: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  statNumberSuccess: {
    color: '#388e3c',
  },
  statItemDanger: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  statNumberDanger: {
    color: '#d32f2f',
  },
  statItemWarning: {
    backgroundColor: '#fff8e1',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  statNumberWarning: {
    color: '#f57c00',
  },
  statItemInfo: {
    backgroundColor: '#e0f2f1',
    borderLeftWidth: 4,
    borderLeftColor: '#009688',
  },
  statNumberInfo: {
    color: '#00695c',
  },
  statItemSecondary: {
    backgroundColor: '#f3e5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#9c27b0',
  },
  statNumberSecondary: {
    color: '#7b1fa2',
  },
  lastUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  lastUpdateText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  statsErrorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statsErrorText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  retryButtonText: {
    fontSize: 12,
    color: '#0066CC',
    marginLeft: 4,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 20,
  },
});

export default HomeScreen;