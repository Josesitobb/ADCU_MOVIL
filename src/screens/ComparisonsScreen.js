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

const ComparisonsScreen = ({ navigation }) => {
  const [comparisons, setComparisons] = useState([]);
  const [filteredComparisons, setFilteredComparisons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'approved', 'rejected'
  const [expandedCards, setExpandedCards] = useState({});

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
        const analysisData = response.data.data || [];
        setComparisons(analysisData);
        setFilteredComparisons(analysisData);
      } else {
        console.error('❌ Error al cargar comparaciones');
        Alert.alert('Error', 'Error al cargar las comparaciones');
        setComparisons([]);
        setFilteredComparisons([]);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Error', 'Error al cargar los datos de comparación');
      setComparisons([]);
      setFilteredComparisons([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Efecto para filtrar comparaciones
  useEffect(() => {
    filterComparisons();
  }, [comparisons, searchText, filterStatus]);

  const filterComparisons = () => {
    let filtered = [...comparisons];

    // Filtrar por texto de búsqueda
    if (searchText.trim()) {
      filtered = filtered.filter(comparison => {
        const contractorName = getContractorName(comparison).toLowerCase();
        return contractorName.includes(searchText.toLowerCase());
      });
    }

    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(comparison => {
        const stats = getComparisonStats(comparison);
        if (filterStatus === 'approved') {
          return stats.percentage === 100;
        } else if (filterStatus === 'rejected') {
          return stats.percentage < 100;
        }
        return true;
      });
    }

    setFilteredComparisons(filtered);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadComparisons();
  };

  const getDocumentFields = () => [
    { name: "filingLetter", label: "Carta de Radicación", icon: "mail-outline" },
    { name: "certificateOfCompliance", label: "Certificado de Cumplimiento", icon: "checkmark-circle-outline" },
    { name: "activityReport", label: "Informe de Actividades", icon: "document-text-outline" },
    { name: "taxQualityCertificate", label: "Certificado Tributario", icon: "receipt-outline" },
    { name: "rut", label: "RUT", icon: "card-outline" },
    { name: "rit", label: "RIT", icon: "business-outline" },
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

  const renderDocumentStatus = (document, fieldInfo, comparisonId, isExpanded) => {
    if (!document) return null;

    const hasLongDescription = document.description && document.description.length > 100;
    const shouldShowFull = isExpanded || !hasLongDescription;
    const displayDescription = shouldShowFull 
      ? document.description 
      : document.description?.substring(0, 100) + '...';

    return (
      <View key={fieldInfo.name} style={styles.documentItem}>
        <View style={styles.documentHeader}>
          <View style={styles.documentTitleSection}>
            <Ionicons 
              name={fieldInfo.icon} 
              size={16} 
              color={document.status ? "#28a745" : "#dc3545"} 
            />
            <Text style={styles.documentLabel}>{fieldInfo.label}</Text>
          </View>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: document.status ? "#28a745" : "#dc3545" }
          ]}>
            <Ionicons 
              name={document.status ? "checkmark" : "close"} 
              size={12} 
              color="#fff" 
            />
            <Text style={[
              styles.statusText,
              { color: document.status ? "#fff" : "#fff" }
            ]}>
              {document.status ? "✓" : "✗"}
            </Text>
          </View>
        </View>
        
        {document.description && (
          <View style={styles.documentDescriptionContainer}>
            <Text style={styles.documentDescription}>
              {displayDescription}
            </Text>
            {hasLongDescription && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => toggleCardExpansion(comparisonId, fieldInfo.name)}
              >
                <Text style={styles.expandButtonText}>
                  {shouldShowFull ? 'Ver menos' : 'Ver más'}
                </Text>
                <Ionicons 
                  name={shouldShowFull ? "chevron-up" : "chevron-down"} 
                  size={14} 
                  color="#0066CC" 
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Información adicional del documento */}
        <View style={styles.documentMeta}>
          <Text style={styles.documentUser}>
            Por: {document.usercomparasion}
          </Text>
        </View>
      </View>
    );
  };

  const toggleCardExpansion = (comparisonId, documentName = null) => {
    setExpandedCards(prev => {
      const key = documentName ? `${comparisonId}_${documentName}` : comparisonId;
      return {
        ...prev,
        [key]: !prev[key]
      };
    });
  };

  const renderComparisonCard = (comparison) => {
    const stats = getComparisonStats(comparison);
    const contractorName = getContractorName(comparison);
    const documentFields = getDocumentFields();
    const isCardExpanded = expandedCards[comparison._id];

    return (
      <View key={comparison._id} style={styles.comparisonCard}>
        {/* Header de la comparación */}
        <TouchableOpacity 
          style={styles.cardHeader}
          onPress={() => toggleCardExpansion(comparison._id)}
          activeOpacity={0.7}
        >
          <View style={styles.contractorInfo}>
            <View style={[
              styles.avatarCircle, 
              { backgroundColor: stats.percentage >= 70 ? "#28a745" : stats.percentage >= 40 ? "#ffc107" : "#dc3545" }
            ]}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
            <View style={styles.contractorDetails}>
              <Text style={styles.contractorName}>{contractorName}</Text>
              <Text style={styles.comparisonId}>
                ID: {comparison._id.slice(-8).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.statsContainer}>
            <View style={[
              styles.percentageCircle,
              { backgroundColor: stats.percentage >= 70 ? "#28a745" : stats.percentage >= 40 ? "#ffc107" : "#dc3545" }
            ]}>
              <Text style={styles.percentageText}>{stats.percentage}%</Text>
            </View>
            <Text style={styles.statsText}>
              {stats.approved}/{stats.total} docs
            </Text>
            <Ionicons 
              name={isCardExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666" 
            />
          </View>
        </TouchableOpacity>

        {/* Quick Stats Bar */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStat}>
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
            <Text style={[styles.quickStatText, {color: "#28a745"}]}>
              {stats.approved} Aprobados
            </Text>
          </View>
          <View style={styles.quickStat}>
            <Ionicons name="close-circle" size={16} color="#dc3545" />
            <Text style={[styles.quickStatText, {color: "#dc3545"}]}>
              {stats.total - stats.approved} Rechazados
            </Text>
          </View>
          <View style={styles.quickStat}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.quickStatText}>
              {new Date(comparison.updatedAt).toLocaleDateString('es-ES')}
            </Text>
          </View>
        </View>

        {/* Barra de progreso visual */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${stats.percentage}%`,
                  backgroundColor: stats.percentage >= 70 ? "#28a745" : stats.percentage >= 40 ? "#ffc107" : "#dc3545"
                }
              ]}
            />
          </View>
        </View>

        {/* Lista de documentos expandible */}
        {isCardExpanded && (
          <View style={styles.documentsContainer}>
            <View style={styles.documentsHeader}>
              <Ionicons name="documents" size={18} color="#0066CC" />
              <Text style={styles.documentsTitle}>Análisis Detallado de Documentos</Text>
            </View>
            
            {documentFields.map(field => {
              if (!comparison[field.name]) return null;
              const isDocExpanded = expandedCards[`${comparison._id}_${field.name}`];
              return renderDocumentStatus(comparison[field.name], field, comparison._id, isDocExpanded);
            })}
          </View>
        )}
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

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar contratista..."
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
              Todos ({comparisons.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'approved' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('approved')}
          >
            <Ionicons name="checkmark-circle" size={16} color={filterStatus === 'approved' ? "#fff" : "#28a745"} />
            <Text style={[styles.filterButtonText, filterStatus === 'approved' && styles.filterButtonTextActive]}>
              Completos ({comparisons.filter(c => getComparisonStats(c).percentage === 100).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'rejected' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('rejected')}
          >
            <Ionicons name="alert-circle" size={16} color={filterStatus === 'rejected' ? "#fff" : "#dc3545"} />
            <Text style={[styles.filterButtonText, filterStatus === 'rejected' && styles.filterButtonTextActive]}>
              Pendientes ({comparisons.filter(c => getComparisonStats(c).percentage < 100).length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="analytics" size={20} color="#0066CC" />
            <Text style={styles.summaryTitle}>Estadísticas Generales</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNumber}>{filteredComparisons.length}</Text>
              <Text style={styles.summaryStatLabel}>Análisis</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatNumber, {color: "#28a745"}]}>
                {filteredComparisons.filter(c => getComparisonStats(c).percentage === 100).length}
              </Text>
              <Text style={styles.summaryStatLabel}>Completos</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatNumber, {color: "#0066CC"}]}>
                {filteredComparisons.length > 0 
                  ? Math.round(filteredComparisons.reduce((sum, c) => sum + getComparisonStats(c).percentage, 0) / filteredComparisons.length)
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
          {filteredComparisons.length > 0 ? (
            <>
              {filteredComparisons.map(renderComparisonCard)}
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
                  <Ionicons name="analytics-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>No hay análisis disponibles</Text>
                  <Text style={styles.emptySubtext}>
                    Aún no se han realizado análisis de documentos
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
  comparisonsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  comparisonCard: {
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
    backgroundColor: '#fff',
  },
  contractorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
  },
  percentageCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  percentageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsText: {
    fontSize: 10,
    color: '#666',
    marginRight: 8,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickStatText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666',
  },
  documentsContainer: {
    backgroundColor: '#fff',
    paddingTop: 16,
  },
  documentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  documentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  documentItem: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e9ecef',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  documentTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  documentDescriptionContainer: {
    marginTop: 8,
  },
  documentDescription: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    textAlign: 'justify',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 4,
  },
  expandButtonText: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '600',
    marginRight: 4,
  },
  documentMeta: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  documentUser: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  endSpacer: {
    height: 20,
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
});

export default ComparisonsScreen;