import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getAllContracts, 
  getContractsWithoutContractor, 
  getContractsWithContractor,
  getCurrentUser
} from '../services/authService';

const ContractsScreen = ({ navigation }) => {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'available', 'assigned'
  const [userRole, setUserRole] = useState(null);

  const filterOptions = [
    { key: 'all', label: 'Todos los Contratos', icon: 'document-text' },
    { key: 'available', label: 'Disponibles', icon: 'checkmark-circle-outline' },
    { key: 'assigned', label: 'Asignados', icon: 'person' },
  ];

  useEffect(() => {
    loadUserRole();
    loadContracts();
  }, [filterType]);

  const loadUserRole = async () => {
    try {
      const result = await getCurrentUser();
      if (result.success) {
        setUserRole(result.user.role);
        console.log('👤 User role loaded:', result.user.role);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const loadContracts = async () => {
    try {
      setIsLoading(true);
      let result;

      switch (filterType) {
        case 'available':
          result = await getContractsWithoutContractor();
          break;
        case 'assigned':
          result = await getContractsWithContractor();
          break;
        default:
          result = await getAllContracts();
      }

      if (result.success) {
        setContracts(result.data);
      } else {
        Alert.alert('Error', result.message);
        setContracts([]);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
      Alert.alert('Error', 'Error inesperado al cargar contratos');
      setContracts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadContracts();
  };

  const openContractDetail = (contract) => {
    setSelectedContract(contract);
    setModalVisible(true);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return `$${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (state) => {
    return state ? '#28a745' : '#6c757d';
  };

  const getStatusText = (state) => {
    return state ? 'Activo' : 'Inactivo';
  };

  const renderContractCard = (contract, index) => {
    // Para contratos asignados, el contrato está dentro de la propiedad 'contract'
    const contractData = contract.contract || contract;
    const isAssigned = !!contract.contract;

    return (
      <TouchableOpacity
        key={contract._id || index}
        style={styles.contractCard}
        onPress={() => openContractDetail(contract)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.contractNumber}>{contractData.contractNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contractData.state) }]}>
            <Text style={styles.statusText}>{getStatusText(contractData.state)}</Text>
          </View>
        </View>

        <Text style={styles.contractType}>{contractData.typeofcontract}</Text>
        
        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.dateText}>
              {formatDate(contractData.startDate)} - {formatDate(contractData.endDate)}
            </Text>
          </View>
        </View>

        <View style={styles.valueContainer}>
          <View style={styles.valueItem}>
            <Text style={styles.valueLabel}>Valor Período:</Text>
            <Text style={styles.valueAmount}>{formatCurrency(contractData.periodValue)}</Text>
          </View>
          <View style={styles.valueItem}>
            <Text style={styles.valueLabel}>Valor Total:</Text>
            <Text style={styles.valueTotalAmount}>{formatCurrency(contractData.totalValue)}</Text>
          </View>
        </View>

        {isAssigned && (
          <View style={styles.assignedIndicator}>
            <Ionicons name="person" size={16} color="#0066CC" />
            <Text style={styles.assignedText}>Contratista Asignado</Text>
          </View>
        )}

        <View style={styles.featuresContainer}>
          {contractData.extension && (
            <View style={[styles.featureBadge, { backgroundColor: '#e3f2fd' }]}>
              <Text style={[styles.featureText, { color: '#1976d2' }]}>Extensión</Text>
            </View>
          )}
          {contractData.addiction && (
            <View style={[styles.featureBadge, { backgroundColor: '#fff3e0' }]}>
              <Text style={[styles.featureText, { color: '#f57c00' }]}>Adición</Text>
            </View>
          )}
          {contractData.suspension && (
            <View style={[styles.featureBadge, { backgroundColor: '#ffebee' }]}>
              <Text style={[styles.featureText, { color: '#d32f2f' }]}>Suspensión</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContractModal = () => {
    if (!selectedContract) return null;

    const contractData = selectedContract.contract || selectedContract;
    const isAssigned = !!selectedContract.contract;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles del Contrato</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Información General</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Número de Contrato:</Text>
                <Text style={styles.detailValue}>{contractData.contractNumber}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tipo:</Text>
                <Text style={styles.detailValue}>{contractData.typeofcontract}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estado:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contractData.state) }]}>
                  <Text style={styles.statusText}>{getStatusText(contractData.state)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Fechas</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Inicio:</Text>
                <Text style={styles.detailValue}>{formatDate(contractData.startDate)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fin:</Text>
                <Text style={styles.detailValue}>{formatDate(contractData.endDate)}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Valores</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Valor Período:</Text>
                <Text style={styles.detailValueMoney}>{formatCurrency(contractData.periodValue)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Valor Total:</Text>
                <Text style={styles.detailValueMoney}>{formatCurrency(contractData.totalValue)}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Objetivo</Text>
              <Text style={styles.objectiveText}>{contractData.objectiveContract}</Text>
            </View>

            {isAssigned && selectedContract.user && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Información del Contratista</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dirección:</Text>
                  <Text style={styles.detailValue}>{selectedContract.residentialAddress}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email Institucional:</Text>
                  <Text style={styles.detailValue}>{selectedContract.institutionalEmail}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Actividad Económica:</Text>
                  <Text style={styles.detailValue}>{selectedContract.EconomicaActivityNumber}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Características Especiales</Text>
              
              <View style={styles.featuresGrid}>
                <View style={styles.featureItem}>
                  <Ionicons 
                    name={contractData.extension ? 'checkmark-circle' : 'close-circle'} 
                    size={20} 
                    color={contractData.extension ? '#28a745' : '#6c757d'} 
                  />
                  <Text style={styles.featureItemText}>Extensión</Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons 
                    name={contractData.addiction ? 'checkmark-circle' : 'close-circle'} 
                    size={20} 
                    color={contractData.addiction ? '#28a745' : '#6c757d'} 
                  />
                  <Text style={styles.featureItemText}>Adición</Text>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons 
                    name={contractData.suspension ? 'checkmark-circle' : 'close-circle'} 
                    size={20} 
                    color={contractData.suspension ? '#28a745' : '#6c757d'} 
                  />
                  <Text style={styles.featureItemText}>Suspensión</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Botones de Acción */}
          {userRole === 'contratista' && (
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('EditContract', { contract: selectedContract });
                }}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Editar Contrato</Text>
              </TouchableOpacity>
            </View>
          )}
          {userRole === 'funcionario' && (
            <View style={styles.modalActions}>
              <View style={styles.infoMessage}>
                <Ionicons name="information-circle" size={20} color="#0066CC" />
                <Text style={styles.infoMessageText}>Solo tienes permisos de consulta</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0066CC" />
        </TouchableOpacity>
        <Text style={styles.title}>Contratos</Text>
        {userRole === 'contratista' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateContract')}
          >
            <Ionicons name="add" size={24} color="#0066CC" />
          </TouchableOpacity>
        )}
        {userRole === 'funcionario' && <View style={styles.addButton} />}
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterButton,
                filterType === option.key && styles.activeFilterButton,
              ]}
              onPress={() => setFilterType(option.key)}
            >
              <Ionicons
                name={option.icon}
                size={16}
                color={filterType === option.key ? '#fff' : '#0066CC'}
              />
              <Text
                style={[
                  styles.filterText,
                  filterType === option.key && styles.activeFilterText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Cargando contratos...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contractsList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          {contracts.length > 0 ? (
            contracts.map(renderContractCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No hay contratos disponibles</Text>
              <Text style={styles.emptySubtext}>
                {filterType === 'available' 
                  ? 'No hay contratos sin asignar' 
                  : filterType === 'assigned'
                  ? 'No hay contratos asignados'
                  : 'No se encontraron contratos'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {renderContractModal()}
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
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0066CC',
    backgroundColor: '#fff',
  },
  activeFilterButton: {
    backgroundColor: '#0066CC',
  },
  filterText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  contractsList: {
    flex: 1,
    padding: 20,
  },
  contractCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contractNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  contractType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateContainer: {
    marginBottom: 8,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  valueItem: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 12,
    color: '#999',
  },
  valueAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  valueTotalAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
  },
  assignedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  assignedText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  detailValueMoney: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  objectiveText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'justify',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingVertical: 8,
  },
  featureItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
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
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
  },
  infoMessageText: {
    color: '#0066CC',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ContractsScreen;