import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllDocumentManagements } from '../services/authService';
import apiClient from '../services/authService';

const DataAnalysisScreen = ({ navigation }) => {
  const [documentManagements, setDocumentManagements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analyzingData, setAnalyzingData] = useState({});

  useEffect(() => {
    loadDocumentManagements();
  }, []);

  const loadDocumentManagements = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Cargando gestiones documentales para análisis...');
      
      const result = await getAllDocumentManagements();
      
      if (result.success && Array.isArray(result.data)) {
        console.log('✅ Gestiones documentales cargadas:', result.data.length);
        setDocumentManagements(result.data);
      } else {
        console.error('❌ Error al cargar gestiones:', result.message);
        Alert.alert('Error', result.message || 'Error al cargar datos');
        setDocumentManagements([]);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Error', 'Error al cargar los datos');
      setDocumentManagements([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDocumentManagements();
  };

  const analyzeData = async (managementId, contractorName) => {
    try {
      setAnalyzingData(prev => ({ ...prev, [managementId]: true }));
      console.log('🔍 ========== INICIANDO ANÁLISIS LARGO ==========');
      console.log('🔍 Management ID:', managementId);
      console.log('🔍 Contratista:', contractorName);
      
      // Mostrar alerta informativa sobre tiempo de espera
      Alert.alert(
        '⏳ Análisis Iniciado',
        `El análisis de documentos para ${contractorName} puede tardar entre 10-15 minutos.\n\n✅ La aplicación seguirá funcionando\n⏰ Te notificaremos cuando termine\n📱 Puedes usar otras funciones mientras esperas`,
        [
          { 
            text: 'Continuar en Segundo Plano', 
            style: 'default',
            onPress: () => {
              console.log('🔄 Usuario confirmó continuar en segundo plano');
            }
          }
        ]
      );

      // Crear comparación con método POST y timeout extendido (20 minutos)
      console.log('📡 Enviando petición POST con timeout extendido...');
      const response = await apiClient.post(`/Data/${managementId}`, {}, {
        timeout: 1200000, // 20 minutos en milisegundos
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 ========== RESPUESTA RECIBIDA ==========');
      console.log('📊 Status:', response.status);
      console.log('📊 StatusText:', response.statusText);
      console.log('📊 Headers:', response.headers);
      console.log('📊 Data completa:', JSON.stringify(response.data, null, 2));
      
      const analysisResult = response.data;

      // Mostrar el resultado del análisis
      if (analysisResult && analysisResult.success) {
        Alert.alert(
          `✅ Análisis Completado`,
          `Comparación creada exitosamente para ${contractorName}.\n\n${analysisResult.message || 'Datos procesados correctamente'}`,
          [{ text: 'Ver Comparaciones', onPress: () => navigation.navigate('Comparisons') }]
        );
      } else {
        Alert.alert(
          '⚠️ Respuesta Inesperada',
          `La comparación se envió pero la respuesta fue:\n\n${JSON.stringify(analysisResult, null, 2)}`,
          [{ text: 'Entendido' }]
        );
      }

    } catch (error) {
      // Manejo específico para errores 400 de archivos faltantes (sin logs para evitar pantalla de error)
      if (error.response && error.response.status === 400 && error.response.data?.message) {
        const message = error.response.data.message;
        
        // Detectar si es error de archivo faltante
        if (message.includes('Falta el archivo') || message.includes('falta') || message.includes('archivo')) {
          console.log('🔍 Análisis detenido - Documentos faltantes para:', contractorName);
          Alert.alert(
            '📄 Documentos Incompletos',
            `No se puede realizar el análisis para ${contractorName} porque faltan documentos.\n\n📋 Detalle: ${message}\n\n💡 Asegúrate de que todos los documentos estén subidos correctamente antes de crear el análisis.`,
            [
              { text: 'Revisar Documentos', onPress: () => navigation.navigate('DocumentContractors') },
              { text: 'Entendido', style: 'cancel' }
            ]
          );
          return; // Salir temprano - error manejado
        }
        
        // Para otros errores 400 de validación
        console.log('⚠️ Error de validación para:', contractorName);
        Alert.alert(
          '⚠️ Error de Validación',
          `No se puede procesar el análisis de ${contractorName}.\n\n📋 Motivo: ${message}`,
          [{ text: 'Entendido' }]
        );
        return; // Salir temprano - error manejado
      }

      // Para otros errores, mostrar logs detallados
      console.error('❌ ========== ERROR DETALLADO ==========');
      console.error('❌ Error completo:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error request:', error.request);
      console.error('❌ Error config:', error.config);

      let errorMessage = 'Error desconocido';
      let errorDetails = '';

      if (error.response) {
        // El servidor respondió con un código de error
        console.error('❌ SERVER ERROR - Status:', error.response.status);
        console.error('❌ SERVER ERROR - Data:', error.response.data);
        errorMessage = `Error del servidor (${error.response.status})`;
        errorDetails = error.response.data?.message || JSON.stringify(error.response.data);
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        console.error('❌ NETWORK ERROR - Request:', error.request);
        errorMessage = 'Error de red - Sin respuesta del servidor';
        errorDetails = 'Verifica tu conexión a internet y que el servidor esté funcionando';
      } else {
        // Algo más pasó
        console.error('❌ CONFIG ERROR:', error.message);
        errorMessage = 'Error de configuración';
        errorDetails = error.message;
      }

      Alert.alert(
        'Error en Análisis',
        `No se pudo analizar los datos de ${contractorName}.\n\n${errorMessage}\n\n${errorDetails}`,
        [
          { text: 'Reintentar', onPress: () => analyzeData(managementId, contractorName) },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    } finally {
      setAnalyzingData(prev => ({ ...prev, [managementId]: false }));
    }
  };

  const getContractorFullName = (userContract) => {
    if (!userContract || !userContract.user) return 'Sin información';
    const { firsName, lastName } = userContract.user;
    return `${firsName || ''} ${lastName || ''}`.trim() || 'Sin nombre';
  };

  const getDocumentsCount = (management) => {
    const documentFields = [
      'filingLetter', 'certificateOfCompliance', 'signedCertificateOfCompliance',
      'activityReport', 'taxQualityCertificate', 'socialSecurity', 'rut',
      'rit', 'trainings', 'initiationRecord', 'accountCertification'
    ];
    
    return documentFields.filter(field => 
      management[field] && management[field].toString().trim() !== ''
    ).length;
  };

  const renderContractorCard = (management) => {
    const contractorName = getContractorFullName(management.userContract);
    const documentsCount = getDocumentsCount(management);
    const isAnalyzing = analyzingData[management._id] || false;

    return (
      <View key={management._id} style={styles.contractorCard}>
        <View style={styles.cardHeader}>
          <View style={styles.contractorInfo}>
            <Ionicons name="person" size={24} color="#0066CC" />
            <View style={styles.contractorDetails}>
              <Text style={styles.contractorName}>{contractorName}</Text>
              <Text style={styles.contractorEmail}>
                {management.userContract?.user?.email || 'Sin email'}
              </Text>
            </View>
          </View>
          <View style={styles.contractorStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{documentsCount}</Text>
              <Text style={styles.statLabel}>Docs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>v{management.version}</Text>
              <Text style={styles.statLabel}>Ver</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.metaText}>
              {new Date(management.creationDate).toLocaleDateString('es-ES')}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{management.retentionTime} días</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons 
              name={management.state ? "checkmark-circle" : "close-circle"} 
              size={14} 
              color={management.state ? "#28a745" : "#dc3545"} 
            />
            <Text style={[styles.metaText, { color: management.state ? "#28a745" : "#dc3545" }]}>
              {management.state ? "Activo" : "Inactivo"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.analyzeButton, isAnalyzing && styles.analyzingButton]}
          onPress={() => analyzeData(management._id, contractorName)}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.analyzeButtonText}>Creando...</Text>
            </>
          ) : (
            <>
              <Ionicons name="analytics" size={20} color="#fff" />
              <Text style={styles.analyzeButtonText}>Crear Comparación</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0066CC" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Análisis de Datos</Text>
          <Text style={styles.subtitle}>Gestiones Documentales</Text>
        </View>
        <TouchableOpacity
          style={styles.comparisonsButton}
          onPress={() => navigation.navigate('Comparisons')}
        >
          <Ionicons name="list" size={20} color="#0066CC" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="analytics" size={24} color="#0066CC" />
            <Text style={styles.summaryTitle}>Resumen General</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNumber}>{documentManagements.length}</Text>
              <Text style={styles.summaryStatLabel}>Total Contratistas</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNumber}>
                {documentManagements.filter(m => m.state).length}
              </Text>
              <Text style={styles.summaryStatLabel}>Activos</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNumber}>
                {documentManagements.reduce((total, m) => total + getDocumentsCount(m), 0)}
              </Text>
              <Text style={styles.summaryStatLabel}>Total Docs</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Lista de contratistas */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Cargando análisis...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contractorsList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {documentManagements.length > 0 ? (
            documentManagements.map(renderContractorCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="analytics-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No hay datos para analizar</Text>
              <Text style={styles.emptySubtext}>
                No se encontraron gestiones documentales
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  summaryContainer: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  contractorsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contractorCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contractorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contractorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contractorEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  contractorStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginLeft: 16,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
  },
  analyzeButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  analyzingButton: {
    backgroundColor: '#999',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  comparisonsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
});

export default DataAnalysisScreen;