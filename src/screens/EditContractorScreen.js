import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateContractor, getContractorById } from '../services/authService';

const EditContractorScreen = ({ route, navigation }) => {
  const { contractor } = route.params;

  const [formData, setFormData] = useState({
    firsName: '',
    lastname: '',
    idcard: '',
    telephone: '',
    email: '',
    password: '', // Vacío por defecto, solo si quiere cambiar
    state: false,
    post: '',
    residentialAddress: '',
    institutionalEmail: '',
    EconomicaActivityNumber: '',
  });

  const [originalData, setOriginalData] = useState({});
  const [contractorDetails, setContractorDetails] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Cargar datos completos del contratista al iniciar
  useEffect(() => {
    loadContractorData();
  }, []);

  const loadContractorData = async () => {
    try {
      setIsLoadingData(true);
      const userId = contractor.user?._id || contractor._id;
      console.log('🔍 Cargando datos del contratista User ID:', userId);
      
      const result = await getContractorById(userId);
      
      if (result.success && result.data) {
        const userData = result.data.user;
        const contractData = result.data.contract;
        
        // Mapear los datos de la API al formulario
        const mappedData = {
          firsName: userData.firsName || '',
          lastname: userData.lastName || userData.lastname || '',
          idcard: userData.idcard?.toString() || '',
          telephone: userData.telephone?.toString() || '',
          email: userData.email || '',
          password: '',
          state: userData.state || false,
          post: userData.post || '',
          residentialAddress: result.data.residentialAddress || '',
          institutionalEmail: result.data.institutionalEmail || '',
          EconomicaActivityNumber: result.data.EconomicaActivityNumber?.toString() || '',
        };
        
        setFormData(mappedData);
        setOriginalData(mappedData);
        setContractorDetails(result.data);
        
        console.log('✅ Datos del contratista cargados:', mappedData);
      } else {
        Alert.alert('Error', 'No se pudieron cargar los datos del contratista');
      }
    } catch (error) {
      console.error('Error loading contractor data:', error);
      Alert.alert('Error', 'Error al cargar los datos del contratista');
    } finally {
      setIsLoadingData(false);
    }
  };



  const validateForm = () => {
    const requiredFields = [
      { field: 'firsName', name: 'Nombre' },
      { field: 'lastname', name: 'Apellido' },
      { field: 'idcard', name: 'Cédula' },
      { field: 'telephone', name: 'Teléfono' },
      { field: 'email', name: 'Email personal' },
      { field: 'post', name: 'Cargo' },
      { field: 'residentialAddress', name: 'Dirección residencial' },
      { field: 'institutionalEmail', name: 'Email institucional' },
      { field: 'EconomicaActivityNumber', name: 'Número actividad económica' },
    ];

    for (let item of requiredFields) {
      if (!formData[item.field] || formData[item.field].toString().trim() === '') {
        Alert.alert('Error', `${item.name} es requerido`);
        return false;
      }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'El email personal no tiene un formato válido');
      return false;
    }

    if (!emailRegex.test(formData.institutionalEmail)) {
      Alert.alert('Error', 'El email institucional no tiene un formato válido');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      // Preparar solo los campos que han cambiado
      const updateData = {};
      
      // Comparar cada campo y solo incluir los que han cambiado
      Object.keys(formData).forEach(key => {
        if (key === 'password') {
          // Solo incluir password si el usuario escribió algo
          if (formData.password && formData.password.trim() !== '') {
            updateData.password = formData.password;
          }
        } else if (formData[key] !== originalData[key]) {
          updateData[key] = formData[key];
        }
      });
      
      // Si no hay cambios, no enviar nada
      if (Object.keys(updateData).length === 0) {
        Alert.alert('Información', 'No se detectaron cambios para guardar');
        return;
      }

      const userId = contractor.user?._id || contractor._id;
      console.log('🚀 Actualizando contratista User ID:', userId);
      console.log('🚀 Datos a actualizar:', updateData);

      console.log('🚀 Enviando actualización a la API...');
      console.log('🎯 User ID para actualizar:', userId);
      console.log('📦 Datos a enviar:', JSON.stringify(updateData, null, 2));
      
      const result = await updateContractor(userId, updateData);
      
      console.log('📨 Respuesta de updateContractor recibida:');
      console.log('✅ Success:', result.success);
      console.log('📄 Message:', result.message);
      console.log('📋 Data:', JSON.stringify(result.data, null, 2));

      if (result.success) {
        Alert.alert(
          'Éxito',
          'Contratista actualizado exitosamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        console.log('❌ Error en la actualización:', result.message);
        console.log('❌ Resultado completo del error:', JSON.stringify(result, null, 2));
        Alert.alert('Error', result.message || 'Error al actualizar contratista');
      }
    } catch (error) {
      console.error('Error updating contractor:', error);
      Alert.alert('Error', 'Error inesperado al actualizar contratista');
    } finally {
      setIsLoading(false);
    }
  };



  if (isLoadingData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Cargando datos del contratista...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#0066CC" />
          </TouchableOpacity>
          <Text style={styles.title}>Editar Contratista</Text>
        </View>

        {/* Información no editable */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información del Contrato</Text>
          
          {contractorDetails?.contract && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Número de Contrato:</Text>
              <Text style={styles.infoValue}>{contractorDetails.contract.contractNumber}</Text>
            </View>
          )}

          {contractorDetails?.user && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rol:</Text>
              <Text style={styles.infoValue}>{contractorDetails.user.role}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID del Usuario:</Text>
            <Text style={styles.infoValue}>{contractor.user?._id || contractor._id}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          {/* Nombre */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={formData.firsName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, firsName: text }))}
              placeholder="Nombre del contratista"
            />
          </View>

          {/* Apellido */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Apellido *</Text>
            <TextInput
              style={styles.input}
              value={formData.lastname}
              onChangeText={(text) => setFormData(prev => ({ ...prev, lastname: text }))}
              placeholder="Apellido del contratista"
            />
          </View>

          {/* Cédula */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Cédula *</Text>
            <TextInput
              style={styles.input}
              value={formData.idcard}
              onChangeText={(text) => setFormData(prev => ({ ...prev, idcard: text }))}
              placeholder="Número de cédula"
              keyboardType="numeric"
            />
          </View>

          {/* Teléfono */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Teléfono *</Text>
            <TextInput
              style={styles.input}
              value={formData.telephone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, telephone: text }))}
              placeholder="Número de teléfono"
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.sectionTitle}>Información de Contacto</Text>

          {/* Email Personal */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Personal *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="email@personal.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Email Institucional */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Institucional *</Text>
            <TextInput
              style={styles.input}
              value={formData.institutionalEmail}
              onChangeText={(text) => setFormData(prev => ({ ...prev, institutionalEmail: text }))}
              placeholder="email@gobiernobogota.gov.co"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nueva Contraseña (opcional)</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                placeholder="Dejar vacío para mantener la actual"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Información Laboral</Text>

          {/* Cargo */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Cargo *</Text>
            <TextInput
              style={styles.input}
              value={formData.post}
              onChangeText={(text) => setFormData(prev => ({ ...prev, post: text }))}
              placeholder="Cargo del contratista"
            />
          </View>

          {/* Dirección Residencial */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Dirección Residencial *</Text>
            <TextInput
              style={styles.input}
              value={formData.residentialAddress}
              onChangeText={(text) => setFormData(prev => ({ ...prev, residentialAddress: text }))}
              placeholder="Dirección de residencia"
            />
          </View>

          {/* Número Actividad Económica */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Número Actividad Económica *</Text>
            <TextInput
              style={styles.input}
              value={formData.EconomicaActivityNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, EconomicaActivityNumber: text }))}
              placeholder="Número de actividad económica"
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.sectionTitle}>Configuración</Text>

          {/* Estado */}
          <View style={styles.switchContainer}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Estado Activo</Text>
              <Switch
                value={formData.state}
                onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                trackColor={{ false: '#ccc', true: '#0066CC' }}
                thumbColor={formData.state ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Botón de Envío */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingButtonContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>Actualizando...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Actualizar Contratista</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
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
  infoSection: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 150,
  },
  optionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  switchContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default EditContractorScreen;