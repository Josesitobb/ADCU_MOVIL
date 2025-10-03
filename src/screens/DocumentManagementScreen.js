import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {
  DOCUMENT_FIELDS,
  getDocuments,
  uploadDocument,
  editDocument,
  updateDocument,
  uploadAllDocuments,
  getDocumentStatus,
  validateFile,
  getAllDataManagement,
  getDataById,
  createData,
  updateDataField
} from '../services/documentService';

const DocumentManagementScreen = () => {
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  const [selectedFieldName, setSelectedFieldName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  
  // Estados para manejo de múltiples archivos
  const [selectedFiles, setSelectedFiles] = useState({});
  const [globalDescription, setGlobalDescription] = useState('');
  const [uploadingAll, setUploadingAll] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);

  // Estados para modal de edición individual
  const [showEditModal, setShowEditModal] = useState(false);
  const [editField, setEditField] = useState('');
  const [editFieldName, setEditFieldName] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editUploading, setEditUploading] = useState(false);

  // Estados para gestión de datos
  const [dataManagementLoading, setDataManagementLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const result = await getDocuments();
      console.log('📋 Resultado completo de getDocuments:', result);
      
      if (result.success) {
        console.log('📋 Tipo de documents:', typeof result.documents);
        console.log('📋 Contenido de documents:', result.documents);
        
        setDocuments(result.documents);
        
        if (Array.isArray(result.documents)) {
          console.log('✅ Documentos cargados exitosamente (array):', result.documents.length);
        } else if (result.documents && typeof result.documents === 'object') {
          console.log('✅ Documentos cargados exitosamente (objeto):', Object.keys(result.documents));
        } else {
          console.log('✅ Documentos cargados:', result.documents);
        }
      } else {
        console.error('❌ Error API loadDocuments:', result.message);
        Alert.alert('Error de API', `Mensaje del servidor:\n\n${result.message}`);
      }
    } catch (error) {
      console.error('💥 Error crítico loadDocuments:', error);
      Alert.alert('Error Crítico', `No se pudieron cargar los documentos:\n\n${error.message}\n\nRevisa la consola para más detalles.`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const openUploadModal = (fieldKey, fieldName, update = false) => {
    console.log('📤 Abriendo modal de upload:', { fieldKey, fieldName, update });
    setSelectedField(fieldKey);
    setSelectedFieldName(fieldName);
    setIsUpdate(update);
    setDescription(update ? '' : globalDescription); // Descripción vacía para actualizaciones
    setShowUploadModal(true);
  };

  // Función para seleccionar archivo para un campo específico
  const selectFileForField = async (fieldKey) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        // Asegurar que el tipo MIME sea correcto para PDFs
        if (file.name && file.name.toLowerCase().endsWith('.pdf')) {
          file.type = 'application/pdf';
        }
        
        console.log('📁 Archivo seleccionado para', fieldKey, ':', {
          name: file.name,
          type: file.type,
          size: file.size,
          uri: file.uri
        });
        
        // Validar archivo
        const validation = validateFile(file);
        if (!validation.valid) {
          console.error('❌ Validación fallida:', validation.message);
          Alert.alert('Error de Validación', `${validation.message}\n\nDetalles del archivo:\nNombre: ${file.name}\nTipo: ${file.type}\nTamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
          return;
        }
        
        console.log('✅ Archivo validado correctamente para', fieldKey);
        
        // Guardar archivo seleccionado
        setSelectedFiles(prev => ({
          ...prev,
          [fieldKey]: file
        }));
        
        Alert.alert('Éxito', `✅ Archivo seleccionado para ${DOCUMENT_FIELDS[fieldKey]}\n\nArchivo: ${file.name}\nTamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };



  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        // Asegurar que el tipo MIME sea correcto para PDFs
        if (file.name && file.name.toLowerCase().endsWith('.pdf')) {
          file.type = 'application/pdf';
        }
        
        await handleFileUpload(file);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };



  const handleFileUpload = async (file) => {
    // Debug: mostrar información del archivo
    console.log('Archivo seleccionado:', {
      name: file.name,
      type: file.type,
      size: file.size,
      uri: file.uri
    });
    
    // Validar archivo
    const validation = validateFile(file);
    if (!validation.valid) {
      Alert.alert('Error de Validación', validation.message);
      return;
    }

    // Para actualizaciones, no requerimos descripción (solo campo y archivo)
    if (!isUpdate && !description.trim()) {
      Alert.alert('Error', 'Por favor, ingresa una descripción del documento');
      return;
    }

    setUploading(true);
    
    try {
      console.log('📤 Procesando archivo:', { 
        isUpdate, 
        selectedField, 
        fileName: file.name, 
        description: isUpdate ? 'N/A (solo campo y archivo)' : description 
      });
      
      let result;
      if (isUpdate) {
        console.log('✏️ Usando editDocument (solo campo y archivo)');
        result = await editDocument(selectedField, file);
      } else {
        console.log('📤 Usando uploadDocument (con descripción)');
        result = await uploadDocument(selectedField, file, description);
      }

      if (result.success) {
        console.log('✅ Upload exitoso:', result.message);
        Alert.alert('Éxito', `Mensaje del servidor:\n\n${result.message}`);
        await loadDocuments(); // Recargar documentos
        setShowUploadModal(false);
        setDescription('');
      } else {
        console.error('❌ Error API upload:', result.message);
        Alert.alert('Error de API', `Mensaje del servidor:\n\n${result.message}`);
      }
    } catch (error) {
      console.error('💥 Error crítico handleFileUpload:', error);
      Alert.alert('Error Crítico', `Error al procesar el documento:\n\n${error.message}\n\nRevisa la consola para más detalles.`);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadOption = (option) => {
    switch (option) {
      case 'document':
        pickDocument();
        break;
    }
  };

  // Función para subir todos los archivos en UNA SOLA petición
  const uploadAllFiles = async () => {
    const selectedFileKeys = Object.keys(selectedFiles);
    
    if (selectedFileKeys.length === 0) {
      Alert.alert('Sin archivos', 'Selecciona al menos un archivo para subir');
      return;
    }

    // Validar que haya una descripción global
    if (!globalDescription.trim()) {
      Alert.alert(
        '📝 Descripción Requerida', 
        'Por favor, ingresa una descripción para la gestión documental antes de subir los archivos.',
        [{ text: 'OK' }]
      );
      return;
    }

    setUploadingAll(true);
    
    try {
      console.log('🚀 Iniciando envío masivo de documentos...');
      console.log('📦 Archivos seleccionados:', selectedFileKeys);
      console.log('📝 Descripción global:', globalDescription.trim());
      
      // Usar la función de envío masivo que ya existe en documentService
      const result = await uploadAllDocuments(selectedFiles, globalDescription.trim());
      
      console.log('📋 Resultado del envío masivo:', result);
      
      if (result.success) {
        // Éxito - limpiar y recargar
        setHasUploaded(true);
        setSelectedFiles({});
        setGlobalDescription('');
        await loadDocuments();
        
        Alert.alert(
          '✅ Documentos Enviados',
          `${result.message}\n\nSe enviaron ${selectedFileKeys.length} documentos en una sola petición.\n\nRevisa la consola para detalles completos.`,
          [
            {
              text: 'Ver Logs Completos',
              onPress: () => {
                console.log('📊 RESPUESTA COMPLETA API:', result);
                Alert.alert('Logs', 'Revisa la consola para ver todos los detalles de la API');
              }
            },
            { text: 'OK' }
          ]
        );
      } else {
        // Error en el envío
        console.error('❌ Error en envío masivo:', result.message);
        Alert.alert(
          '❌ Error al Enviar',
          `${result.message}\n\nNo se pudieron enviar los documentos.\n\nRevisa la consola para más detalles.`,
          [
            {
              text: 'Ver Logs de Error',
              onPress: () => {
                console.log('� ERROR COMPLETO:', result);
                Alert.alert('Error Logs', 'Revisa la consola para ver los detalles del error');
              }
            },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('💥 Error crítico uploadAllFiles:', error);
      Alert.alert('Error Crítico', `Error al subir documentos:\n\n${error.message}\n\nRevisa la consola para más detalles.`);
    } finally {
      setUploadingAll(false);
    }
  };



  // Función para remover un archivo seleccionado
  const removeSelectedFile = (fieldKey) => {
    setSelectedFiles(prev => {
      const updated = { ...prev };
      delete updated[fieldKey];
      return updated;
    });
  };

  // Función para abrir modal de edición individual
  const openEditModal = (fieldKey, fieldName) => {
    setEditField(fieldKey);
    setEditFieldName(fieldName);
    setEditFile(null);
    setShowEditModal(true);
  };

  // Función para cerrar modal de edición
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditField('');
    setEditFieldName('');
    setEditFile(null);
    setEditUploading(false);
  };

  // Función para seleccionar archivo para editar
  const selectEditFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        // Asegurar que el tipo MIME sea correcto para PDFs
        if (file.name && file.name.toLowerCase().endsWith('.pdf')) {
          file.type = 'application/pdf';
        }
        
        console.log('📁 Archivo seleccionado para editar:', {
          field: editField,
          name: file.name,
          type: file.type,
          size: file.size,
          uri: file.uri
        });
        
        // Validar archivo
        const validation = validateFile(file);
        if (!validation.valid) {
          Alert.alert('Error de Validación', validation.message);
          return;
        }
        
        setEditFile(file);
        Alert.alert('Archivo Seleccionado', `✅ ${file.name}\nTamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  // Función para editar documento individual
  const handleEditDocument = async () => {
    if (!editFile) {
      Alert.alert('Error', 'Selecciona un archivo PDF para editar');
      return;
    }

    setEditUploading(true);
    
    try {
      console.log('✏️ Iniciando edición de documento:', {
        field: editField,
        fieldName: editFieldName,
        file: editFile.name
      });

      const result = await editDocument(editField, editFile);
      
      console.log('📋 Resultado de edición:', result);
      console.log('🔍 Respuesta completa API:', JSON.stringify(result.fullResponse, null, 2));
      
      if (result.success) {
        await loadDocuments(); // Recargar documentos
        closeEditModal();
        
        Alert.alert(
          '✅ Documento Editado', 
          `${result.message}\n\n📄 Documento: ${editFieldName}\n📎 Archivo: ${editFile.name}\n\nRevisa la consola para detalles completos.`,
          [
            {
              text: 'Ver Logs Completos',
              onPress: () => {
                console.log('📊 RESULTADO COMPLETO EDICIÓN:', result);
                Alert.alert('Logs', 'Revisa la consola para ver todos los detalles de la API');
              }
            },
            { text: 'OK' }
          ]
        );
      } else {
        console.error('❌ Error en edición:', result.message);
        Alert.alert(
          'Error al Editar', 
          `${result.message}\n\nRevisa la consola para más detalles.`,
          [
            {
              text: 'Ver Logs de Error',
              onPress: () => {
                console.log('💥 ERROR COMPLETO EDICIÓN:', result);
                Alert.alert('Error Logs', 'Revisa la consola para ver los detalles del error');
              }
            },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('💥 Error crítico handleEditDocument:', error);
      Alert.alert('Error Crítico', `Error al editar documento:\n\n${error.message}\n\nRevisa la consola para más detalles.`);
    } finally {
      setEditUploading(false);
    }
  };

  // Función para probar API de gestión de datos
  const handleDataManagement = async () => {
    Alert.alert(
      '📋 Gestión de Datos',
      'Selecciona una acción:',
      [
        {
          text: 'Obtener Todas las Gestiones',
          onPress: async () => {
            setDataManagementLoading(true);
            try {
              const result = await getAllDataManagement();
              console.log('📋 Resultado getAllDataManagement:', result);
              Alert.alert('✅ Gestiones Obtenidas', `${result.message}\n\nRevisa la consola para ver los datos completos.`);
            } catch (error) {
              Alert.alert('Error', `Error al obtener gestiones: ${error.message}`);
            } finally {
              setDataManagementLoading(false);
            }
          }
        },
        {
          text: 'Obtener por ID',
          onPress: () => {
            Alert.prompt(
              'Management ID',
              'Ingresa el ID de la gestión:',
              async (managementId) => {
                if (managementId) {
                  setDataManagementLoading(true);
                  try {
                    const result = await getDataById(managementId);
                    console.log('📋 Resultado getDataById:', result);
                    Alert.alert('✅ Gestión Obtenida', `${result.message}\n\nRevisa la consola para ver los datos.`);
                  } catch (error) {
                    Alert.alert('Error', `Error al obtener gestión: ${error.message}`);
                  } finally {
                    setDataManagementLoading(false);
                  }
                }
              }
            );
          }
        },
        {
          text: 'Crear Data',
          onPress: () => {
            Alert.prompt(
              'Management ID',
              'Ingresa el Management ID para crear:',
              async (managementId) => {
                if (managementId) {
                  setDataManagementLoading(true);
                  try {
                    const result = await createData(managementId);
                    console.log('📋 Resultado createData:', result);
                    Alert.alert('✅ Data Creada', `${result.message}\n\nRevisa la consola para ver los datos.`);
                  } catch (error) {
                    Alert.alert('Error', `Error al crear data: ${error.message}`);
                  } finally {
                    setDataManagementLoading(false);
                  }
                }
              }
            );
          }
        },
        {
          text: 'Actualizar Campo',
          onPress: () => {
            Alert.prompt(
              'Management ID',
              'Ingresa el Management ID:',
              (managementId) => {
                if (managementId) {
                  Alert.prompt(
                    'Campo',
                    'Ingresa el nombre del campo:',
                    async (fieldName) => {
                      if (fieldName) {
                        try {
                          const fileResult = await DocumentPicker.getDocumentAsync({
                            type: '*/*',
                            copyToCacheDirectory: true,
                          });
                          
                          if (!fileResult.canceled && fileResult.assets[0]) {
                            const file = fileResult.assets[0];
                            setDataManagementLoading(true);
                            
                            try {
                              const result = await updateDataField(managementId, fieldName, file);
                              console.log('📋 Resultado updateDataField:', result);
                              Alert.alert('✅ Campo Actualizado', `${result.message}\n\nArchivo: ${file.name}`);
                            } catch (error) {
                              Alert.alert('Error', `Error al actualizar campo: ${error.message}`);
                            } finally {
                              setDataManagementLoading(false);
                            }
                          }
                        } catch (error) {
                          Alert.alert('Error', 'No se pudo seleccionar el archivo');
                        }
                      }
                    }
                  );
                }
              }
            );
          }
        },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Cargando documentos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gestión Documental</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.dataManagementButton, dataManagementLoading && styles.dataManagementButtonDisabled]}
            onPress={handleDataManagement}
            disabled={dataManagementLoading}
          >
            {dataManagementLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="analytics-outline" size={18} color="#ffffff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => {
              Alert.alert(
                'Debug Info',
                `Documentos cargados: ${typeof documents === 'object' ? Object.keys(documents).length : 'N/A'}\nArchivos seleccionados: ${Object.keys(selectedFiles).length}\nHa subido documentos: ${hasUploaded ? 'Sí' : 'No'}\n\nRevisa la consola para logs detallados.`
              );
            }}
          >
            <Ionicons name="bug-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de Campos de Documentos */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerSection}>
          <Text style={styles.sectionTitle}>Documentos Requeridos</Text>
        </View>
        
        {/* Instrucciones para el usuario */}
        {!hasUploaded && Object.keys(selectedFiles).length === 0 && (
          <View style={styles.instructionsContainer}>
            <Ionicons name="information-circle" size={24} color="#3498db" />
            <Text style={styles.instructionsText}>
              Selecciona los archivos PDF para cada documento y luego presiona "Enviar Archivos"
            </Text>
          </View>
        )}
        
        {Object.entries(DOCUMENT_FIELDS).map(([fieldKey, fieldName]) => {
          const docStatus = getDocumentStatus(documents, fieldKey);
          const isSelected = selectedFiles[fieldKey];
          const isUploaded = docStatus.uploaded;
          
          console.log(`📄 Documento ${fieldKey}:`, { 
            docStatus, 
            isSelected: !!isSelected, 
            isUploaded,
            documentsType: typeof documents,
            hasFieldInDocuments: documents && documents[fieldKey] ? 'SÍ' : 'NO'
          });
          
          return (
            <TouchableOpacity 
              key={fieldKey} 
              style={[
                styles.documentField,
                isUploaded && styles.documentFieldClickable
              ]}
              onPress={() => {
                if (isUploaded) {
                  console.log('📄 Documento clickeado para editar:', fieldKey, fieldName);
                  openEditModal(fieldKey, fieldName);
                }
              }}
              disabled={!isUploaded}
            >
              <View style={styles.documentFieldHeader}>
                <View style={styles.documentFieldInfo}>
                  <Text style={styles.documentFieldName}>{fieldName}</Text>
                  <Text style={styles.documentFieldKey}>Campo: {fieldKey}</Text>
                  
                  {/* Estado del documento */}
                  <View style={[styles.statusBadge, { 
                    backgroundColor: isUploaded ? '#2ecc71' : isSelected ? '#f39c12' : '#e74c3c'
                  }]}>
                    <Text style={styles.statusText}>
                      {isUploaded ? 'Subido' : isSelected ? 'Seleccionado' : 'Pendiente'}
                    </Text>
                  </View>
                  
                  {/* Archivo seleccionado */}
                  {isSelected && (
                    <Text style={styles.selectedFileName}>
                      📎 {isSelected.name}
                    </Text>
                  )}
                  
                  {/* Fecha de subida para documentos ya subidos */}
                  {isUploaded && (
                    <Text style={styles.uploadDate}>
                      Subido: {new Date(docStatus.uploadDate).toLocaleDateString('es-CO')}
                    </Text>
                  )}
                </View>
                
                {/* Botones de acción */}
                <View style={styles.documentActions}>
                  {!hasUploaded || !isUploaded ? (
                    // Modo selección: antes de subir o si no se ha subido este documento
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: isSelected ? '#e74c3c' : '#3498db' }]}
                        onPress={() => isSelected ? removeSelectedFile(fieldKey) : selectFileForField(fieldKey)}
                      >
                        <Ionicons name={isSelected ? "close" : "document"} size={20} color="#ffffff" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    // Modo edición: después de subir - SIN BOTÓN
                    <View style={styles.documentActions}>
                      <Text style={styles.editHintText}>Toca para editar</Text>
                    </View>
                  )}
                </View>
              </View>
              
              {/* Descripción */}
              {(docStatus.description || isSelected) && (
                <Text style={styles.documentDescription}>
                  {isUploaded 
                    ? `Descripción: ${docStatus.description}` 
                    : isSelected 
                      ? `Archivo: ${isSelected.name}` 
                      : ''
                  }
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Descripción global - Abajo de todos los documentos */}
        {Object.keys(selectedFiles).length > 0 && (
          <View style={styles.bottomDescriptionContainer}>
            <Text style={styles.bottomDescriptionLabel}>
              📝 Descripción de la gestión documental:
            </Text>
            <TextInput
              style={styles.bottomDescriptionInput}
              placeholder="Ingresa una descripción para toda esta gestión documental..."
              value={globalDescription}
              onChangeText={setGlobalDescription}
              multiline
              numberOfLines={3}
              maxLength={300}
            />
            <Text style={styles.characterCount}>
              {globalDescription.length}/300 caracteres
            </Text>
          </View>
        )}

        {/* Botón grande "Enviar Documentos" - Al final */}
        {Object.keys(selectedFiles).length > 0 && (
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity 
              style={[styles.bigSendButton, uploadingAll && styles.bigSendButtonDisabled]}
              onPress={uploadAllFiles}
              disabled={uploadingAll}
            >
              {uploadingAll ? (
                <>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.bigSendButtonText}>Enviando Documentos...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={28} color="#ffffff" />
                  <Text style={styles.bigSendButtonText}>
                    Enviar Documentos ({Object.keys(selectedFiles).length})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Modal de Subida */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showUploadModal}
        onRequestClose={() => !uploading && setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isUpdate ? 'Actualizar' : 'Subir'} {selectedFieldName}
              </Text>
              {!uploading && (
                <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                  <Ionicons name="close" size={24} color="#7f8c8d" />
                </TouchableOpacity>
              )}
            </View>

            {uploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.uploadingText}>
                  {isUpdate ? 'Actualizando documento...' : 'Subiendo documento...'}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.fieldInfo}>Campo: {selectedField}</Text>
                
                {/* Mostrar descripción solo para nuevas subidas, no para actualizaciones */}
                {!isUpdate && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.inputLabel}>Descripción del documento *</Text>
                    <TextInput
                      style={styles.descriptionInput}
                      placeholder="Describe el documento que vas a subir..."
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                )}

                {/* Para actualizaciones, mostrar nota explicativa */}
                {isUpdate && (
                  <View style={styles.updateNoteContainer}>
                    <Ionicons name="information-circle" size={20} color="#f39c12" />
                    <Text style={styles.updateNoteText}>
                      Modo actualización: Solo necesitas seleccionar el nuevo archivo PDF. 
                      Se enviará únicamente el archivo al servidor.
                    </Text>
                  </View>
                )}

                <Text style={styles.sectionSubtitle}>
                  {isUpdate ? 'Seleccionar nuevo archivo PDF:' : 'Seleccionar archivo PDF:'}
                </Text>
                
                <TouchableOpacity 
                  style={styles.uploadOption}
                  onPress={() => handleUploadOption('document')}
                >
                  <Ionicons name="document-outline" size={24} color="#e74c3c" />
                  <Text style={styles.uploadOptionText}>📄 Seleccionar Archivo PDF</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Edición Individual */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEditModal}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              🔄 Editar documento: {editFieldName}
            </Text>
            
            <View style={styles.methodInfoContainer}>
              <Ionicons name="information-circle" size={16} color="#e74c3c" />
              <Text style={styles.methodInfoText}>
                Método: PUT | Solo envía: campo + archivo
              </Text>
            </View>

            <Text style={styles.fieldInfo}>Campo: {editField}</Text>
            
            {editUploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#f39c12" />
                <Text style={styles.uploadingText}>Editando documento...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionSubtitle}>Seleccionar nuevo archivo PDF:</Text>
                
                <TouchableOpacity 
                  style={styles.uploadOption}
                  onPress={selectEditFile}
                >
                  <Ionicons name="document-outline" size={24} color="#f39c12" />
                  <Text style={styles.uploadOptionText}>
                    📄 {editFile ? editFile.name : 'Seleccionar Archivo PDF'}
                  </Text>
                </TouchableOpacity>

                {editFile && (
                  <View style={styles.selectedFileInfo}>
                    <Text style={styles.selectedFileText}>
                      ✅ Archivo seleccionado: {editFile.name}
                    </Text>
                    <Text style={styles.selectedFileSize}>
                      Tamaño: {(editFile.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </View>
                )}

                {/* Botones de acción */}
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={closeEditModal}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.editButton, 
                      !editFile && styles.editButtonDisabled
                    ]}
                    onPress={handleEditDocument}
                    disabled={!editFile}
                  >
                    <Ionicons name="create-outline" size={18} color="#ffffff" />
                    <Text style={styles.buttonText}>
                      Editar
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  debugButton: {
    backgroundColor: '#9b59b6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#3498db',
    borderRadius: 25,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    textAlign: 'center',
  },
  documentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  documentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  documentDetails: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  documentCategory: {
    fontSize: 12,
    color: '#95a5a6',
  },
  documentActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  uploadAllButton: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadAllButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  uploadAllButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  selectedFileName: {
    fontSize: 12,
    color: '#2c3e50',
    marginTop: 4,
    fontStyle: 'italic',
  },
  uploadAllButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  selectedFileName: {
    fontSize: 12,
    color: '#2c3e50',
    marginTop: 4,
    fontStyle: 'italic',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 16,
    marginTop: 20,
  },
  documentField: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentFieldInfo: {
    flex: 1,
  },
  documentFieldName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  documentFieldKey: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadDate: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 4,
  },
  documentDescription: {
    fontSize: 12,
    color: '#2c3e50',
    marginTop: 8,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  fieldInfo: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  uploadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  uploadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 16,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  uploadOptionText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 16,
    fontWeight: '500',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  descriptionInputContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  characterCount: {
    fontSize: 10,
    color: '#7f8c8d',
    textAlign: 'right',
    marginTop: 4,
  },
  globalDescriptionContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#3498db',
  },
  globalDescriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  globalDescriptionInput: {
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  selectedFileInfo: {
    backgroundColor: '#d4edda',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  selectedFileText: {
    fontSize: 14,
    color: '#155724',
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedFileSize: {
    fontSize: 12,
    color: '#6c757d',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#f39c12',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  updateNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  updateNoteText: {
    fontSize: 13,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  documentFieldClickable: {
    borderWidth: 2,
    borderColor: '#f39c12',
    backgroundColor: '#fefcf3',
  },
  editHintText: {
    fontSize: 11,
    color: '#f39c12',
    fontStyle: 'italic',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  editButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  methodInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  methodInfoText: {
    fontSize: 12,
    color: '#c62828',
    marginLeft: 6,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  dataManagementButton: {
    backgroundColor: '#e67e22',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilos para descripción y botón de abajo
  bottomDescriptionContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#3498db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomDescriptionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  bottomDescriptionInput: {
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    minHeight: 90,
    color: '#2c3e50',
  },
  bottomButtonContainer: {
    paddingHorizontal: 4,
    paddingVertical: 20,
    marginBottom: 20,
  },
  bigSendButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  bigSendButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  bigSendButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    textAlign: 'center',
  },
});

export default DocumentManagementScreen;