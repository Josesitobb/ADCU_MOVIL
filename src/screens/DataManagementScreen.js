import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../config/config';

// Campos de gestión documental
const DATA_MANAGEMENT_FIELDS = {
  filingLetter: 'Carta de Radicación',
  certificateOfCompliance: 'Certificado de Cumplimiento',
  signedCertificateOfCompliance: 'Certificado de Cumplimiento Firmado',
  activityReport: 'Reporte de Actividades',
  taxQualityCertificate: 'Certificado de Calidad Tributaria',
  socialSecurity: 'Seguridad Social',
  rut: 'RUT',
  rit: 'RIT',
  trainings: 'Capacitaciones',
  initiationRecord: 'Acta de Iniciación',
  accountCertification: 'Certificación de Cuenta'
};

const DataManagementScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  // Función simple para cargar datos de la API
  const loadData = async () => {
    try {
      setLoading(true);
      const managementId = '68dd4f7a1176e65bec02f3ae';
      
      console.log('📊 Cargando datos del análisis...');
      
      // Obtener el token de AsyncStorage
      const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        Alert.alert('Error', 'No se encontró token de autenticación. Por favor inicia sesión nuevamente.');
        return;
      }
      
      const response = await fetch(`http://192.168.0.7:5000/api/Data/${managementId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const responseData = await response.json();
      
      if (responseData.success) {
        setData(responseData.data);
      } else {
        if (responseData.message === "No existe una gestion documental con ese id") {
          Alert.alert(
            '📞 Contacte al Administrador',
            'Llame a su administrador para hacer el análisis de sus documentos.',
            [{ text: 'Entendido' }]
          );
        } else {
          Alert.alert('Error', responseData.message);
        }
        setData(null);
      }
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);





  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Cargando análisis...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Análisis de Documentos</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons name="refresh-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {data ? (
          <View style={styles.dataContainer}>
            {/* Información General */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>📋 Información General</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID:</Text>
                <Text style={styles.infoValue}>{data._id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contratista:</Text>
                <Text style={styles.infoValue}>{data.contractorId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Creado:</Text>
                <Text style={styles.infoValue}>{new Date(data.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>

            {/* Tabla de Documentos */}
            <View style={styles.tableCard}>
              <Text style={styles.cardTitle}>📄 Estado de Documentos</Text>
              
              {/* Encabezado */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerText, { flex: 3 }]}>Documento</Text>
                <Text style={[styles.headerText, { flex: 1 }]}>Estado</Text>
              </View>

              {/* Filas */}
              {Object.entries(data).map(([key, value]) => {
                if (key !== '_id' && key !== 'contractorId' && key !== 'createdAt' && key !== 'updatedAt' && key !== '__v' && 
                    value && typeof value === 'object' && value.status !== undefined) {
                  
                  const fieldName = DATA_MANAGEMENT_FIELDS[key] || key;
                  const isApproved = value.status === true;
                  
                  return (
                    <TouchableOpacity 
                      key={key} 
                      style={styles.tableRow}
                      onPress={() => {
                        Alert.alert(
                          fieldName,
                          `Estado: ${isApproved ? 'APROBADO' : 'RECHAZADO'}\n\nDescripción:\n${value.description}`,
                          [{ text: 'OK' }]
                        );
                      }}
                    >
                      <Text style={[styles.cellText, { flex: 3 }]} numberOfLines={2}>
                        {fieldName}
                      </Text>
                      <View style={[styles.statusCell, { flex: 1 }]}>
                        <View style={[styles.statusBadge, { backgroundColor: isApproved ? '#10B981' : '#EF4444' }]}>
                          <Ionicons 
                            name={isApproved ? "checkmark" : "close"} 
                            size={14} 
                            color="#ffffff" 
                          />
                          <Text style={styles.statusText}>
                            {isApproved ? 'OK' : 'NO'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }
                return null;
              })}
            </View>

            {/* Resumen */}
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>📊 Resumen</Text>
              {(() => {
                const docs = Object.entries(data).filter(([key, value]) => 
                  key !== '_id' && key !== 'contractorId' && key !== 'createdAt' && key !== 'updatedAt' && key !== '__v' && 
                  value && typeof value === 'object' && value.status !== undefined
                );
                const approved = docs.filter(([_, value]) => value.status === true).length;
                const rejected = docs.filter(([_, value]) => value.status === false).length;
                
                return (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total:</Text>
                      <Text style={styles.summaryValue}>{docs.length}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>✅ Aprobados:</Text>
                      <Text style={[styles.summaryValue, { color: '#10B981' }]}>{approved}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>❌ Rechazados:</Text>
                      <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{rejected}</Text>
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="document-text-outline" size={64} color="#bdc3c7" />
            <Text style={styles.noDataText}>No hay datos disponibles</Text>
            <Text style={styles.noDataSubtext}>Presiona actualizar para cargar</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#3498db',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dataContainer: {
    paddingVertical: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    width: 100,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 14,
    color: '#2c3e50',
    paddingRight: 8,
  },
  statusCell: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noDataText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 16,
    fontWeight: '500',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 8,
  },
});

export default DataManagementScreen;
