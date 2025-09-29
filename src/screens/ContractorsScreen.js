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
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getContractors, getAllContractors } from '../services/authService';

const ContractorsScreen = ({ navigation }) => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterState, setFilterState] = useState('all'); // 'all', 'active', 'inactive'
  const [searchText, setSearchText] = useState('');
  const [filteredContractors, setFilteredContractors] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 });

  useEffect(() => {
    loadContractors();
  }, []);

  useEffect(() => {
    filterContractors();
  }, [contractors, filterState, searchText]);

  const loadContractors = async () => {
    try {
      setLoading(true);
      const result = await getAllContractors();
      
      if (result.success) {
        const allContractors = [
          ...result.data.active.map(c => ({ ...c, status: 'active' })),
          ...result.data.inactive.map(c => ({ ...c, status: 'inactive' }))
        ];
        
        setContractors(allContractors);
        setStats({
          active: result.data.active.length,
          inactive: result.data.inactive.length,
          total: result.data.total
        });
      } else {
        Alert.alert('Error', result.message || 'Error al cargar contratistas');
      }
    } catch (error) {
      console.error('Error loading contractors:', error);
      Alert.alert('Error', 'Error de conexión al cargar contratistas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContractors();
    setRefreshing(false);
  };

  const filterContractors = () => {
    let filtered = contractors;

    // Filtrar por estado
    if (filterState === 'active') {
      filtered = filtered.filter(c => c.user.state === true);
    } else if (filterState === 'inactive') {
      filtered = filtered.filter(c => c.user.state === false);
    }

    // Filtrar por texto de búsqueda
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(contractor => {
        const user = contractor.user;
        return (
          user.firsName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.idcard?.toString().includes(searchText) ||
          contractor.contract?.contractNumber?.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredContractors(filtered);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (contractor) => {
    return contractor.user.state ? '#2ecc71' : '#e74c3c';
  };

  const openContractorDetail = (contractor) => {
    setSelectedContractor(contractor);
    setModalVisible(true);
  };

  const renderContractorCard = (contractor, index) => {
    const user = contractor.user;
    const contract = contractor.contract;
    const isActive = user.state;

    return (
      <TouchableOpacity
        key={contractor._id || index}
        style={styles.contractorCard}
        onPress={() => openContractorDetail(contractor)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.contractorInfo}>
            <Text style={styles.contractorName}>
              {user.firsName} {user.lastName}
            </Text>
            <Text style={styles.contractorEmail}>{user.email}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(contractor) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(contractor) }]}>
              {isActive ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>C.C: {user.idcard}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>{user.telephone}</Text>
          </View>

          {contract && (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={16} color="#7f8c8d" />
                <Text style={styles.infoText} numberOfLines={1}>
                  {contract.contractNumber}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={16} color="#7f8c8d" />
                <Text style={styles.infoText}>
                  {formatCurrency(contract.totalValue)}
                </Text>
              </View>
            </>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.postText} numberOfLines={2}>
              {user.post}
            </Text>
          </View>
        </View>

        <View style={styles.cardArrow}>
          <Ionicons name="chevron-forward" size={16} color="#bdc3c7" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedContractor) return null;

    const user = selectedContractor.user;
    const contract = selectedContractor.contract;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle del Contratista</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Información Personal */}
              <View style={styles.modalCard}>
                <View style={styles.modalCardHeader}>
                  <Ionicons name="person-outline" size={20} color="#3498db" />
                  <Text style={styles.modalCardTitle}>Información Personal</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nombre:</Text>
                  <Text style={styles.detailValue}>{user.firsName} {user.lastName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cédula:</Text>
                  <Text style={styles.detailValue}>{user.idcard}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Teléfono:</Text>
                  <Text style={styles.detailValue}>{user.telephone}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email Personal:</Text>
                  <Text style={styles.detailValue}>{user.email}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email Institucional:</Text>
                  <Text style={styles.detailValue}>{selectedContractor.institutionalEmail}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dirección:</Text>
                  <Text style={styles.detailValue}>{selectedContractor.residentialAddress}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cargo:</Text>
                  <Text style={styles.detailValue}>{user.post}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Estado:</Text>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedContractor) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(selectedContractor) }]}>
                      {selectedContractor.user.state ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Información del Contrato */}
              {contract && (
                <View style={styles.modalCard}>
                  <View style={styles.modalCardHeader}>
                    <Ionicons name="document-text-outline" size={20} color="#2ecc71" />
                    <Text style={styles.modalCardTitle}>Información del Contrato</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Número:</Text>
                    <Text style={styles.detailValue}>{contract.contractNumber}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tipo:</Text>
                    <Text style={styles.detailValue}>{contract.typeofcontract}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Inicio:</Text>
                    <Text style={styles.detailValue}>{formatDate(contract.startDate)}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fin:</Text>
                    <Text style={styles.detailValue}>{formatDate(contract.endDate)}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Valor Total:</Text>
                    <Text style={[styles.detailValue, styles.valueText]}>
                      {formatCurrency(contract.totalValue)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Valor Período:</Text>
                    <Text style={[styles.detailValue, styles.valueText]}>
                      {formatCurrency(contract.periodValue)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Objetivo:</Text>
                    <Text style={styles.detailValue}>{contract.objectiveContract}</Text>
                  </View>

                  {/* Flags del contrato */}
                  <View style={styles.flagsContainer}>
                    <View style={styles.flagItem}>
                      <Ionicons 
                        name={contract.extension ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={contract.extension ? "#2ecc71" : "#e74c3c"} 
                      />
                      <Text style={styles.flagText}>Extensión</Text>
                    </View>
                    
                    <View style={styles.flagItem}>
                      <Ionicons 
                        name={contract.addiction ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={contract.addiction ? "#2ecc71" : "#e74c3c"} 
                      />
                      <Text style={styles.flagText}>Adición</Text>
                    </View>
                    
                    <View style={styles.flagItem}>
                      <Ionicons 
                        name={contract.suspension ? "pause-circle" : "play-circle"} 
                        size={16} 
                        color={contract.suspension ? "#f39c12" : "#2ecc71"} 
                      />
                      <Text style={styles.flagText}>Suspensión</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Botones de Acción */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('EditContractor', { contractor: selectedContractor });
                }}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Editar Contratista</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Cargando contratistas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>Contratistas</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#2ecc71' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#e74c3c' }]}>{stats.inactive}</Text>
          <Text style={styles.statLabel}>Inactivos</Text>
        </View>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, email o contrato..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterState === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterState('all')}
        >
          <Text style={[styles.filterButtonText, filterState === 'all' && styles.filterButtonTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filterState === 'active' && styles.filterButtonActive]}
          onPress={() => setFilterState('active')}
        >
          <Text style={[styles.filterButtonText, filterState === 'active' && styles.filterButtonTextActive]}>
            Activos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filterState === 'inactive' && styles.filterButtonActive]}
          onPress={() => setFilterState('inactive')}
        >
          <Text style={[styles.filterButtonText, filterState === 'inactive' && styles.filterButtonTextActive]}>
            Inactivos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Contratistas */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredContractors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyText}>
              {searchText ? 'No se encontraron contratistas' : 'No hay contratistas'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchText ? 'Intenta con otros términos de búsqueda' : 'Actualiza para cargar datos'}
            </Text>
          </View>
        ) : (
          filteredContractors.map((contractor, index) => renderContractorCard(contractor, index))
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderDetailModal()}

      {/* Botón flotante para agregar contratista */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('CreateContractor')}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  refreshButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#2c3e50',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contractorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
  },
  cardHeader: {
    flex: 1,
  },
  contractorInfo: {
    marginBottom: 8,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  contractorEmail: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    marginTop: 8,
  },
  postText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  cardArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff',
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right',
  },
  valueText: {
    fontWeight: '600',
    color: '#2ecc71',
  },
  flagsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffffff',
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
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  editButton: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ContractorsScreen;