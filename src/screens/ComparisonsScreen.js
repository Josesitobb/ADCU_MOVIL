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
import apiClient from '../services/authService';

const ComparisonsScreen = ({ navigation }) => {
  const [comparisons, setComparisons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadComparisons();
  }, []);

  const loadComparisons = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Cargando comparaciones...');
      
      const response = await apiClient.get('/Data');
      
      if (response.data && response.data.success) {
        console.log('✅ Comparaciones cargadas:', response.data.data.length);
        setComparisons(response.data.data || []);
      } else {
        console.error('❌ Error al cargar comparaciones');
        Alert.alert('Error', 'Error al cargar las comparaciones');
        setComparisons([]);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Error', 'Error al cargar los datos de comparación');
      setComparisons([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadComparisons();
  };

  const getDocumentFields = () => [
    { name: "filingLetter", label: "Carta de Radicación", icon: "mail-outline" },
    { name: "certificateOfCompliance", label: "Certificado de Cumplimiento", icon: "checkmark-circle-outline" },
    { name: "signedCertificateOfCompliance", label: "Certificado Firmado", icon: "ribbon-outline" },
    { name: "activityReport", label: "Informe de Actividades", icon: "document-text-outline" },
    { name: "taxQualityCertificate", label: "Certificado Tributario", icon: "receipt-outline" },
    { name: "socialSecurity", label: "Seguridad Social", icon: "shield-checkmark-outline" },
    { name: "rut", label: "RUT", icon: "card-outline" },
    { name: "rit", label: "RIT", icon: "business-outline" },
    { name: "trainings", label: "Capacitaciones", icon: "school-outline" },
    { name: "initiationRecord", label: "Acta de Iniciación", icon: "clipboard-outline" },
    { name: "accountCertification", label: "Certificación de Cuentas", icon: "calculator-outline" },
  ];

  const getComparisonStats = (comparison) => {
    const documentFields = getDocumentFields();
    let approved = 0;
    let total = 0;
    
    documentFields.forEach(field => {
      if (comparison[field.name]) {
        total++;
        if (comparison[field.name].status === true) {
          approved++;
        }
      }
    });
    
    return { approved, total, percentage: total > 0 ? Math.round((approved / total) * 100) : 0 };
  };

  const getContractorName = (comparison) => {
    // Buscar en cualquier documento el nombre del usuario
    const documentFields = getDocumentFields();
    for (let field of documentFields) {
      if (comparison[field.name] && comparison[field.name].usercomparasion) {
        return comparison[field.name].usercomparasion;
      }
    }
    return 'Contratista desconocido';
  };

  const renderDocumentStatus = (document, fieldInfo) => {
    if (!document) return null;

    return (
      <View key={fieldInfo.name} style={styles.documentItem}>
        <View style={styles.documentHeader}>
          <Ionicons 
            name={fieldInfo.icon} 
            size={16} 
            color={document.status ? "#28a745" : "#dc3545"} 
          />
          <Text style={styles.documentLabel}>{fieldInfo.label}</Text>
        </View>
        <View style={styles.documentStatus}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: document.status ? "#28a745" : "#dc3545" }
          ]}>
            <Ionicons 
              name={document.status ? "checkmark" : "close"} 
              size={12} 
              color="#fff" 
            />
          </View>
          <Text style={[
            styles.statusText,
            { color: document.status ? "#28a745" : "#dc3545" }
          ]}>
            {document.status ? "Aprobado" : "Rechazado"}
          </Text>
        </View>
        {document.description && (
          <Text style={styles.documentDescription}>
            {document.description}
          </Text>
        )}
      </View>
    );
  };

  const renderComparisonCard = (comparison) => {
    const stats = getComparisonStats(comparison);
    const contractorName = getContractorName(comparison);
    const documentFields = getDocumentFields();

    return (
      <View key={comparison._id} style={styles.comparisonCard}>
        {/* Header de la comparación */}
        <View style={styles.cardHeader}>
          <View style={styles.contractorInfo}>
            <Ionicons name="person" size={24} color="#0066CC" />
            <View style={styles.contractorDetails}>
              <Text style={styles.contractorName}>{contractorName}</Text>
              <Text style={styles.comparisonId}>
                ID: {comparison._id.slice(-8)}
              </Text>
            </View>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.percentageCircle}>
              <Text style={styles.percentageText}>{stats.percentage}%</Text>
            </View>
            <Text style={styles.statsText}>
              {stats.approved}/{stats.total} aprobados
            </Text>
          </View>
        </View>

        {/* Fechas */}
        <View style={styles.datesContainer}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.dateText}>
              Creado: {new Date(comparison.createdAt).toLocaleDateString('es-ES')}
            </Text>
          </View>
          <View style={styles.dateItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.dateText}>
              Actualizado: {new Date(comparison.updatedAt).toLocaleDateString('es-ES')}
            </Text>
          </View>
        </View>

        {/* Lista de documentos */}
        <View style={styles.documentsContainer}>
          <Text style={styles.documentsTitle}>Estado de Documentos:</Text>
          <ScrollView style={styles.documentsList} showsVerticalScrollIndicator={false}>
            {documentFields.map(field => 
              comparison[field.name] ? renderDocumentStatus(comparison[field.name], field) : null
            )}
          </ScrollView>
        </View>

        {/* Barra de progreso */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${stats.percentage}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Progreso: {stats.percentage}%
          </Text>
        </View>
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
          <Text style={styles.title}>Comparaciones</Text>
          <Text style={styles.subtitle}>Resultados de Análisis</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="analytics" size={24} color="#0066CC" />
            <Text style={styles.summaryTitle}>Resumen de Comparaciones</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNumber}>{comparisons.length}</Text>
              <Text style={styles.summaryStatLabel}>Total</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNumber}>
                {comparisons.filter(c => getComparisonStats(c).percentage === 100).length}
              </Text>
              <Text style={styles.summaryStatLabel}>Completos</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNumber}>
                {comparisons.length > 0 
                  ? Math.round(comparisons.reduce((sum, c) => sum + getComparisonStats(c).percentage, 0) / comparisons.length)
                  : 0}%
              </Text>
              <Text style={styles.summaryStatLabel}>Promedio</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Lista de comparaciones */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Cargando comparaciones...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.comparisonsList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {comparisons.length > 0 ? (
            comparisons.map(renderComparisonCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="analytics-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No hay comparaciones</Text>
              <Text style={styles.emptySubtext}>
                Aún no se han realizado comparaciones de documentos
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
  comparisonsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  comparisonCard: {
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
  comparisonId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statsContainer: {
    alignItems: 'center',
  },
  percentageCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
  },
  documentsContainer: {
    marginBottom: 16,
  },
  documentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  documentsList: {
    maxHeight: 200,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 4,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentLabel: {
    marginLeft: 8,
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  documentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  documentDescription: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066CC',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
});

export default ComparisonsScreen;