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
import { getAllContractorsForDocuments } from '../services/authService';

const DocumentContractorsScreen = ({ navigation }) => {
  const [contractors, setContractors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredContractors, setFilteredContractors] = useState([]);

  useEffect(() => {
    loadContractors();
  }, []);

  useEffect(() => {
    filterContractors();
  }, [searchText, contractors]);

  const loadContractors = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando contratistas para gestión documental...');
      
      const result = await getAllContractorsForDocuments();
      
      if (result.success) {
        // La API devuelve un array directo en result.data
        const allContractors = result.data || [];
        console.log('✅ Contratistas cargados:', allContractors.length);
        console.log('📋 Estructura de datos recibida:', allContractors[0]);
        setContractors(allContractors);
        setFilteredContractors(allContractors);
      } else {
        Alert.alert('Error', result.message || 'Error al cargar contratistas');
        setContractors([]);
        setFilteredContractors([]);
      }
    } catch (error) {
      console.error('Error loading contractors:', error);
      Alert.alert('Error', 'Error de conexión al cargar contratistas');
      setContractors([]);
      setFilteredContractors([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterContractors = () => {
    if (!searchText.trim()) {
      setFilteredContractors(contractors);
      return;
    }

    const filtered = contractors.filter(contractor => {
      // Los datos del usuario están en contractor.user
      const user = contractor.user || {};
      const fullName = `${user.firsName || ''} ${user.lastName || ''}`.toLowerCase();
      const idCard = user.idcard?.toString().toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const contractNumber = contractor.contract?.contractNumber?.toLowerCase() || '';
      const search = searchText.toLowerCase();

      return fullName.includes(search) || 
             idCard.includes(search) || 
             email.includes(search) ||
             contractNumber.includes(search);
    });

    setFilteredContractors(filtered);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadContractors();
  };

  const navigateToDocuments = (contractor) => {
    console.log('📂 Navegando a documentos del contratista:', contractor._id);
    navigation.navigate('ContractorDocuments', { contractor });
  };

  const getStatusColor = (state) => {
    return state ? '#28a745' : '#6c757d';
  };

  const getStatusText = (state) => {
    return state ? 'Activo' : 'Inactivo';
  };

  const renderContractorCard = (contractor, index) => {
    // Los datos están en contractor.user
    const user = contractor.user || {};
    const contract = contractor.contract || {};
    
    const fullName = `${user.firsName || ''} ${user.lastName || ''}`;
    const hasContract = contract.contractNumber;

    return (
      <TouchableOpacity
        key={contractor._id || index}
        style={[
          styles.contractorCard,
          !user.state && styles.inactiveCard
        ]}
        onPress={() => navigateToDocuments(contractor)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.nameContainer}>
            <Text style={styles.contractorName}>{fullName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.state) }]}>
              <Text style={styles.statusText}>{getStatusText(user.state)}</Text>
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

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              {user.telephone || 'Sin teléfono'}
            </Text>
          </View>

          {hasContract && (
            <View style={styles.contractInfo}>
              <Ionicons name="document-text-outline" size={16} color="#0066CC" />
              <Text style={styles.contractText} numberOfLines={1}>
                Contrato: {contract.contractNumber}
              </Text>
            </View>
          )}

          {user.post && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={16} color="#666" />
              <Text style={styles.infoText} numberOfLines={1}>
                {user.post}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.documentHint}>
            <Ionicons name="folder-outline" size={16} color="#0066CC" />
            <Text style={styles.documentHintText}>Gestionar documentos</Text>
          </View>
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
        <Text style={styles.title}>Gestión Documental</Text>
        <TouchableOpacity
          style={styles.allManagementsButton}
          onPress={() => navigation.navigate('AllDocumentManagements')}
        >
          <Ionicons name="list-outline" size={24} color="#0066CC" />
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, cédula o email..."
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
          <Text style={styles.loadingText}>Cargando contratistas...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contractorsList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              {filteredContractors.length} contratista{filteredContractors.length !== 1 ? 's' : ''} 
              {searchText ? ' encontrado(s)' : ' en total'}
            </Text>
          </View>

          {filteredContractors.length > 0 ? (
            filteredContractors.map(renderContractorCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchText ? 'No se encontraron contratistas' : 'No hay contratistas disponibles'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchText ? 'Intenta con otros términos de búsqueda' : 'Los contratistas aparecerán aquí'}
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
    flex: 1,
  },
  allManagementsButton: {
    padding: 8,
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
  contractorsList: {
    flex: 1,
  },
  contractorCard: {
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
  inactiveCard: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: '#6c757d',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameContainer: {
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
    marginBottom: 12,
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
    marginTop: 4,
  },
  contractText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  documentHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentHintText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0066CC',
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
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DocumentContractorsScreen;