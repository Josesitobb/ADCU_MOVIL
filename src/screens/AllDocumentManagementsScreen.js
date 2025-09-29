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
import { getAllDocumentManagements, getAllContractorsForDocuments } from '../services/authService';

const AllDocumentManagementsScreen = ({ navigation }) => {
  const [documentManagements, setDocumentManagements] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredManagements, setFilteredManagements] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterManagements();
  }, [searchText, documentManagements, contractors]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando todas las gestiones documentales...');
      
      // Cargar gestiones documentales y contratistas en paralelo
      const [documentsResult, contractorsResult] = await Promise.all([
        getAllDocumentManagements(),
        getAllContractorsForDocuments()
      ]);

      if (documentsResult.success) {
        console.log('✅ Gestiones documentales cargadas:', documentsResult.data.length);
        setDocumentManagements(documentsResult.data);
      } else {
        console.log('⚠️ Error cargando gestiones:', documentsResult.message);
        Alert.alert('Error', documentsResult.message || 'Error al cargar gestiones documentales');
        setDocumentManagements([]);
      }

      if (contractorsResult.success) {
        console.log('✅ Contratistas cargados:', contractorsResult.data.length);
        setContractors(contractorsResult.data);
      } else {
        console.log('⚠️ Error cargando contratistas:', contractorsResult.message);
        setContractors([]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Error de conexión al cargar datos');
      setDocumentManagements([]);
      setContractors([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterManagements = () => {
    if (!searchText.trim()) {
      setFilteredManagements(documentManagements);
      return;
    }

    const filtered = documentManagements.filter(management => {
      // Buscar el contratista correspondiente
      const contractor = contractors.find(c => c._id === management.contractorId);
      const user = contractor?.user || {};
      
      const fullName = `${user.firsName || ''} ${user.lastName || ''}`.toLowerCase();
      const idCard = user.idcard?.toString().toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const contractNumber = contractor?.contract?.contractNumber?.toLowerCase() || '';
      const search = searchText.toLowerCase();

      return fullName.includes(search) || 
             idCard.includes(search) || 
             email.includes(search) ||
             contractNumber.includes(search);
    });

    setFilteredManagements(filtered);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const navigateToContractorDocuments = (management) => {
    // Buscar el contratista correspondiente
    const contractor = contractors.find(c => c._id === management.contractorId);
    
    if (contractor) {
      console.log('📂 Navegando a documentos del contratista desde gestiones:', contractor._id);
      navigation.navigate('ContractorDocuments', { contractor });
    } else {
      Alert.alert('Error', 'No se encontró información del contratista');
    }
  };

  const getContractorInfo = (contractorId) => {
    const contractor = contractors.find(c => c._id === contractorId);
    return contractor || null;
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': '#28a745',
      'pending': '#ffc107',
      'completed': '#0066CC',
      'inactive': '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusText = (status) => {
    const labels = {
      'active': 'Activo',
      'pending': 'Pendiente',
      'completed': 'Completado',
      'inactive': 'Inactivo'
    };
    return labels[status] || 'Desconocido';
  };

  const renderManagementCard = (management, index) => {
    const contractor = getContractorInfo(management.contractorId);
    const user = contractor?.user || {};
    const contract = contractor?.contract || {};
    
    const fullName = `${user.firsName || ''} ${user.lastName || ''}`;
    const documentsCount = management.documents ? Object.keys(management.documents).length : 0;

    return (
      <TouchableOpacity
        key={management._id || index}
        style={styles.managementCard}
        onPress={() => navigateToContractorDocuments(management)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.contractorInfo}>
            <Text style={styles.contractorName}>{fullName || 'Nombre no disponible'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(management.status) }]}>
              <Text style={styles.statusText}>{getStatusText(management.status)}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#0066CC" />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={16} color="#666" />
            <Text style={styles.infoText}>Cédula: {user.idcard || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color="#666" />
            <Text style={styles.infoText} numberOfLines={1}>
              {user.email || 'Sin email'}
            </Text>
          </View>

          {contract.contractNumber && (
            <View style={styles.contractInfo}>
              <Ionicons name="document-text-outline" size={16} color="#0066CC" />
              <Text style={styles.contractText} numberOfLines={1}>
                Contrato: {contract.contractNumber}
              </Text>
            </View>
          )}

          <View style={styles.documentsInfo}>
            <Ionicons name="folder-outline" size={16} color="#28a745" />
            <Text style={styles.documentsText}>
              {documentsCount} documento{documentsCount !== 1 ? 's' : ''} registrado{documentsCount !== 1 ? 's' : ''}
            </Text>
          </View>

          {management.lastUpdate && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                Última actualización: {new Date(management.lastUpdate).toLocaleDateString('es-ES')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
        <Text style={styles.title}>Todas las Gestiones</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, cédula, email o contrato..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Cargando gestiones documentales...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.managementsList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              {filteredManagements.length} gestión{filteredManagements.length !== 1 ? 'es' : ''} 
              {searchText ? ' encontrada(s)' : ' documental(es) en total'}
            </Text>
          </View>

          {filteredManagements.length > 0 ? (
            filteredManagements.map(renderManagementCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchText ? 'No se encontraron gestiones' : 'No hay gestiones documentales'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchText ? 'Intenta con otros términos de búsqueda' : 'Las gestiones documentales aparecerán aquí'}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  summaryContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  managementsList: {
    flex: 1,
  },
  managementCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 12,
  },
  contractorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contractorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
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
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  contractInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  contractText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    flex: 1,
  },
  documentsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  documentsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
    flex: 1,
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

export default AllDocumentManagementsScreen;