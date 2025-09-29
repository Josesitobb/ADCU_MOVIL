import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getContracts, getContractsWithoutContractor, createContractor } from '../services/authService';

const CreateContractorScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [contractModalVisible, setContractModalVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    firsName: '',
    lastname: '',
    idcard: '',
    telephone: '',
    email: '',
    password: '',
    state: true,
    post: '',
    role: 'contratista',
    contractId: '',
    residentialAddress: '',
    institutionalEmail: '',
    EconomicaActivityNumber: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setContractsLoading(true);
      console.log('🔄 Cargando contratos disponibles (sin contratista asignado)...');
      const result = await getContractsWithoutContractor();
      
      console.log('📋 Respuesta getContractsWithoutContractor:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ Contratos disponibles cargados exitosamente:', result.data.length, 'contratos disponibles');
        setContracts(result.data);
      } else {
        console.log('❌ Error al cargar contratos disponibles:', result.message);
        Alert.alert('Error', result.message || 'Error al cargar contratos disponibles');
      }
    } catch (error) {
      console.error('💥 Error loading contracts:', error);
      Alert.alert('Error', 'Error de conexión al cargar contratos');
    } finally {
      setContractsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones requeridas
    if (!formData.firsName.trim()) newErrors.firsName = 'El nombre es requerido';
    if (!formData.lastname.trim()) newErrors.lastname = 'El apellido es requerido';
    if (!formData.idcard.trim()) newErrors.idcard = 'La cédula es requerida';
    if (!formData.telephone.trim()) newErrors.telephone = 'El teléfono es requerido';
    if (!formData.email.trim()) newErrors.email = 'El email es requerido';
    if (!formData.password.trim()) newErrors.password = 'La contraseña es requerida';
    if (!formData.post.trim()) newErrors.post = 'El cargo es requerido';
    if (!formData.contractId) newErrors.contractId = 'Debe seleccionar un contrato';

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email.trim() && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validación de email institucional (opcional pero si se llena debe ser válido)
    if (formData.institutionalEmail.trim() && !emailRegex.test(formData.institutionalEmail)) {
      newErrors.institutionalEmail = 'Email institucional inválido';
    }

    // Validación de cédula (solo números)
    if (formData.idcard.trim() && !/^\d+$/.test(formData.idcard)) {
      newErrors.idcard = 'La cédula debe contener solo números';
    }

    // Validación de teléfono (solo números)
    if (formData.telephone.trim() && !/^\d+$/.test(formData.telephone)) {
      newErrors.telephone = 'El teléfono debe contener solo números';
    }

    // Validación de contraseña (mínimo 8 caracteres)
    if (formData.password.trim() && formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    // Validación de número de actividad económica (solo números si se llena)
    if (formData.EconomicaActivityNumber.trim() && !/^\d+$/.test(formData.EconomicaActivityNumber)) {
      newErrors.EconomicaActivityNumber = 'Debe contener solo números';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor, corrige los errores en el formulario');
      return;
    }

    setLoading(true);

    try {
      // Preparar los datos para enviar
      const dataToSend = {
        ...formData,
        // Convertir strings a números donde sea necesario
        idcard: formData.idcard,
        telephone: formData.telephone,
        EconomicaActivityNumber: formData.EconomicaActivityNumber ? parseInt(formData.EconomicaActivityNumber) : undefined,
      };

      // Remover campos vacíos opcionales
      if (!dataToSend.institutionalEmail.trim()) delete dataToSend.institutionalEmail;
      if (!dataToSend.residentialAddress.trim()) delete dataToSend.residentialAddress;
      if (!dataToSend.EconomicaActivityNumber) delete dataToSend.EconomicaActivityNumber;

      console.log('📤 Datos a enviar para crear contratista:', JSON.stringify(dataToSend, null, 2));
      
      const result = await createContractor(dataToSend);
      
      console.log('📥 Respuesta createContractor:', JSON.stringify(result, null, 2));

      if (result.success) {
        console.log('✅ Contratista creado exitosamente');
        Alert.alert(
          'Éxito',
          'Contratista creado exitosamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        console.log('❌ Error al crear contratista:', result.message);
        Alert.alert('Error', result.message || 'Error al crear contratista');
      }
    } catch (error) {
      console.error('💥 Error creating contractor:', error);
      Alert.alert('Error', 'Error de conexión al crear contratista');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const selectContract = (contract) => {
    setSelectedContract(contract);
    setFormData(prev => ({
      ...prev,
      contractId: contract._id,
    }));
    setContractModalVisible(false);

    // Limpiar error de contrato
    if (errors.contractId) {
      setErrors(prev => ({
        ...prev,
        contractId: undefined,
      }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderContractModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={contractModalVisible}
      onRequestClose={() => setContractModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Contrato</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setContractModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {contractsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Cargando contratos...</Text>
              </View>
            ) : contracts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay contratos disponibles</Text>
                <Text style={styles.emptySubtext}>Todos los contratos ya tienen contratistas asignados</Text>
              </View>
            ) : (
              contracts.map((contract) => (
                <TouchableOpacity
                  key={contract._id}
                  style={styles.contractCard}
                  onPress={() => selectContract(contract)}
                >
                  <View style={styles.contractHeader}>
                    <Text style={styles.contractNumber}>{contract.contractNumber}</Text>
                    <View style={[
                      styles.contractStatus,
                      { backgroundColor: contract.state ? '#2ecc71' : '#e74c3c' }
                    ]}>
                      <Text style={styles.contractStatusText}>
                        {contract.state ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.contractType}>{contract.typeofcontract}</Text>
                  <Text style={styles.contractValue}>{formatCurrency(contract.totalValue)}</Text>
                  <Text style={styles.contractObjective} numberOfLines={2}>
                    {contract.objectiveContract}
                  </Text>
                  
                  <View style={styles.contractDates}>
                    <Text style={styles.contractDate}>
                      Inicio: {new Date(contract.startDate).toLocaleDateString()}
                    </Text>
                    <Text style={styles.contractDate}>
                      Fin: {new Date(contract.endDate).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

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
        <Text style={styles.title}>Crear Contratista</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información Personal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Información Personal</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre *</Text>
            <TextInput
              style={[styles.input, errors.firsName && styles.inputError]}
              value={formData.firsName}
              onChangeText={(value) => handleInputChange('firsName', value)}
              placeholder="Ingrese el nombre"
            />
            {errors.firsName && <Text style={styles.errorText}>{errors.firsName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Apellido *</Text>
            <TextInput
              style={[styles.input, errors.lastname && styles.inputError]}
              value={formData.lastname}
              onChangeText={(value) => handleInputChange('lastname', value)}
              placeholder="Ingrese el apellido"
            />
            {errors.lastname && <Text style={styles.errorText}>{errors.lastname}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Cédula *</Text>
            <TextInput
              style={[styles.input, errors.idcard && styles.inputError]}
              value={formData.idcard}
              onChangeText={(value) => handleInputChange('idcard', value)}
              placeholder="Ingrese la cédula"
              keyboardType="numeric"
            />
            {errors.idcard && <Text style={styles.errorText}>{errors.idcard}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Teléfono *</Text>
            <TextInput
              style={[styles.input, errors.telephone && styles.inputError]}
              value={formData.telephone}
              onChangeText={(value) => handleInputChange('telephone', value)}
              placeholder="Ingrese el teléfono"
              keyboardType="phone-pad"
            />
            {errors.telephone && <Text style={styles.errorText}>{errors.telephone}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Dirección Residencial</Text>
            <TextInput
              style={styles.input}
              value={formData.residentialAddress}
              onChangeText={(value) => handleInputChange('residentialAddress', value)}
              placeholder="Ingrese la dirección"
              multiline
            />
          </View>
        </View>

        {/* Información de Contacto */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail-outline" size={20} color="#2ecc71" />
            <Text style={styles.sectionTitle}>Información de Contacto</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Personal *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Institucional</Text>
            <TextInput
              style={[styles.input, errors.institutionalEmail && styles.inputError]}
              value={formData.institutionalEmail}
              onChangeText={(value) => handleInputChange('institutionalEmail', value)}
              placeholder="correo@gobiernobogota.gov.co"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.institutionalEmail && <Text style={styles.errorText}>{errors.institutionalEmail}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña *</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>
        </View>

        {/* Información Laboral */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase-outline" size={20} color="#9b59b6" />
            <Text style={styles.sectionTitle}>Información Laboral</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Cargo/Posición *</Text>
            <TextInput
              style={[styles.input, errors.post && styles.inputError]}
              value={formData.post}
              onChangeText={(value) => handleInputChange('post', value)}
              placeholder="Describe el cargo o posición"
              multiline
            />
            {errors.post && <Text style={styles.errorText}>{errors.post}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Número de Actividad Económica</Text>
            <TextInput
              style={[styles.input, errors.EconomicaActivityNumber && styles.inputError]}
              value={formData.EconomicaActivityNumber}
              onChangeText={(value) => handleInputChange('EconomicaActivityNumber', value)}
              placeholder="Ej: 7490"
              keyboardType="numeric"
            />
            {errors.EconomicaActivityNumber && <Text style={styles.errorText}>{errors.EconomicaActivityNumber}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contrato *</Text>
            <TouchableOpacity
              style={[styles.contractSelector, errors.contractId && styles.inputError]}
              onPress={() => setContractModalVisible(true)}
            >
              <Text style={[styles.contractSelectorText, !selectedContract && styles.placeholderText]}>
                {selectedContract ? selectedContract.contractNumber : 'Seleccionar contrato'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#7f8c8d" />
            </TouchableOpacity>
            {errors.contractId && <Text style={styles.errorText}>{errors.contractId}</Text>}
            
            {selectedContract && (
              <View style={styles.selectedContractInfo}>
                <Text style={styles.selectedContractText}>
                  {selectedContract.typeofcontract} - {formatCurrency(selectedContract.totalValue)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.switchContainer}>
              <Text style={styles.inputLabel}>Estado Activo</Text>
              <Switch
                value={formData.state}
                onValueChange={(value) => handleInputChange('state', value)}
                trackColor={{ false: '#e74c3c', true: '#2ecc71' }}
                thumbColor={formData.state ? '#ffffff' : '#ffffff'}
              />
            </View>
          </View>
        </View>

        {/* Botón de Crear */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="person-add" size={20} color="#ffffff" />
              <Text style={styles.createButtonText}>Crear Contratista</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderContractModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  headerSpace: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 10,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
  },
  contractSelector: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractSelectorText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  placeholderText: {
    color: '#7f8c8d',
  },
  selectedContractInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 6,
  },
  selectedContractText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    maxHeight: '80%',
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 8,
    textAlign: 'center',
  },
  contractCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contractNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  contractStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  contractStatusText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  contractType: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  contractValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ecc71',
    marginBottom: 8,
  },
  contractObjective: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  contractDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contractDate: {
    fontSize: 10,
    color: '#95a5a6',
  },
});

export default CreateContractorScreen;