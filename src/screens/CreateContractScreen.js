import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createContract, getCurrentUser } from '../services/authService';

const CreateContractScreen = ({ navigation }) => {
  // Verificar permisos al entrar
  React.useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const result = await getCurrentUser();
      if (result.success && result.user.role === 'funcionario') {
        Alert.alert(
          'Acceso Denegado',
          'No tienes permisos para crear contratos',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };
  const [formData, setFormData] = useState({
    typeofcontract: '',
    startDate: new Date(),
    endDate: new Date(),
    contractNumber: '',
    state: true,
    periodValue: '',
    totalValue: '',
    objectiveContract: '',
    extension: false,
    addiction: false,
    suspension: false,
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const contractTypes = [
    'Presentacion de servicios',
    'Prestación de servicios profesionales',
    'Suministro',
    'Obra',
    'Consultoría',
  ];

  const [showTypeOptions, setShowTypeOptions] = useState(false);

  const validateForm = () => {
    const requiredFields = [
      { field: 'typeofcontract', name: 'Tipo de contrato' },
      { field: 'contractNumber', name: 'Número de contrato' },
      { field: 'periodValue', name: 'Valor del período' },
      { field: 'totalValue', name: 'Valor total' },
      { field: 'objectiveContract', name: 'Objetivo del contrato' },
    ];

    for (let item of requiredFields) {
      if (!formData[item.field] || formData[item.field].toString().trim() === '') {
        Alert.alert('Error', `${item.name} es requerido`);
        return false;
      }
    }

    if (formData.endDate <= formData.startDate) {
      Alert.alert('Error', 'La fecha de fin debe ser posterior a la fecha de inicio');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      // Formatear fechas para API
      const contractData = {
        ...formData,
        startDate: formData.startDate.toISOString().split('T')[0],
        endDate: formData.endDate.toISOString().split('T')[0],
        periodValue: parseFloat(formData.periodValue),
        totalValue: parseFloat(formData.totalValue),
      };

      console.log('🚀 Enviando datos del contrato:', contractData);

      const result = await createContract(contractData);

      if (result.success) {
        Alert.alert(
          'Éxito',
          'Contrato creado exitosamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Error al crear contrato');
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      Alert.alert('Error', 'Error inesperado al crear contrato');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleCurrencyInput = (field, value) => {
    // Remover caracteres no numéricos excepto puntos y comas
    const numericValue = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, startDate: selectedDate }));
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, endDate: selectedDate }));
    }
  };

  const renderTypeSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Tipo de Contrato *</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setShowTypeOptions(!showTypeOptions)}
      >
        <Text style={[styles.dropdownText, !formData.typeofcontract && styles.placeholderText]}>
          {formData.typeofcontract || 'Seleccionar tipo de contrato'}
        </Text>
        <Ionicons 
          name={showTypeOptions ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#666" 
        />
      </TouchableOpacity>
      
      {showTypeOptions && (
        <View style={styles.optionsContainer}>
          {contractTypes.map((type, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={() => {
                setFormData(prev => ({ ...prev, typeofcontract: type }));
                setShowTypeOptions(false);
              }}
            >
              <Text style={styles.optionText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

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
          <Text style={styles.title}>Crear Contrato</Text>
        </View>

        <View style={styles.form}>
          {/* Tipo de Contrato */}
          {renderTypeSelector()}

          {/* Número de Contrato */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Número de Contrato *</Text>
            <TextInput
              style={styles.input}
              value={formData.contractNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, contractNumber: text }))}
              placeholder="Ej: 424-2024-CPS-P(556677)"
            />
          </View>

          {/* Fechas */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Fecha de Inicio *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.startDate.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Fecha de Fin *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.endDate.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Valores */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Valor del Período *</Text>
            <TextInput
              style={styles.input}
              value={formatCurrency(formData.periodValue)}
              onChangeText={(text) => handleCurrencyInput('periodValue', text)}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Valor Total *</Text>
            <TextInput
              style={styles.input}
              value={formatCurrency(formData.totalValue)}
              onChangeText={(text) => handleCurrencyInput('totalValue', text)}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          {/* Objetivo del Contrato */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Objetivo del Contrato *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.objectiveContract}
              onChangeText={(text) => setFormData(prev => ({ ...prev, objectiveContract: text }))}
              placeholder="Descripción del objetivo del contrato..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Estados booleanos */}
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

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Extensión</Text>
              <Switch
                value={formData.extension}
                onValueChange={(value) => setFormData(prev => ({ ...prev, extension: value }))}
                trackColor={{ false: '#ccc', true: '#0066CC' }}
                thumbColor={formData.extension ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Adición</Text>
              <Switch
                value={formData.addiction}
                onValueChange={(value) => setFormData(prev => ({ ...prev, addiction: value }))}
                trackColor={{ false: '#ccc', true: '#0066CC' }}
                thumbColor={formData.addiction ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Suspensión</Text>
              <Switch
                value={formData.suspension}
                onValueChange={(value) => setFormData(prev => ({ ...prev, suspension: value }))}
                trackColor={{ false: '#ccc', true: '#0066CC' }}
                thumbColor={formData.suspension ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Botón de Envío */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Creando...' : 'Crear Contrato'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={formData.startDate}
            mode="date"
            display="default"
            onChange={onStartDateChange}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={formData.endDate}
            mode="date"
            display="default"
            onChange={onEndDateChange}
          />
        )}
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
  textArea: {
    height: 100,
  },
  row: {
    flexDirection: 'row',
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
    maxHeight: 200,
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
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
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
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateContractScreen;