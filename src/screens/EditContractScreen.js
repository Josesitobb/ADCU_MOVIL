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
import DateTimePicker from '@react-native-community/datetimepicker';
import { updateContract, getCurrentUser } from '../services/authService';

const EditContractScreen = ({ route, navigation }) => {
  const { contract } = route.params;

  // Verificar permisos al entrar
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const result = await getCurrentUser();
      if (result.success && result.user.role === 'funcionario') {
        Alert.alert(
          'Acceso Denegado',
          'No tienes permisos para editar contratos',
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
  const contractData = contract.contract || contract; // Para manejar contratos asignados y no asignados

  const [formData, setFormData] = useState({
    typeofcontract: contractData.typeofcontract || '',
    startDate: new Date(contractData.startDate || Date.now()),
    endDate: new Date(contractData.endDate || Date.now()),
    state: contractData.state || false,
    objectiveContract: contractData.objectiveContract || '',
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
      
      // Formatear fechas para API (solo los campos editables)
      const updateData = {
        typeofcontract: formData.typeofcontract,
        startDate: formData.startDate.toISOString().split('T')[0],
        endDate: formData.endDate.toISOString().split('T')[0],
        state: formData.state,
        objectiveContract: formData.objectiveContract,
      };

      console.log('🚀 Actualizando contrato ID:', contractData._id);
      console.log('🚀 Datos a actualizar:', updateData);

      const result = await updateContract(contractData._id, updateData);

      if (result.success) {
        Alert.alert(
          'Éxito',
          'Contrato actualizado exitosamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Error al actualizar contrato');
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      Alert.alert('Error', 'Error inesperado al actualizar contrato');
    } finally {
      setIsLoading(false);
    }
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
          <Text style={styles.title}>Editar Contrato</Text>
        </View>

        {/* Información no editable */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información del Contrato</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Número de Contrato:</Text>
            <Text style={styles.infoValue}>{contractData.contractNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Valor Total:</Text>
            <Text style={styles.infoValue}>
              ${contractData.totalValue?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Valor Período:</Text>
            <Text style={styles.infoValue}>
              ${contractData.periodValue?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Campos Editables</Text>

          {/* Tipo de Contrato */}
          {renderTypeSelector()}

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
              <Text style={styles.submitButtonText}>Actualizar Contrato</Text>
            )}
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
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EditContractScreen;