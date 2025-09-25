import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { 
  getUserContractData, 
  getCurrentUserId, 
  calculateContractProgress, 
  getContractStatus,
  formatCurrency,
  formatDate 
} from '../services/contractService';

const ContractScreen = () => {
  const [contractData, setContractData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadContractData();
  }, []);

  const loadContractData = async () => {
    try {
      setError(null);
      const userId = await getCurrentUserId();
      
      if (!userId) {
        setError('No se pudo obtener el ID del usuario');
        setLoading(false);
        return;
      }

      const result = await getUserContractData(userId);
      
      if (result.success) {
        // Procesar los datos para la UI
        const processedData = {
          // Información del usuario
          contractorName: `${result.user.firstName} ${result.user.lastName}`,
          contractorEmail: result.user.email,
          contractorPhone: result.user.telephone,
          contractorAddress: result.user.residentialAddress,
          institutionalEmail: result.user.institutionalEmail,
          position: result.user.position,
          
          // Información del contrato
          contractNumber: result.contract.contractNumber,
          typeOfContract: result.contract.typeOfContract,
          startDate: result.contract.startDate,
          endDate: result.contract.endDate,
          totalValue: result.contract.totalValue,
          periodValue: result.contract.periodValue,
          objective: result.contract.objective,
          
          // Estados calculados
          status: getContractStatus(result.contract),
          progress: calculateContractProgress(result.contract.startDate, result.contract.endDate),
          
          // Flags
          hasExtension: result.contract.hasExtension,
          hasAddiction: result.contract.hasAddiction,
          hasSuspension: result.contract.hasSuspension,
          
          // Datos adicionales
          economicActivityNumber: result.user.economicActivityNumber
        };
        
        setContractData(processedData);
      } else {
        setError(result.message || 'Error al cargar los datos del contrato');
      }
    } catch (err) {
      console.error('Error loading contract data:', err);
      setError('Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContractData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'En Progreso':
        return '#3498db';
      case 'Completado':
        return '#2ecc71';
      case 'Pendiente':
        return '#f39c12';
      case 'Atrasado':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const handleDownloadContract = () => {
    Alert.alert(
      'Descargar Contrato',
      '¿Deseas descargar el documento del contrato?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descargar', onPress: () => {
          // Aquí implementarías la descarga del contrato
          Alert.alert('Información', 'Funcionalidad de descarga pendiente de API');
        }}
      ]
    );
  };

  // Mostrar loading
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Cargando datos del contrato...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={styles.errorTitle}>Error al cargar datos</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadContractData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mi Contrato</Text>
          <TouchableOpacity 
            style={styles.downloadButton}
            onPress={handleDownloadContract}
          >
            <Ionicons name="download-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Información General */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>Información General</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Número de Contrato:</Text>
            <Text style={styles.infoValue}>{contractData?.contractNumber || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contratista:</Text>
            <Text style={styles.infoValue}>{contractData?.contractorName || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo de Contrato:</Text>
            <Text style={styles.infoValue}>{contractData?.typeOfContract || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Valor Total:</Text>
            <Text style={[styles.infoValue, styles.valueText]}>
              {contractData?.totalValue ? formatCurrency(contractData.totalValue) : 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Valor Período:</Text>
            <Text style={[styles.infoValue, styles.valueText]}>
              {contractData?.periodValue ? formatCurrency(contractData.periodValue) : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Estado y Fechas */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={24} color="#2ecc71" />
            <Text style={styles.cardTitle}>Estado y Cronograma</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Estado:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contractData?.status) }]}>
                <Text style={styles.statusText}>{contractData?.status || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Progreso:</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${contractData?.progress || 0}%` }]} />
                </View>
                <Text style={styles.progressText}>{contractData?.progress || 0}%</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de Inicio:</Text>
            <Text style={styles.infoValue}>
              {contractData?.startDate ? formatDate(contractData.startDate) : 'N/A'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de Finalización:</Text>
            <Text style={styles.infoValue}>
              {contractData?.endDate ? formatDate(contractData.endDate) : 'N/A'}
            </Text>
          </View>

          {/* Flags del contrato */}
          <View style={styles.flagsContainer}>
            <View style={styles.flagItem}>
              <Ionicons 
                name={contractData?.hasExtension ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={contractData?.hasExtension ? "#2ecc71" : "#e74c3c"} 
              />
              <Text style={styles.flagText}>Prórroga</Text>
            </View>
            <View style={styles.flagItem}>
              <Ionicons 
                name={contractData?.hasAddiction ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={contractData?.hasAddiction ? "#2ecc71" : "#e74c3c"} 
              />
              <Text style={styles.flagText}>Adición</Text>
            </View>
            <View style={styles.flagItem}>
              <Ionicons 
                name={contractData?.hasSuspension ? "pause-circle" : "checkmark-circle"} 
                size={16} 
                color={contractData?.hasSuspension ? "#f39c12" : "#2ecc71"} 
              />
              <Text style={styles.flagText}>Suspensión</Text>
            </View>
          </View>
        </View>

        {/* Objetivo del Contrato */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={24} color="#f39c12" />
            <Text style={styles.cardTitle}>Objetivo del Contrato</Text>
          </View>
          <Text style={styles.description}>
            {contractData?.objective || 'No se ha especificado el objetivo del contrato'}
          </Text>
        </View>

        {/* Información del Contratista */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={24} color="#9b59b6" />
            <Text style={styles.cardTitle}>Información del Contratista</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre:</Text>
            <Text style={styles.infoValue}>{contractData?.contractorName || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Personal:</Text>
            <Text style={styles.infoValue}>{contractData?.contractorEmail || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Institucional:</Text>
            <Text style={styles.infoValue}>{contractData?.institutionalEmail || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teléfono:</Text>
            <Text style={styles.infoValue}>{contractData?.contractorPhone || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cargo:</Text>
            <Text style={styles.infoValue}>{contractData?.position || 'N/A'}</Text>
          </View>

          {contractData?.economicActivityNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Actividad Económica:</Text>
              <Text style={styles.infoValue}>{contractData.economicActivityNumber}</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
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
  downloadButton: {
    backgroundColor: '#3498db',
    borderRadius: 25,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
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
    borderBottomColor: '#ecf0f1',
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    flex: 1,
    textAlign: 'right',
  },
  valueText: {
    color: '#2ecc71',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    width: 80,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '600',
    minWidth: 35,
  },
  description: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 22,
  },
  responsibilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  responsibilityText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  // Estilos para loading y error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para flags
  flagsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagText: {
    fontSize: 12,
    color: '#2c3e50',
    marginLeft: 4,
  },
});

export default ContractScreen;