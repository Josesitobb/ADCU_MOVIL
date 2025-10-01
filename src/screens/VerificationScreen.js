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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/authService';

const VerificationScreen = ({ navigation }) => {
  const [verifications, setVerifications] = useState([]);
  const [filteredVerifications, setFilteredVerifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'approved', 'pending'

  useEffect(() => {
    loadVerifications();
  }, []);

  useEffect(() => {
    filterVerifications();
  }, [verifications, searchText, filterStatus]);

  const loadVerifications = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Cargando verificaciones...');
      
      const response = await apiClient.get('/Verification/');
      
      if (response.data && response.data.success) {
        console.log('✅ Verificaciones cargadas:', response.data.data.length);
        const verificationsData = response.data.data || [];
        setVerifications(verificationsData);
        setFilteredVerifications(verificationsData);
      } else {
        console.error('❌ Error al cargar verificaciones');
        Alert.alert('Error', 'Error al cargar las verificaciones');
        setVerifications([]);
        setFilteredVerifications([]);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Error', 'Error al cargar los datos de verificación');
      setVerifications([]);
      setFilteredVerifications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadVerifications();
  };

  const filterVerifications = () => {
    let filtered = [...verifications];

    // Filtrar por texto de búsqueda
    if (searchText.trim()) {
      filtered = filtered.filter(verification => {
        const description = verification.description.toLowerCase();
        const id = verification._id.toLowerCase();
        return description.includes(searchText.toLowerCase()) || 
               id.includes(searchText.toLowerCase());
      });
    }

    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(verification => {
        if (filterStatus === 'approved') {
          return verification.state === true;
        } else if (filterStatus === 'pending') {
          return verification.state === false;
        }
        return true;
      });
    }

    setFilteredVerifications(filtered);
  };

  const parseMissingDocuments = (description) => {
    if (!description.includes('faltan documentos por analizar:')) {
      return [];
    }
    
    const documentsText = description.split('faltan documentos por analizar:')[1];
    if (!documentsText) return [];
    
    return documentsText.split(',').map(doc => doc.trim());
  };

  const getDocumentDisplayName = (docName) => {
    const documentNames = {
      'filingLetter': 'Carta de Radicación',
      'certificateOfCompliance': 'Certificado de Cumplimiento',
      'activityReport': 'Informe de Actividades',
      'taxQualityCertificate': 'Certificado Tributario',
      'rut': 'RUT',
      'rit': 'RIT',
      'initiationRecord': 'Acta de Iniciación',
      'accountCertification': 'Certificación de Cuentas'
    };
    return documentNames[docName] || docName;
  };

  const getDocumentIcon = (docName) => {
    const documentIcons = {
      'filingLetter': 'mail-outline',
      'certificateOfCompliance': 'checkmark-circle-outline',
      'activityReport': 'document-text-outline',
      'taxQualityCertificate': 'receipt-outline',
      'rut': 'card-outline',
      'rit': 'business-outline',
      'initiationRecord': 'clipboard-outline',
      'accountCertification': 'calculator-outline'
    };
    return documentIcons[docName] || 'document-outline';
  };

  const renderVerificationCard = (verification) => {
    const isApproved = verification.state;
    const missingDocs = parseMissingDocuments(verification.description);
    const hasAnalysis = verification.dataManagemnts !== null;

    return (
      <View key={verification._id} style={styles.verificationCard}>
        {/* Header */}
        <View style={[
          styles.cardHeader,
          { backgroundColor: isApproved ? '#d4edda' : '#f8d7da' }
        ]}>
          <View style={styles.statusInfo}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: isApproved ? '#28a745' : '#dc3545' }
            ]}>
              <Ionicons 
                name={isApproved ? "checkmark-circle" : "alert-circle"} 
                size={24} 
                color="#fff" 
              />
            </View>
            <View style={styles.statusDetails}>
              <Text style={[
                styles.statusTitle,
                { color: isApproved ? '#155724' : '#721c24' }
              ]}>
                {isApproved ? 'Verificación Completa' : 'Verificación Pendiente'}
              </Text>
              <Text style={styles.verificationId}>
                ID: {verification._id.slice(-8).toUpperCase()}
              </Text>
            </View>
          </View>

          {hasAnalysis && (
            <TouchableOpacity
              style={styles.analysisButton}
              onPress={() => navigation.navigate('Comparisons')}
            >
              <Ionicons name="analytics" size={16} color="#0066CC" />
              <Text style={styles.analysisButtonText}>Ver Análisis</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contenido */}
        <View style={styles.cardContent}>
          {isApproved ? (
            <View style={styles.approvedSection}>
              <View style={styles.successIcon}>
                <Ionicons name="trophy" size={32} color="#28a745" />
              </View>
              <Text style={styles.approvedTitle}>¡Todos los documentos aprobados!</Text>
              <Text style={styles.approvedDescription}>
                {verification.description}
              </Text>
              {hasAnalysis && (
                <View style={styles.analysisInfo}>
                  <Ionicons name="link" size={16} color="#0066CC" />
                  <Text style={styles.analysisText}>
                    Análisis ID: {verification.dataManagemnts._id.slice(-8).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.pendingSection}>
              <View style={styles.pendingHeader}>
                <Ionicons name="warning" size={24} color="#dc3545" />
                <Text style={styles.pendingTitle}>Documentos Faltantes</Text>
              </View>
              
              <Text style={styles.pendingDescription}>
                {verification.description.split('faltan documentos por analizar:')[0]}
              </Text>

              {missingDocs.length > 0 && (
                <View style={styles.missingDocumentsContainer}>
                  <Text style={styles.missingDocumentsTitle}>
                    Documentos por analizar ({missingDocs.length}):
                  </Text>
                  {missingDocs.map((docName, index) => (
                    <View key={index} style={styles.missingDocumentItem}>
                      <Ionicons 
                        name={getDocumentIcon(docName)} 
                        size={16} 
                        color="#dc3545" 
                      />
                      <Text style={styles.missingDocumentText}>
                        {getDocumentDisplayName(docName)}
                      </Text>
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Pendiente</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer con acciones */}
        <View style={styles.cardFooter}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Estado: {isApproved ? 'Completo' : 'En Proceso'}
            </Text>
          </View>
          
          {!isApproved && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('DataAnalysis')}
            >
              <Ionicons name="add-circle" size={16} color="#0066CC" />
              <Text style={styles.actionButtonText}>Crear Análisis</Text>
            </TouchableOpacity>
          )}
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
          <Text style={styles.title}>Verificaciones</Text>
          <Text style={styles.subtitle}>Estado Final de Documentos</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por ID o descripción..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterButtons}
          contentContainerStyle={styles.filterButtonsContent}
        >
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
              Todos ({verifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'approved' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('approved')}
          >
            <Ionicons name="checkmark-circle" size={16} color={filterStatus === 'approved' ? "#fff" : "#28a745"} />
            <Text style={[styles.filterButtonText, filterStatus === 'approved' && styles.filterButtonTextActive]}>
              Aprobados ({verifications.filter(v => v.state === true).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('pending')}
          >
            <Ionicons name="alert-circle" size={16} color={filterStatus === 'pending' ? "#fff" : "#dc3545"} />
            <Text style={[styles.filterButtonText, filterStatus === 'pending' && styles.filterButtonTextActive]}>
              Pendientes ({verifications.filter(v => v.state === false).length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="stats-chart" size={20} color="#0066CC" />
            <Text style={styles.summaryTitle}>Resumen de Verificaciones</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNumber}>{filteredVerifications.length}</Text>
              <Text style={styles.summaryStatLabel}>Total</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatNumber, {color: "#28a745"}]}>
                {filteredVerifications.filter(v => v.state === true).length}
              </Text>
              <Text style={styles.summaryStatLabel}>Aprobados</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatNumber, {color: "#dc3545"}]}>
                {filteredVerifications.filter(v => v.state === false).length}
              </Text>
              <Text style={styles.summaryStatLabel}>Pendientes</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatNumber, {color: "#0066CC"}]}>
                {verifications.length > 0 
                  ? Math.round((verifications.filter(v => v.state === true).length / verifications.length) * 100)
                  : 0}%
              </Text>
              <Text style={styles.summaryStatLabel}>Completado</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Lista de verificaciones */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Cargando verificaciones...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.verificationsList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredVerifications.length > 0 ? (
            <>
              {filteredVerifications.map(renderVerificationCard)}
              <View style={styles.endSpacer} />
            </>
          ) : (
            <View style={styles.emptyContainer}>
              {searchText.length > 0 || filterStatus !== 'all' ? (
                <>
                  <Ionicons name="search-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>No se encontraron resultados</Text>
                  <Text style={styles.emptySubtext}>
                    Intenta cambiar los filtros o términos de búsqueda
                  </Text>
                  <TouchableOpacity 
                    style={styles.clearFiltersButton}
                    onPress={() => {
                      setSearchText('');
                      setFilterStatus('all');
                    }}
                  >
                    <Text style={styles.clearFiltersButtonText}>Limpiar Filtros</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>No hay verificaciones disponibles</Text>
                  <Text style={styles.emptySubtext}>
                    Aún no se han realizado verificaciones de documentos
                  </Text>
                </>
              )}
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
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 16,
    marginBottom: 12,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 10,
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButtonsContent: {
    paddingRight: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  verificationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  verificationCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
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
    padding: 16,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDetails: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  verificationId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  analysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  analysisButtonText: {
    fontSize: 12,
    color: '#0066CC',
    marginLeft: 4,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  approvedSection: {
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 12,
  },
  approvedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 8,
    textAlign: 'center',
  },
  approvedDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  analysisInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 15,
  },
  analysisText: {
    fontSize: 12,
    color: '#0066CC',
    marginLeft: 4,
    fontWeight: '600',
  },
  pendingSection: {
    
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
    marginLeft: 8,
  },
  pendingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  missingDocumentsContainer: {
    
  },
  missingDocumentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  missingDocumentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  missingDocumentText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#333',
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#dc3545',
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  progressInfo: {
    flex: 1,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0066CC',
    borderRadius: 20,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
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
    paddingHorizontal: 40,
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
    lineHeight: 20,
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0066CC',
    borderRadius: 20,
  },
  clearFiltersButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  endSpacer: {
    height: 20,
  },
});

export default VerificationScreen;