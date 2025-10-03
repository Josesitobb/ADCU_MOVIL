import apiClient from './authService';
import { CONFIG } from '../config/config';
import { getUserContractId } from './contractService';
import * as Network from 'expo-network';

// Campos específicos del multer - DEBEN coincidir exactamente
export const DOCUMENT_FIELDS = {
  filingLetter: 'Carta de Radicación',
  certificateOfCompliance: 'Certificado de Cumplimiento',
  signedCertificateOfCompliance: 'Certificado de Cumplimiento Firmado',
  activityReport: 'Reporte de Actividades',
  taxQualityCertificate: 'Certificado de Calidad Tributaria',
  socialSecurity: 'Seguridad Social',
  rut: 'RUT',
  rit: 'RIT',
  trainings: 'Capacitaciones',
  initiationRecord: 'Acta de Iniciación',
  accountCertification: 'Certificación de Cuenta'
};


// Función para obtener la IP del dispositivo
export const getDeviceIP = async () => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.type !== Network.NetworkStateType.NONE ? 
      '192.168.0.1' : 'No disponible';
  } catch (error) {
    console.error('Error getting device IP:', error);
    return 'No disponible';
  }
};

// Función para obtener todos los documentos del usuario contratista
export const getDocuments = async () => {
  try {
    console.log('📄 Iniciando getDocuments...');
    const contractResult = await getUserContractId();
    console.log('🔗 Resultado de getUserContractId:', contractResult);
    console.log('🌐 API Base URL:', CONFIG.API_BASE_URL);
    console.log('📋 Documents Endpoint:', CONFIG.ENDPOINTS.DOCUMENTS);
    
    if (!contractResult.success) {
      console.error('❌ Error obteniendo userContractId:', contractResult.message);
      return { success: false, message: contractResult.message };
    }

    const endpoint = `${CONFIG.ENDPOINTS.DOCUMENTS}/${contractResult.userContractId}`;
    const fullURL = `${CONFIG.API_BASE_URL}${endpoint}`;
    console.log('🌐 GET - Consultando endpoint:', endpoint);
    console.log('🔗 URL Completa:', fullURL);
    console.log('📋 Método HTTP: GET');
    
    const response = await apiClient.get(endpoint);
    console.log('📡 Respuesta de API:', response.data);
    
    if (response.data && response.data.success) {
      // La API devuelve los datos en response.data.data, no en documents
      const documentsData = response.data.data;
      
      return {
        success: true,
        documents: documentsData, // Pasar el objeto completo
        message: 'Documentos cargados correctamente'
      };
    } else {
      return {
        success: false,
        documents: {},
        message: response.data?.message || 'No se encontraron documentos'
      };
    }
  } catch (error) {
    console.error('Error getting documents:', error);
    
    let errorMessage = 'Error al cargar documentos';
    if (error.response) {
      switch (error.response.status) {
        case 404:
          errorMessage = 'No se encontraron documentos para este contratista';
          break;
        case 403:
          errorMessage = 'No tienes permisos para ver estos documentos';
          break;
        default:
          errorMessage = error.response.data?.message || 'Error del servidor';
      }
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return { success: false, documents: [], message: errorMessage };
  }
};

// Función para subir un documento
export const uploadDocument = async (documentField, file, description) => {
  try {
    const contractResult = await getUserContractId();
    if (!contractResult.success) {
      return { success: false, message: contractResult.message };
    }

    const deviceIP = await getDeviceIP();
    
    const formData = new FormData();
    
    let fileType = file.type || 'application/pdf';
    let fileName = file.name || `${documentField}_${Date.now()}.pdf`;
    
    if (fileName.toLowerCase().endsWith('.pdf')) {
      fileType = 'application/pdf';
    }
    
    formData.append(documentField, {
      uri: file.uri,
      type: fileType,
      name: fileName,
    });

    formData.append('description', description);
    formData.append('ip', deviceIP);

    const uploadEndpoint = `${CONFIG.ENDPOINTS.DOCUMENTS}/${contractResult.userContractId}`;
    const uploadFullURL = `${CONFIG.API_BASE_URL}${uploadEndpoint}`;
    console.log('📤 POST - Subiendo a endpoint:', uploadEndpoint);
    console.log('🔗 URL Completa:', uploadFullURL);
    console.log('📋 Método HTTP: POST');
    console.log('📦 FormData fields:', Object.keys(formData._parts || {}));
    
    // LOG DE DATOS ENVIADOS
    console.log('\n📤 ========================= DATOS ENVIADOS POST =========================');
    console.log('📂 Campo del documento:', documentField);
    console.log('📎 Archivo:', {
      name: fileName,
      type: fileType,
      size: file.size,
      uri: file.uri
    });
    console.log('📝 Description:', description);
    console.log('🌐 IP:', deviceIP);
    console.log('🏁 ====================================================================\n');
    
    const response = await apiClient.post(
      uploadEndpoint,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data && response.data.success) {
      return {
        success: true,
        document: response.data.document,
        message: response.data?.message || 'Documento subido correctamente',
        fullResponse: response.data // Incluir respuesta completa
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al subir documento',
        fullResponse: response.data // Incluir respuesta completa
      };
    }
  } catch (error) {
    // LOG COMPLETO DE ERROR API
    console.error('\n💥 ========================== ERROR API POST ============================');
    console.error('🚨 Error completo:', error);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📋 Status Text:', error.response.statusText);
      console.error('🔗 Headers:', error.response.headers);
      console.error('📦 Data de Error:', JSON.stringify(error.response.data, null, 2));
      console.error('💬 Message en error:', error.response.data?.message);
    } else if (error.request) {
      console.error('📡 Request sin respuesta:', error.request);
    } else {
      console.error('⚠️ Error de configuración:', error.message);
    }
    console.error('🏁 ====================================================================\n');
    
    let errorMessage = 'Error al subir documento';
    if (error.response) {
      switch (error.response.status) {
        case 400:
          errorMessage = error.response.data?.message || 'Formato de archivo no válido';
          break;
        case 413:
          errorMessage = 'El archivo es demasiado grande';
          break;
        case 422:
          errorMessage = error.response.data?.message || 'Error de validación';
          break;
        default:
          errorMessage = error.response.data?.message || 'Error del servidor';
      }
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return { 
      success: false, 
      message: errorMessage,
      errorDetails: error.response?.data,
      statusCode: error.response?.status
    };
  }
};

// Función específica para EDITAR documento (PUT con solo campo y archivo en el body)
export const editDocument = async (documentField, file) => {
  try {
    console.log('✏️ ========================= EDITANDO DOCUMENTO (PUT) =========================');
    console.log('📂 Campo del documento:', documentField);
    console.log('📎 Archivo para editar:', file.name);

    const contractResult = await getUserContractId();
    if (!contractResult.success) {
      return { success: false, message: contractResult.message };
    }

    const formData = new FormData();
    
    let fileType = file.type || 'application/pdf';
    let fileName = file.name || `${documentField}_${Date.now()}.pdf`;
    
    if (fileName.toLowerCase().endsWith('.pdf')) {
      fileType = 'application/pdf';
    }

    // Solo enviamos el campo del documento y el archivo
    formData.append(documentField, {
      uri: file.uri,
      type: fileType,
      name: fileName,
    });

    const editEndpoint = `${CONFIG.ENDPOINTS.DOCUMENTS}/${contractResult.userContractId}`;
    const editFullURL = `${CONFIG.API_BASE_URL}${editEndpoint}`;
    
    console.log('� PUT - Editando en endpoint:', editEndpoint);
    console.log('🔗 URL Completa:', editFullURL);
    console.log('📋 Método HTTP: PUT (edición)');
    console.log('📦 FormData solo contiene:', documentField, 'y archivo');
    
    console.log('\n✏️ ========================= DATOS ENVIADOS EDICIÓN PUT =========================');
    console.log('📂 Campo del documento:', documentField);
    console.log('📎 Archivo:', {
      name: fileName,
      type: fileType,
      size: file.size,
      uri: file.uri
    });
    console.log('🏁 ====================================================================\n');
    
    const response = await apiClient.put(
      editEndpoint,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('\n✅ ========================= RESPUESTA EDICIÓN API =========================');
    console.log('📊 Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    console.log('🏁 ====================================================================\n');

    if (response.data && response.data.success) {
      return {
        success: true,
        document: response.data.document,
        message: response.data?.message || 'Documento editado correctamente',
        fullResponse: response.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al editar documento',
        fullResponse: response.data
      };
    }
  } catch (error) {
    console.error('\n💥 ========================== ERROR API EDICIÓN ============================');
    console.error('🚨 Error completo:', error);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📋 Status Text:', error.response.statusText);
      console.error('📦 Data de Error:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('🏁 ====================================================================\n');
    
    let errorMessage = 'Error al editar documento';
    if (error.response) {
      errorMessage = error.response.data?.message || 'Error del servidor al editar';
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return { 
      success: false, 
      message: errorMessage,
      errorDetails: error.response?.data,
      statusCode: error.response?.status
    };
  }
};

// Función para subir TODOS los documentos en UNA SOLA petición
export const uploadAllDocuments = async (selectedFiles, globalDescription) => {
  try {
    console.log('🚀 ========================= ENVÍO MASIVO =========================');
    console.log('📦 Archivos a enviar:', Object.keys(selectedFiles));
    console.log('📝 Descripción global:', globalDescription);
    
    const contractResult = await getUserContractId();
    if (!contractResult.success) {
      return { success: false, message: contractResult.message };
    }

    const deviceIP = await getDeviceIP();
    const formData = new FormData();
    
    // Añadir la descripción global e IP (datos comunes)
    formData.append('description', globalDescription);
    formData.append('ip', deviceIP);
    
    // Añadir TODOS los archivos al FormData
    for (const [fieldKey, file] of Object.entries(selectedFiles)) {
      let fileType = file.type || 'application/pdf';
      let fileName = file.name || `${fieldKey}_${Date.now()}.pdf`;
      
      if (fileName.toLowerCase().endsWith('.pdf')) {
        fileType = 'application/pdf';
      }
      
      console.log(`📎 Añadiendo archivo ${fieldKey}:`, fileName);
      
      formData.append(fieldKey, {
        uri: file.uri,
        type: fileType,
        name: fileName,
      });
    }

    const uploadEndpoint = `${CONFIG.ENDPOINTS.DOCUMENTS}/${contractResult.userContractId}`;
    const uploadFullURL = `${CONFIG.API_BASE_URL}${uploadEndpoint}`;
    
    console.log('📤 POST - Enviando TODOS los archivos a:', uploadEndpoint);
    console.log('🔗 URL Completa:', uploadFullURL);
    console.log('📋 Método HTTP: POST');
    console.log('📦 Total de archivos:', Object.keys(selectedFiles).length);
    console.log('🏁 ================================================================\n');
    
    const response = await apiClient.post(
      uploadEndpoint,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // LOG COMPLETO DE RESPUESTA API
    console.log('\n📡 ====================== RESPUESTA ENVÍO MASIVO ======================');
    console.log('📊 Status Code:', response.status);
    console.log('📋 Status Text:', response.statusText);
    console.log('📦 Data Completa:', JSON.stringify(response.data, null, 2));
    console.log('✅ Success en data:', response.data?.success);
    console.log('💬 Message en data:', response.data?.message);
    console.log('🏁 ===================================================================\n');

    if (response.data && response.data.success) {
      return {
        success: true,
        message: response.data?.message || 'Todos los documentos subidos correctamente',
        fullResponse: response.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al subir documentos',
        fullResponse: response.data
      };
    }
  } catch (error) {
    console.error('\n💥 ======================= ERROR ENVÍO MASIVO =======================');
    console.error('🚨 Error completo:', error);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📋 Status Text:', error.response.statusText);
      console.error('📦 Data de Error:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('📡 Request sin respuesta:', error.request);
    } else {
      console.error('⚠️ Error de configuración:', error.message);
    }
    console.error('🏁 ===================================================================\n');
    
    let errorMessage = 'Error al subir documentos';
    if (error.response) {
      switch (error.response.status) {
        case 400:
          errorMessage = error.response.data?.message || 'Formato de archivos no válido';
          break;
        case 413:
          errorMessage = 'Los archivos son demasiado grandes';
          break;
        case 422:
          errorMessage = error.response.data?.message || 'Error de validación';
          break;
        default:
          errorMessage = error.response.data?.message || 'Error del servidor';
      }
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return { 
      success: false, 
      message: errorMessage,
      errorDetails: error.response?.data,
      statusCode: error.response?.status
    };
  }
};

// Función para actualizar un documento existente
export const updateDocument = async (documentId, documentField, file, description) => {
  try {
    const contractResult = await getUserContractId();
    if (!contractResult.success) {
      return { success: false, message: contractResult.message };
    }

    const deviceIP = await getDeviceIP();
    
    const formData = new FormData();
    
    let fileType = file.type || 'application/pdf';
    let fileName = file.name || `${documentField}_updated_${Date.now()}.pdf`;
    
    if (fileName.toLowerCase().endsWith('.pdf')) {
      fileType = 'application/pdf';
    }
    
    formData.append(documentField, {
      uri: file.uri,
      type: fileType,
      name: fileName,
    });

    formData.append('description', description);
    formData.append('ip', deviceIP);

    const updateEndpoint = `${CONFIG.ENDPOINTS.DOCUMENTS}/${contractResult.userContractId}`;
    const updateFullURL = `${CONFIG.API_BASE_URL}${updateEndpoint}`;
    console.log('✏️ PUT - Actualizando en endpoint:', updateEndpoint);
    console.log('🔗 URL Completa:', updateFullURL);
    console.log('📋 Método HTTP: PUT');
    console.log('📦 FormData fields:', Object.keys(formData._parts || {}));
    
    // LOG DE DATOS ENVIADOS PUT
    console.log('\n📤 ========================= DATOS ENVIADOS PUT ==========================');
    console.log('📂 Campo del documento:', documentField);
    console.log('📎 Archivo:', {
      name: fileName,
      type: fileType,
      size: file.size,
      uri: file.uri
    });
    console.log('📝 Description:', description);
    console.log('🌐 IP:', deviceIP);
    console.log('🏁 ===================================================================\n');
    
    const response = await apiClient.put(
      updateEndpoint,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // LOG COMPLETO DE RESPUESTA API PUT
    console.log('\n📡 =========================== RESPUESTA API PUT ============================');
    console.log('📊 Status Code:', response.status);
    console.log('📋 Status Text:', response.statusText);
    console.log('🔗 Headers:', response.headers);
    console.log('📦 Data Completa:', JSON.stringify(response.data, null, 2));
    console.log('✅ Success en data:', response.data?.success);
    console.log('💬 Message en data:', response.data?.message);
    console.log('📄 Document en data:', response.data?.document);
    console.log('🏁 ======================================================================\n');

    if (response.data && response.data.success) {
      return {
        success: true,
        document: response.data.document,
        message: response.data?.message || 'Documento actualizado correctamente',
        fullResponse: response.data // Incluir respuesta completa
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al actualizar documento',
        fullResponse: response.data // Incluir respuesta completa
      };
    }
  } catch (error) {
    // LOG COMPLETO DE ERROR API PUT
    console.error('\n💥 ========================== ERROR API PUT =============================');
    console.error('🚨 Error completo:', error);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📋 Status Text:', error.response.statusText);
      console.error('🔗 Headers:', error.response.headers);
      console.error('📦 Data de Error:', JSON.stringify(error.response.data, null, 2));
      console.error('💬 Message en error:', error.response.data?.message);
    } else if (error.request) {
      console.error('📡 Request sin respuesta:', error.request);
    } else {
      console.error('⚠️ Error de configuración:', error.message);
    }
    console.error('🏁 ===================================================================\n');
    
    let errorMessage = 'Error al actualizar documento';
    if (error.response) {
      switch (error.response.status) {
        case 404:
          errorMessage = error.response.data?.message || 'Documento no encontrado';
          break;
        case 400:
          errorMessage = error.response.data?.message || 'Formato de archivo no válido';
          break;
        case 413:
          errorMessage = 'El archivo es demasiado grande';
          break;
        default:
          errorMessage = error.response.data?.message || 'Error del servidor';
      }
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return { 
      success: false, 
      message: errorMessage,
      errorDetails: error.response?.data,
      statusCode: error.response?.status
    };
  }
};

// Función para obtener el estado de un documento específico
export const getDocumentStatus = (documentsData, fieldKey) => {
  // Si documentsData es el objeto data de la API
  if (documentsData && typeof documentsData === 'object' && !Array.isArray(documentsData)) {
    // Verificar si el campo existe y tiene un valor (path del archivo)
    const fieldValue = documentsData[fieldKey];
    
    if (fieldValue && typeof fieldValue === 'string') {
      return {
        uploaded: true,
        uploadDate: documentsData.creationDate || new Date(),
        description: documentsData.description || '',
        fileName: fieldValue.split('\\').pop() || fieldValue.split('/').pop() || fieldKey + '.pdf'
      };
    }
  }
  
  // Compatibilidad con formato anterior (array de documentos)
  if (Array.isArray(documentsData)) {
    const doc = documentsData.find(d => d.fieldName === fieldKey || d.type === fieldKey);
    
    if (doc) {
      return {
        uploaded: true,
        uploadDate: doc.uploadDate || doc.createdAt,
        description: doc.description || '',
        fileName: doc.fileName || doc.originalName || ''
      };
    }
  }
  
  return {
    uploaded: false,
    uploadDate: null,
    description: '',
    fileName: ''
  };
};

// Función para validar archivo antes de subir
export const validateFile = (file, maxSizeInMB = 10) => {
  const fileName = file.name || '';
  const fileExtension = fileName.toLowerCase().split('.').pop();
  const validTypes = ['application/pdf', 'application/x-pdf'];
  
  const isValidPDF = fileExtension === 'pdf' || validTypes.includes(file.type);
  
  if (!isValidPDF) {
    return {
      valid: false,
      message: `Solo se permiten archivos PDF. Archivo detectado: ${file.type || 'tipo desconocido'}, extensión: .${fileExtension || 'sin extensión'}`
    };
  }

  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB > maxSizeInMB) {
    return {
      valid: false,
      message: `El archivo es demasiado grande. Máximo ${maxSizeInMB}MB`
    };
  }

  return { valid: true, message: 'Archivo válido' };
};

// ============================================================================
// API DE GESTIÓN DE DATOS - NUEVAS RUTAS
// ============================================================================

// GET / - Obtener todas las gestiones (admin, funcionario)
export const getAllDataManagement = async () => {
  try {
    console.log('📊 ========================= OBTENIENDO TODAS LAS GESTIONES =========================');

    const endpoint = '/Data';
    const fullURL = `${CONFIG.API_BASE_URL}${endpoint}`;
    
    console.log('📤 GET - Consultando endpoint:', endpoint);
    console.log('🔗 URL Completa:', fullURL);
    
    const response = await apiClient.get(endpoint);

    console.log('\n✅ ========================= RESPUESTA GESTIONES =========================');
    console.log('📊 Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    console.log('🏁 ====================================================================\n');

    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Gestiones obtenidas correctamente',
        fullResponse: response.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al obtener gestiones',
        fullResponse: response.data
      };
    }
  } catch (error) {
    console.error('\n💥 ========================== ERROR OBTENER GESTIONES ============================');
    console.error('🚨 Error completo:', error);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📦 Data de Error:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('🏁 ====================================================================\n');
    
    return { 
      success: false, 
      message: error.response?.data?.message || 'Error al obtener gestiones',
      errorDetails: error.response?.data,
      statusCode: error.response?.status
    };
  }
};

// GET /:management - Obtener gestión por ID
export const getDataById = async (managementId) => {
  try {
    console.log('� ========================= OBTENIENDO GESTIÓN POR ID =========================');
    console.log('🆔 Management ID:', managementId);

    const endpoint = `/Data/${managementId}`;
    const fullURL = `${CONFIG.API_BASE_URL}${endpoint}`;
    
    console.log('� GET - Consultando endpoint:', endpoint);
    console.log('� URL Completa:', fullURL);
    
    const response = await apiClient.get(endpoint);

    console.log('\n✅ ========================= RESPUESTA GESTIÓN BY ID =========================');
    console.log('📊 Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    console.log('🏁 ====================================================================\n');

    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Gestión obtenida correctamente',
        fullResponse: response.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al obtener gestión',
        fullResponse: response.data
      };
    }
  } catch (error) {
    console.error('\n💥 ========================== ERROR OBTENER GESTIÓN BY ID ============================');
    console.error('🚨 Error completo:', error);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📦 Data de Error:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('🏁 ====================================================================\n');
    
    return { 
      success: false, 
      message: error.response?.data?.message || 'Error al obtener gestión',
      errorDetails: error.response?.data,
      statusCode: error.response?.status
    };
  }
};

// POST /:management - Crear/comenzar la creación
export const createData = async (managementId) => {
  try {
    console.log('🚀 ========================= CREANDO DATA =========================');
    console.log('🆔 Management ID:', managementId);

    const endpoint = `/Data/${managementId}`;
    const fullURL = `${CONFIG.API_BASE_URL}${endpoint}`;
    
    console.log('� POST - Creando en endpoint:', endpoint);
    console.log('🔗 URL Completa:', fullURL);
    
    const response = await apiClient.post(endpoint);

    console.log('\n✅ ========================= RESPUESTA CREATE DATA =========================');
    console.log('📊 Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    console.log('🏁 ====================================================================\n');

    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data?.message || 'Data creada correctamente',
        fullResponse: response.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al crear data',
        fullResponse: response.data
      };
    }
  } catch (error) {
    console.error('\n💥 ========================== ERROR CREATE DATA ============================');
    console.error('🚨 Error completo:', error);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📦 Data de Error:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('🏁 ====================================================================\n');
    
    return { 
      success: false, 
      message: error.response?.data?.message || 'Error al crear data',
      errorDetails: error.response?.data,
      statusCode: error.response?.status
    };
  }
};

// PUT /:management/:field - Actualizar campo específico
export const updateDataField = async (managementId, fieldName, file) => {
  try {
    console.log('🔄 ========================= ACTUALIZANDO CAMPO =========================');
    console.log('🆔 Management ID:', managementId);
    console.log('📂 Field:', fieldName);
    console.log('📎 Archivo:', file?.name);

    const formData = new FormData();
    
    if (file) {
      let fileType = file.type || 'application/pdf';
      let fileName = file.name || `${fieldName}_${Date.now()}.pdf`;
      
      if (fileName.toLowerCase().endsWith('.pdf')) {
        fileType = 'application/pdf';
      }

      formData.append(fieldName, {
        uri: file.uri,
        type: fileType,
        name: fileName,
      });
    }

    const endpoint = `/Data/${managementId}/${fieldName}`;
    const fullURL = `${CONFIG.API_BASE_URL}${endpoint}`;
    
    console.log('🔄 PUT - Actualizando en endpoint:', endpoint);
    console.log('🔗 URL Completa:', fullURL);
    
    const response = await apiClient.put(
      endpoint,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('\n✅ ========================= RESPUESTA UPDATE FIELD =========================');
    console.log('📊 Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    console.log('🏁 ====================================================================\n');

    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data?.message || 'Campo actualizado correctamente',
        fullResponse: response.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al actualizar campo',
        fullResponse: response.data
      };
    }
  } catch (error) {
    console.error('\n💥 ========================== ERROR UPDATE FIELD ============================');
    console.error('🚨 Error completo:', error);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📦 Data de Error:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('🏁 ====================================================================\n');
    
    return { 
      success: false, 
      message: error.response?.data?.message || 'Error al actualizar campo',
      errorDetails: error.response?.data,
      statusCode: error.response?.status
    };
  }
};

// Nueva función para obtener análisis de datos de documentos
export const getDocumentAnalysis = async (managementId) => {
  try {
    console.log('📊 Obteniendo análisis de documentos para ID:', managementId);
    
    // Endpoint específico para el análisis de datos
    const endpoint = `http://192.168.0.7:5000/api/Data/${managementId}`;
    
    console.log('🌐 GET - Consultando análisis:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();
    
    console.log('📋 Respuesta análisis completa:', JSON.stringify(responseData, null, 2));

    if (response.ok && responseData.success) {
      return {
        success: true,
        message: responseData.message,
        data: responseData.data,
        fullResponse: responseData
      };
    } else {
      // Manejar caso específico de "No existe una gestion documental con ese id"
      if (responseData.message && responseData.message.includes('No existe una gestion documental con ese id')) {
        return {
          success: false,
          message: 'Todavía no se han analizado sus documentos. Por favor espere o contacte a su administrador.',
          noAnalysis: true,
          originalMessage: responseData.message,
          fullResponse: responseData
        };
      }
      
      return {
        success: false,
        message: responseData.message || 'Error al obtener análisis',
        fullResponse: responseData
      };
    }
  } catch (error) {
    console.error('💥 Error obteniendo análisis:', error);
    return {
      success: false,
      message: 'Error de conexión al obtener el análisis',
      error: error.message
    };
  }
};

export default {
  DOCUMENT_FIELDS,
  getDocuments,
  uploadDocument,
  editDocument,
  updateDocument,
  getDocumentStatus,
  validateFile,
  getDeviceIP,
  getAllDataManagement,
  getDataById,
  createData,
  updateDataField,
  getDocumentAnalysis
};