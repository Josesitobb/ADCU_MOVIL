import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {
  getDocuments,
  getAllDataManagement,
  getDataById,
  createData,
  updateDataField,
  validateFile
} from '../services/documentService';
import { contractService } from '../services/contractService';

// Campos de gestión documental
const DATA_MANAGEMENT_FIELDS = {
  FilingLetter: 'Carta de Radicación',
  CertificateOfCompliance: 'Certificado de Cumplimiento',
  signedCertificateOfCompliance: 'Certificado de Cumplimiento Firmado',
  ActivityReport: 'Reporte de Actividades',
  TaxQuanlityCertificate: 'Certificado de Calidad Tributaria',
  Rut: 'RUT',
  Rit: 'RIT',
  InitiationRecord: 'Acta de Iniciación',
  AccountCertification: 'Certificación de Cuenta'
};

const DataManagementScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [documentManagements, setDocumentManagements] = useState([]);
  const [dataManagements, setDataManagements] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  


  // Cargar gestiones documentales disponibles
  const loadDocumentManagements = async () => {
    try {
      console.log('🔄 Cargando gestiones documentales...');
      const response = await getDocuments();
      if (response.success && response.data) {
        setDocumentManagements(response.data);
        console.log('✅ Gestiones documentales cargadas:', response.data.length);
        
        // Para cada gestión documental, cargar su gestión de datos
        await loadDataManagementsForDocuments(response.data);
      }
    } catch (error) {
      console.error('❌ Error cargando gestiones documentales:', error);
      Alert.alert('Error', 'No se pudieron cargar las gestiones documentales');
    }
  };

  // Cargar gestiones de datos para cada gestión documental
  const loadDataManagementsForDocuments = async (documentMgmts) => {
    try {
      const dataManagementPromises = documentMgmts.map(async (docMgmt) => {
        try {
          const response = await getDataById(docMgmt.id);
          if (response.success && response.data) {
            return {
              documentManagementId: docMgmt.id,
              documentManagement: docMgmt,
              dataManagement: response.data
            };
          }
          return null;
        } catch (error) {
          console.log(`⚠️ No hay gestión de datos para documento ${docMgmt.id}:`, error.message);
          return {
            documentManagementId: docMgmt.id,
            documentManagement: docMgmt,
            dataManagement: null
          };
        }
      });

      const results = await Promise.all(dataManagementPromises);
      const validResults = results.filter(result => result !== null);
      
      setDataManagements(validResults);
      console.log('✅ Gestiones de datos cargadas:', validResults.length);
    } catch (error) {
      console.error('❌ Error cargando gestiones de datos:', error);
    }
  };

  // Crear nueva gestión de datos para una gestión documental
  const createNewDataManagement = async (documentManagementId) => {
    try {
      setUploading(true);
      console.log('📝 Creando nueva gestión de datos para documento:', documentManagementId);
      
      // Consumir API POST /api/Data/:management
      const response = await createData(documentManagementId);
      
      if (response.success) {
        Alert.alert(
          '🎉 Éxito', 
          `Gestión de datos creada correctamente para el documento ${documentManagementId}`,
          [
            {
              text: 'OK',
              onPress: () => loadDocumentManagements()
            }
          ]
        );
      } else {
        Alert.alert('❌ Error', response.message || 'Error al crear gestión de datos');
      }
    } catch (error) {
      console.error('❌ Error creando gestión:', error);
      Alert.alert('❌ Error', 'No se pudo crear la gestión de datos. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  // Actualizar campo específico
  const updateDataManagementField = async (documentManagementId, fieldKey) => {
    try {
      // Seleccionar archivo
      const file = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true
      });

      if (file.canceled || !file.assets || file.assets.length === 0) {
        return;
      }

      const selectedFile = file.assets[0];
      console.log('📄 Archivo seleccionado:', selectedFile.name);

      // Validar archivo
      const validation = validateFile(selectedFile);
      if (!validation.isValid) {
        Alert.alert('Error de Validación', validation.error);
        return;
      }

      setUploading(true);
      setUploadingField(fieldKey);

      // Actualizar campo en el servidor usando el ID de gestión documental
      const response = await updateDataField(documentManagementId, fieldKey, selectedFile);
      
      if (response.success) {
        Alert.alert('Éxito', `${DATA_MANAGEMENT_FIELDS[fieldKey]} actualizado correctamente`);
        loadDocumentManagements();
      } else {
        Alert.alert('Error', response.message || 'Error al actualizar el campo');
      }
    } catch (error) {
      console.error('❌ Error actualizando campo:', error);
      Alert.alert('Error', 'No se pudo actualizar el campo');
    } finally {
      setUploading(false);
      setUploadingField(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocumentManagements();
    setRefreshing(false);
  };

  // Cargar datos al iniciar el componente
  useEffect(() => {
    loadDocumentManagements();
  }, []);





  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Datos</Text>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons name="refresh-outline" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Gestiones de Datos */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="folder-outline" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>Gestiones de Datos</Text>
            <TouchableOpacity 
              style={[styles.createButton, uploading && styles.createButtonDisabled]} 
              onPress={() => {
                if (documentManagements.length > 0) {
                  const availableDocuments = documentManagements.filter(docMgmt => 
                    !dataManagements.some(dataMgmt => dataMgmt.documentManagementId === docMgmt.id)
                  );
                  if (availableDocuments.length > 0) {
                    // Crear automáticamente para el primer documento disponible
                    Alert.alert(
                      '📋 Crear Gestión de Datos',
                      `¿Deseas crear una gestión de datos para el documento ${availableDocuments[0].id}?`,
                      [
                        {
                          text: 'Cancelar',
                          style: 'cancel'
                        },
                        {
                          text: '✅ Crear',
                          onPress: () => createNewDataManagement(availableDocuments[0].id)
                        }
                      ]
                    );
                  } else {
                    Alert.alert('ℹ️ Información', 'Todas las gestiones documentales ya tienen gestiones de datos creadas.');
                  }
                } else {
                  Alert.alert('⚠️ Aviso', 'No hay gestiones documentales disponibles. Primero debes crear una gestión documental.');
                }
              }}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size={16} color="#ffffff" />
              ) : (
                <Ionicons name="add" size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>

          {dataManagements.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color="#bdc3c7" />
              <Text style={styles.emptyStateText}>No hay gestiones de datos</Text>
              <Text style={styles.emptyStateSubtext}>Toca el botón + para crear una nueva</Text>
            </View>
          ) : (
            dataManagements.map((management) => (
              <View key={management.documentManagementId} style={styles.managementItem}>
                <View style={styles.managementHeader}>
                  <Text style={styles.managementId}>Doc ID: {management.documentManagementId}</Text>
                  <Text style={styles.managementDate}>
                    {management.dataManagement ? 
                      new Date(management.dataManagement.createdAt).toLocaleDateString() :
                      'Sin datos'
                    }
                  </Text>
                </View>
                
                <Text style={styles.managementTitle}>Contratista: {management.dataManagement?.data?.accountCertification?.usercomparasion || 'N/A'}</Text>
                
                <View style={styles.fieldsContainer}>
                  {Object.entries(DATA_MANAGEMENT_FIELDS).map(([fieldKey, fieldName]) => {
                    const fieldData = management.dataManagement?.data?.[fieldKey];
                    const isValidated = fieldData?.status === true;
                    const hasError = fieldData?.status === false;
                    
                    return (
                      <TouchableOpacity
                        key={fieldKey}
                        style={[
                          styles.fieldButton,
                          isValidated && styles.fieldButtonSuccess,
                          hasError && styles.fieldButtonError,
                          uploading && uploadingField === fieldKey && styles.fieldButtonUploading
                        ]}
                        onPress={() => updateDataManagementField(management.documentManagementId, fieldKey)}
                        disabled={uploading}
                      >
                        <View style={styles.fieldContent}>
                          <Text style={styles.fieldName}>{fieldName}</Text>
                          <Text style={styles.fieldKey}>{fieldKey}</Text>
                          {fieldData && (
                            <Text style={[
                              styles.fieldStatus,
                              isValidated && styles.fieldStatusSuccess,
                              hasError && styles.fieldStatusError
                            ]}>
                              {isValidated ? '✅ Aprobado' : hasError ? '❌ Rechazado' : '🔄 Pendiente'}
                            </Text>
                          )}
                        </View>
                        {uploading && uploadingField === fieldKey ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Ionicons 
                            name={isValidated ? "checkmark-circle" : hasError ? "close-circle" : "cloud-upload-outline"} 
                            size={20} 
                            color={isValidated ? "#27ae60" : hasError ? "#e74c3c" : "#3498db"} 
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                
                {management.dataManagement === null && (
                  <TouchableOpacity
                    style={[styles.createDataButton, uploading && styles.createDataButtonDisabled]}
                    onPress={() => {
                      Alert.alert(
                        '🚀 Crear Gestión de Datos',
                        `¿Deseas crear una gestión de datos para el documento ID: ${management.documentManagementId}?\n\nEsto consumirá la API: POST /api/Data/${management.documentManagementId}`,
                        [
                          {
                            text: 'Cancelar',
                            style: 'cancel'
                          },
                          {
                            text: '✅ Crear Ahora',
                            onPress: () => createNewDataManagement(management.documentManagementId)
                          }
                        ]
                      );
                    }}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <ActivityIndicator size={16} color="#2ecc71" />
                    ) : (
                      <Ionicons name="add-circle-outline" size={16} color="#2ecc71" />
                    )}
                    <Text style={[styles.createDataText, uploading && styles.createDataTextDisabled]}>
                      {uploading ? 'Creando...' : 'Crear Gestión de Datos'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>



        {/* Acciones Rápidas */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash-outline" size={24} color="#f39c12" />
            <Text style={styles.cardTitle}>Acciones Rápidas</Text>
          </View>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={loadDocumentManagements}
          >
            <Ionicons name="refresh-outline" size={20} color="#3498db" />
            <Text style={styles.actionText}>Actualizar Gestiones</Text>
            <Ionicons name="chevron-forward" size={16} color="#bdc3c7" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, uploading && styles.actionButtonDisabled]}
            onPress={() => {
              if (documentManagements.length > 0) {
                const availableDocuments = documentManagements.filter(docMgmt => 
                  !dataManagements.some(dataMgmt => dataMgmt.documentManagementId === docMgmt.id)
                );
                if (availableDocuments.length > 0) {
                  Alert.alert(
                    '🎯 Crear Nueva Gestión',
                    `Se creará una gestión de datos para:\nDocumento ID: ${availableDocuments[0].id}\n\nAPI: POST /api/Data/${availableDocuments[0].id}`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: '🚀 Crear', onPress: () => createNewDataManagement(availableDocuments[0].id) }
                    ]
                  );
                } else {
                  Alert.alert('✅ Completado', 'Todas las gestiones documentales ya tienen sus gestiones de datos creadas.');
                }
              } else {
                Alert.alert('📋 Sin Datos', 'No hay gestiones documentales disponibles. Primero crea una gestión documental.');
              }
            }}
            disabled={uploading}
          >
            <Ionicons name="add-circle-outline" size={20} color={uploading ? "#bdc3c7" : "#2ecc71"} />
            <Text style={[styles.actionText, uploading && styles.actionTextDisabled]}>Nueva Gestión</Text>
            <Ionicons name="chevron-forward" size={16} color="#bdc3c7" />
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>
              Total de gestiones: {dataManagements.length}
            </Text>
          </View>
        </View>
      </ScrollView>


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
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerButton: {
    backgroundColor: '#3498db',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 10,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  managementItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  managementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  managementId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    fontFamily: 'monospace',
  },
  managementDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  fieldsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fieldButton: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3498db',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldButtonSuccess: {
    borderColor: '#27ae60',
    backgroundColor: '#d5f4e6',
  },
  fieldButtonError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  fieldButtonUploading: {
    backgroundColor: '#3498db',
  },
  fieldStatus: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  fieldStatusSuccess: {
    color: '#27ae60',
  },
  fieldStatusError: {
    color: '#e74c3c',
  },
  createDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#d5f4e6',
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2ecc71',
  },
  createDataText: {
    fontSize: 14,
    color: '#2ecc71',
    fontWeight: '600',
    marginLeft: 6,
  },
  createDataButtonDisabled: {
    backgroundColor: '#ecf0f1',
    borderColor: '#bdc3c7',
  },
  createDataTextDisabled: {
    color: '#7f8c8d',
  },
  actionButtonDisabled: {
    backgroundColor: '#ecf0f1',
  },
  actionTextDisabled: {
    color: '#7f8c8d',
  },
  fieldContent: {
    flex: 1,
  },
  fieldName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
  },
  fieldKey: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  infoText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 6,
  },

});

export default DataManagementScreen;