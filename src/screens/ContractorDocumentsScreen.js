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
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { getUserRole, getContractorDocuments, uploadContractorDocuments, getAllDocumentManagements, getCurrentUser, updateContractorDocument } from '../services/authService';

const ContractorDocumentsScreen = ({ navigation, route }) => {
  const { contractor } = route.params;
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editDocumentName, setEditDocumentName] = useState('');
  const [editSelectedFile, setEditSelectedFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Los datos del usuario están en contractor.user
  const user = contractor.user || {};
  const contract = contractor.contract || {};
  const contractorName = `${user.firsName || ''} ${user.lastName || ''}`;

  // Definición de campos de documentos requeridos
  const documentFields = [
    { name: "filingLetter", label: "Carta de Radicación", icon: "mail-outline" },
    { name: "certificateOfCompliance", label: "Certificado de Cumplimiento", icon: "checkmark-circle-outline" },
    { name: "signedCertificateOfCompliance", label: "Certificado de Cumplimiento Firmado", icon: "ribbon-outline" },
    { name: "activityReport", label: "Informe de Actividades", icon: "document-text-outline" },
    { name: "taxQualityCertificate", label: "Certificado de Calidad Tributaria", icon: "receipt-outline" },
    { name: "socialSecurity", label: "Seguridad Social", icon: "shield-checkmark-outline" },
    { name: "rut", label: "RUT", icon: "card-outline" },
    { name: "rit", label: "RIT", icon: "business-outline" },
    { name: "trainings", label: "Capacitaciones", icon: "school-outline" },
    { name: "initiationRecord", label: "Acta de Iniciación", icon: "clipboard-outline" },
    { name: "accountCertification", label: "Certificación de Cuentas", icon: "calculator-outline" },
  ];

  useEffect(() => {
    loadUserRole();
    loadDocuments();
  }, []);

  const loadUserRole = async () => {
    try {
      const result = await getUserRole();
      if (result.success) {
        setUserRole(result.role);
      }
    } catch (error) {
      // Error handling silently
    }
  };

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      
      const result = await getContractorDocuments(contractor._id);
      
      if (result.success) {
        // Convertir la estructura de la API a formato de documentos individuales
        const convertedDocuments = [];
        
        // La API siempre devuelve data como objeto único { ... }
        const documentManagement = result.data;
        
        if (documentManagement && documentManagement._id) {
          if (documentManagement.creationDate) {
            // Iterar sobre todos los campos de documentos
            documentFields.forEach(field => {
              const fieldValue = documentManagement[field.name];
              
              if (fieldValue && fieldValue.toString().trim() !== '') {
                convertedDocuments.push({
                  id: `${documentManagement._id}-${field.name}`,
                  name: `${field.label}.pdf`,
                  type: field.name,
                  fieldLabel: field.label,
                  uploadDate: documentManagement.creationDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                  size: 'N/A',
                  status: documentManagement.state ? 'approved' : 'pending',
                  filePath: fieldValue,
                  managementId: documentManagement._id,
                  description: documentManagement.description || 'Documento subido',
                  version: documentManagement.version || 1
                });
              }
            });
          }
        }
        
        setDocuments(convertedDocuments);
        
        // Mostrar mensaje según el resultado
        if (result.isNewDocumentManagement) {
          Alert.alert(
            'Gestión Documental', 
            'Este contratista puede comenzar a subir sus documentos. Los archivos aparecerán aquí una vez subidos.',
            [{ text: 'Entendido' }]
          );
        }
      } else {
        // Manejo específico para gestión documental no encontrada
        if (result.message && result.message.includes('Gestion Documental no encontrada')) {
          Alert.alert(
            'Sin Gestión Documental',
            'Este usuario no tiene una gestión documental creada. Por favor, carga una gestión documental primero.',
            [{ text: 'Entendido' }]
          );
        }
        // Solo mostrar alert para el mensaje específico de contratista sin documentos
        else if (result.message && result.message.includes('Este contratista aun no tiene documentos registrados')) {
          Alert.alert(
            'Sin Documentos Registrados',
            'Este contratista aún no tiene documentos registrados. Puede comenzar a subir documentos usando el botón "Subir Documentos".',
            [{ text: 'Entendido' }]
          );
        }
        setDocuments([]);
      }
    } catch (error) {
      // Manejo específico para errores 404 (no encontrado) - sin mostrar pantalla de error
      if (error.response && error.response.status === 404) {
        setDocuments([]);
        return; // Salir sin mostrar alert
      }
      
      // Para otros errores de red, manejo silencioso también
      if (error.response) {
        setDocuments([]);
        return; // Salir sin mostrar alert
      }
      
      // Solo mostrar alert para errores realmente críticos (no de red)
      if (!error.code || !error.code.includes('NETWORK')) {
        Alert.alert('Error', 'Error al cargar documentos');
      }
      
      setDocuments([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDocuments();
  };

  const pickDocumentForField = async (fieldName, fieldLabel) => {
    try {
      if (userRole === 'funcionario') {
        Alert.alert('Acceso Denegado', 'Los funcionarios no pueden subir documentos');
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        
        // Verificar que el archivo sea PDF
        const isPDF = file.name.toLowerCase().endsWith('.pdf') || 
                      file.mimeType === 'application/pdf';
        
        if (!isPDF) {
          Alert.alert(
            'Formato No Válido', 
            'Solo se permiten archivos PDF. Por favor selecciona un archivo con extensión .pdf',
            [{ text: 'Entendido' }]
          );
          return;
        }

        // Verificar tamaño del archivo (máximo 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB en bytes
        if (file.size && file.size > maxSize) {
          Alert.alert(
            'Archivo Muy Grande', 
            'El archivo PDF no puede superar los 10MB. Por favor selecciona un archivo más pequeño.',
            [{ text: 'Entendido' }]
          );
          return;
        }
        
        setSelectedFiles(prev => ({
          ...prev,
          [fieldName]: {
            uri: file.uri,
            name: file.name,
            size: file.size,
            mimeType: file.mimeType,
            fieldLabel,
            uploadDate: new Date().toISOString()
          }
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Error al seleccionar documento');
    }
  };

  const uploadAllDocuments = async () => {
    try {
      if (Object.keys(selectedFiles).length === 0) {
        Alert.alert('Error', 'Selecciona al menos un documento para subir');
        return;
      }

      setIsUploading(true);

      // Validación final de que todos los archivos sean PDF
      const invalidFiles = Object.entries(selectedFiles).filter(([fieldName, fileData]) => {
        const isPDF = (fileData.name && fileData.name.toLowerCase().endsWith('.pdf')) || 
                      fileData.mimeType === 'application/pdf';
        return !isPDF;
      });

      if (invalidFiles.length > 0) {
        const invalidNames = invalidFiles.map(([fieldName, fileData]) => fileData.name).join(', ');
        Alert.alert(
          'Archivos No Válidos', 
          `Los siguientes archivos no son PDF y no se pueden subir: ${invalidNames}`,
          [{ text: 'Entendido' }]
        );
        setIsUploading(false);
        return;
      }

      // Preparar datos adicionales para el backend
      const description = `Gestión documental para ${contractor.name} - ${Object.keys(selectedFiles).join(', ')}`;
      
      // Obtener IP del usuario logueado
      const userResult = await getCurrentUser();
      const userIp = userResult.success && userResult.data?.ip ? userResult.data.ip : 'N/A';
      
      const retentionTime = '365'; // Un año de retención por defecto
      const state = true; // Estado activo por defecto

      const result = await uploadContractorDocuments(
        contractor._id, 
        selectedFiles, 
        description, 
        userIp, 
        retentionTime, 
        state
      );

      if (result.success) {
        // Limpiar archivos seleccionados y recargar documentos
        setSelectedFiles({});
        setShowUploadModal(false);
        await loadDocuments(); // Recargar la lista de documentos
      } else {
        Alert.alert('Error', result.message || 'Error al subir documentos');
      }

    } catch (error) {
      Alert.alert('Error', 'Error al subir documentos');
    } finally {
      setIsUploading(false);
    }
  };

  const removeSelectedFile = (fieldName) => {
    setSelectedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fieldName];
      return newFiles;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type) => {
    const types = {
      'filingLetter': 'Carta de Radicación',
      'certificateOfCompliance': 'Certificado de Cumplimiento',
      'signedCertificateOfCompliance': 'Certificado de Cumplimiento Firmado',
      'activityReport': 'Informe de Actividades',
      'taxQualityCertificate': 'Certificado de Calidad Tributaria',
      'socialSecurity': 'Seguridad Social',
      'rut': 'RUT',
      'rit': 'RIT',
      'trainings': 'Capacitaciones',
      'initiationRecord': 'Acta de Iniciación',
      'accountCertification': 'Certificación de Cuentas',
      'CV': 'Hoja de Vida',
      'ID': 'Identificación',
      'EDUCATION': 'Educación',
      'EXPERIENCE': 'Experiencia',
      'OTHER': 'Otro'
    };
    return types[type] || 'Documento';
  };

  const getDocumentIcon = (type) => {
    const icons = {
      'filingLetter': 'mail-outline',
      'certificateOfCompliance': 'checkmark-circle-outline',
      'signedCertificateOfCompliance': 'ribbon-outline',
      'activityReport': 'document-text-outline',
      'taxQualityCertificate': 'receipt-outline',
      'socialSecurity': 'shield-checkmark-outline',
      'rut': 'card-outline',
      'rit': 'business-outline',
      'trainings': 'school-outline',
      'initiationRecord': 'clipboard-outline',
      'accountCertification': 'calculator-outline',
      'CV': 'person-outline',
      'ID': 'card-outline',
      'EDUCATION': 'school-outline',
      'EXPERIENCE': 'briefcase-outline',
      'OTHER': 'document-outline'
    };
    return icons[type] || 'document-outline';
  };

  const getStatusColor = (status) => {
    const colors = {
      'approved': '#28a745',
      'pending': '#ffc107',
      'rejected': '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'approved': 'Subido',
      'pending': 'Pendiente',
      'rejected': 'Rechazado'
    };
    return labels[status] || 'Desconocido';
  };

  const openDocument = (document) => {
    setSelectedDocument(document);
    setShowModal(true);
  };

  const deleteDocument = (documentId) => {
    if (userRole === 'funcionario') {
      Alert.alert('Acceso Denegado', 'Los funcionarios no pueden eliminar documentos');
      return;
    }

    Alert.alert(
      'Confirmar Eliminación',
      '¿Está seguro de que desea eliminar este documento?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setDocuments(prev => prev.filter(doc => doc.id !== documentId));
            Alert.alert('Éxito', 'Documento eliminado');
          }
        }
      ]
    );
  };

  const editDocument = (document) => {
    if (userRole === 'funcionario') {
      Alert.alert('Acceso Denegado', 'Los funcionarios no pueden editar documentos');
      return;
    }

    setEditingDocument(document);
    setEditSelectedFile(null);
    setShowEditModal(true);
  };

  const pickEditDocumentFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validar que sea PDF
        const isPDF = (file.name && file.name.toLowerCase().endsWith('.pdf')) || 
                     file.mimeType === 'application/pdf';
        
        if (!isPDF) {
          Alert.alert('Archivo No Válido', 'Solo se permiten archivos PDF');
          return;
        }

        setEditSelectedFile(file);
      }
    } catch (error) {
      Alert.alert('Error', 'Error al seleccionar el archivo');
    }
  };

  const saveEditDocument = async () => {
    try {
      if (!editSelectedFile) {
        Alert.alert('Error', 'Debe seleccionar un archivo PDF');
        return;
      }

      setIsEditing(true);

      // Obtener IP del usuario logueado
      const userResult = await getCurrentUser();
      const userIp = userResult.success && userResult.data?.ip ? userResult.data.ip : 'N/A';

      // Preparar FormData - solo enviamos el archivo y la IP
      const formData = new FormData();
      formData.append('ip', userIp);
      
      const fileToUpload = {
        uri: editSelectedFile.uri,
        type: editSelectedFile.mimeType || 'application/pdf',
        name: editSelectedFile.name,
      };
      
      // El campo en el FormData debe coincidir con el tipo del documento
      formData.append(editingDocument.type, fileToUpload);

      const result = await updateContractorDocument(contractor._id, formData);

      if (result.success) {
        Alert.alert('Éxito', 'Documento actualizado correctamente');
        
        setShowEditModal(false);
        setEditingDocument(null);
        setEditSelectedFile(null);
        await loadDocuments(); // Recargar documentos
      } else {
        Alert.alert('Error', result.message || 'Error al actualizar documento');
      }

    } catch (error) {
      Alert.alert('Error', 'Error al actualizar el documento');
    } finally {
      setIsEditing(false);
    }
  };

  const renderDocumentCard = (document) => {
    // Determinar si el documento ya existe o está pendiente de subir
    const isExistingDocument = document.managementId; // Si tiene managementId, ya existe en el servidor
    const cardStyle = isExistingDocument ? styles.existingDocumentCard : styles.documentCard;
    const iconColor = isExistingDocument ? "#28a745" : "#0066CC";
    
    return (
      <TouchableOpacity
        key={document.id}
        style={cardStyle}
        onPress={() => openDocument(document)}
      >
        <View style={styles.documentHeader}>
          <View style={styles.documentInfo}>
            <Ionicons 
              name={getDocumentIcon(document.type)} 
              size={24} 
              color={iconColor} 
            />
            <View style={styles.documentDetails}>
              <Text style={styles.documentName} numberOfLines={1}>
                {document.name}
              </Text>
              <Text style={styles.documentType}>
                {getDocumentTypeLabel(document.type)}
              </Text>
            </View>
          </View>
          
          <View style={styles.documentActions}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: getStatusColor(document.status) }
            ]}>
              <Text style={styles.statusText}>
                {getStatusLabel(document.status)}
              </Text>
            </View>
            
            {userRole !== 'funcionario' && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => editDocument(document)}
              >
                <Ionicons name="pencil-outline" size={20} color="#0066CC" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.documentMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.metaText}>
              Subido: {new Date(document.uploadDate).toLocaleDateString('es-ES')}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="resize-outline" size={14} color="#666" />
            <Text style={styles.metaText}>Tamaño: {document.size}</Text>
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
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Documentos</Text>
          <Text style={styles.contractorName} numberOfLines={1}>
            {contractorName}
          </Text>
        </View>
      </View>

      {/* Información del contratista */}
      <View style={styles.contractorInfo}>
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
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={16} color="#0066CC" />
            <Text style={styles.contractText}>
              Contrato: {contract.contractNumber}
            </Text>
          </View>
        )}
      </View>

      {/* Botón de subir documentos */}
      {userRole !== 'funcionario' && (
        <View style={styles.uploadSection}>
          <TouchableOpacity
            style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
            onPress={() => setShowUploadModal(true)}
            disabled={isUploading}
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
            <Text style={styles.uploadButtonText}>
              Gestionar Documentos PDF {Object.keys(selectedFiles).length > 0 && `(${Object.keys(selectedFiles).length})`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de documentos */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Cargando documentos...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.documentsList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              {documents.length} documento{documents.length !== 1 ? 's' : ''} subido{documents.length !== 1 ? 's' : ''}
            </Text>
            {documents.length > 0 && (
              <Text style={styles.summarySubtext}>
                Gestión documental activa • {documents.filter(doc => doc.status === 'approved').length} subido{documents.filter(doc => doc.status === 'approved').length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {documents.length > 0 ? (
            documents.map(renderDocumentCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No hay documentos subidos</Text>
              <Text style={styles.emptySubtext}>
                Este contratista aún no ha subido documentos PDF
              </Text>
              {userRole !== 'funcionario' && (
                <Text style={styles.emptySubtext}>
                  Usa "Gestionar Documentos PDF" para comenzar
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal de gestión de documentos */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gestionar Documentos</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.documentFieldsList}>
              <Text style={styles.sectionTitle}>Selecciona los documentos PDF a subir:</Text>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color="#0066CC" />
                <Text style={styles.infoText}>Solo se aceptan archivos PDF (máximo 10MB cada uno)</Text>
              </View>
              
              {documentFields.map((field) => {
                // Verificar si este documento ya existe
                const existingDoc = documents.find(doc => doc.type === field.name);
                const fieldCardStyle = existingDoc ? 
                  [styles.documentFieldCard, styles.existingFieldCard] : 
                  styles.documentFieldCard;
                const iconColor = existingDoc ? "#28a745" : "#0066CC";
                
                return (
                <View key={field.name} style={fieldCardStyle}>
                  <View style={styles.fieldHeader}>
                    <Ionicons name={field.icon} size={20} color={iconColor} />
                    <Text style={[styles.fieldLabel, existingDoc && styles.existingFieldLabel]}>
                      {field.label}
                      {existingDoc && " ✓"}
                    </Text>
                  </View>
                  
                  <View style={styles.fieldActions}>
                    {selectedFiles[field.name] ? (
                      <View style={styles.selectedFileContainer}>
                        <View style={styles.selectedFileInfo}>
                          <Ionicons name="document" size={16} color="#28a745" />
                          <Text style={styles.selectedFileName} numberOfLines={1}>
                            {selectedFiles[field.name].name}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.removeFileButton}
                          onPress={() => removeSelectedFile(field.name)}
                        >
                          <Ionicons name="close-circle" size={20} color="#dc3545" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.selectFileButton}
                        onPress={() => pickDocumentForField(field.name, field.label)}
                      >
                        <Ionicons name="document-outline" size={20} color="#0066CC" />
                        <Text style={styles.selectFileText}>Seleccionar PDF</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                );
              })}
            </ScrollView>

            <View style={styles.uploadModalFooter}>
              <View style={styles.uploadSummary}>
                <Text style={styles.uploadSummaryText}>
                  {Object.keys(selectedFiles).length} documento(s) seleccionado(s)
                </Text>
              </View>
              
              <View style={styles.uploadModalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowUploadModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.uploadConfirmButton,
                    (Object.keys(selectedFiles).length === 0 || isUploading) && styles.uploadConfirmButtonDisabled
                  ]}
                  onPress={uploadAllDocuments}
                  disabled={Object.keys(selectedFiles).length === 0 || isUploading}
                >
                  {isUploading ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.uploadConfirmButtonText}>Subiendo...</Text>
                    </>
                  ) : (
                    <Text style={styles.uploadConfirmButtonText}>Subir Documentos</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de documento */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Información del Documento</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedDocument && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Nombre:</Text>
                  <Text style={styles.modalValue}>{selectedDocument.name}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Tipo:</Text>
                  <Text style={styles.modalValue}>
                    {getDocumentTypeLabel(selectedDocument.type)}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Estado:</Text>
                  <View style={[
                    styles.modalStatusBadge,
                    { backgroundColor: getStatusColor(selectedDocument.status) }
                  ]}>
                    <Text style={styles.modalStatusText}>
                      {getStatusLabel(selectedDocument.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Fecha de subida:</Text>
                  <Text style={styles.modalValue}>
                    {new Date(selectedDocument.uploadDate).toLocaleDateString('es-ES')}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Tamaño:</Text>
                  <Text style={styles.modalValue}>{selectedDocument.size}</Text>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de edición de documento */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Documento</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalBody}>
              <Text style={styles.editDocumentLabel}>
                Editando: {editingDocument?.fieldLabel || 'Documento'}
              </Text>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color="#0066CC" />
                <Text style={styles.infoText}>
                  El nombre del documento está predefinido por el sistema (multer). Solo puedes cambiar el archivo PDF.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tipo de Documento</Text>
                <View style={styles.readOnlyInput}>
                  <Text style={styles.readOnlyText}>
                    {editingDocument?.fieldLabel || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Seleccionar Nuevo Archivo PDF *</Text>
                <TouchableOpacity
                  style={[styles.filePickerButton, isEditing && styles.disabledButton]}
                  onPress={pickEditDocumentFile}
                  disabled={isEditing}
                >
                  <Ionicons 
                    name={editSelectedFile ? "document-attach-outline" : "cloud-upload-outline"} 
                    size={20} 
                    color={isEditing ? "#ccc" : "#0066CC"} 
                  />
                  <Text style={[styles.filePickerText, isEditing && styles.disabledText]}>
                    {editSelectedFile ? editSelectedFile.name : 'Seleccionar archivo PDF'}
                  </Text>
                </TouchableOpacity>

                {editSelectedFile && (
                  <View style={styles.selectedFileInfo}>
                    <Ionicons name="document-outline" size={16} color="#28a745" />
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {editSelectedFile.name}
                    </Text>
                    <Text style={styles.selectedFileSize}>
                      ({(editSelectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.editModalFooter}>
              <TouchableOpacity
                style={[styles.editCancelButton, isEditing && styles.disabledButton]}
                onPress={() => setShowEditModal(false)}
                disabled={isEditing}
              >
                <Text style={[styles.editCancelButtonText, isEditing && styles.disabledText]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.editSaveButton, 
                  (!editSelectedFile || isEditing) && styles.disabledButton
                ]}
                onPress={saveEditDocument}
                disabled={!editSelectedFile || isEditing}
              >
                {isEditing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.editSaveButtonText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  contractorName: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  contractorInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
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
  contractText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    flex: 1,
  },
  uploadSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  uploadButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  summarySubtext: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
    marginTop: 4,
  },
  documentsList: {
    flex: 1,
  },
  documentCard: {
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
  existingDocumentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 14,
    color: '#666',
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  documentMeta: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    minWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    color: '#666',
  },
  modalStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  modalButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para el modal de gestión de documentos
  uploadModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 10,
    maxHeight: '90%',
    minWidth: '95%',
  },
  documentFieldsList: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 10,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#0066CC',
    flex: 1,
  },
  documentFieldCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0066CC',
  },
  existingFieldCard: {
    backgroundColor: '#e8f5e8',
    borderLeftColor: '#28a745',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  existingFieldLabel: {
    color: '#28a745',
  },
  fieldActions: {
    alignItems: 'flex-end',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
    padding: 8,
    width: '100%',
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedFileName: {
    fontSize: 12,
    color: '#28a745',
    marginLeft: 6,
    flex: 1,
  },
  removeFileButton: {
    padding: 4,
  },
  selectFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectFileText: {
    fontSize: 14,
    color: '#0066CC',
    marginLeft: 6,
    fontWeight: '500',
  },
  uploadModalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    padding: 20,
  },
  uploadSummary: {
    marginBottom: 16,
    alignItems: 'center',
  },
  uploadSummaryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  uploadModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadConfirmButton: {
    flex: 2,
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  uploadConfirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Estilos para modal de edición
  editModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  editModalBody: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  editDocumentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#0066CC',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  filePickerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0066CC',
    flex: 1,
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  selectedFileName: {
    marginLeft: 6,
    fontSize: 12,
    color: '#28a745',
    flex: 1,
  },
  selectedFileSize: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  editModalFooter: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  editCancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  editSaveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#0066CC',
    marginLeft: 10,
  },
  editSaveButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  disabledText: {
    color: '#999',
  },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default ContractorDocumentsScreen;