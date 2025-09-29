import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../config/config';

// Configuración de Axios
const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autorización automáticamente
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
      // Aquí puedes redirigir al login si tienes navegación global
    }
    return Promise.reject(error);
  }
);

// Función para hacer login
export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post(CONFIG.ENDPOINTS.LOGIN, {
      email: email.trim().toLowerCase(),
      password: password,
    });

    const { data } = response;

    if (data.token && data.user) {
      // Guardar token
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, data.token);
      
      // Asegurar que el usuario tenga un ID válido y el rol
      const userData = {
        ...data.user,
        id: data.user.id || data.user._id, // Asegurar que siempre haya un ID
        firstName: data.user.firsName || data.user.firstName, // Corregir typo de la API
        role: data.user.role || 'contratista' // Asegurar que siempre haya un rol
      };
      
      // Guardar datos del usuario
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    }

    return {
      success: true,
      data: data,
      message: 'Login exitoso',
    };
  } catch (error) {
    console.error('Login error:', error);

    let errorMessage = 'Error de conexión';
    
    if (error.response) {
      // Error de respuesta del servidor
      switch (error.response.status) {
        case 400:
          errorMessage = 'Datos inválidos';
          break;
        case 401:
          errorMessage = 'Credenciales incorrectas';
          break;
        case 404:
          errorMessage = 'Usuario no encontrado';
          break;
        case 422:
          errorMessage = error.response.data?.message || 'Error de validación';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = error.response.data?.message || 'Error desconocido';
      }
    } else if (error.request) {
      // Error de red
      errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Función para hacer logout
export const logoutUser = async () => {
  try {
    // Opcional: hacer llamada al servidor para invalidar el token
    await apiClient.post(CONFIG.ENDPOINTS.LOGOUT);
  } catch (error) {
    console.log('Error in logout API call:', error);
  } finally {
    // Limpiar datos locales siempre
    await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
  }
};

// Función para obtener el usuario actual
export const getCurrentUser = async () => {
  try {
    const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    const userData = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);

    if (token && userData) {
      return {
        success: true,
        user: JSON.parse(userData),
        token: token,
      };
    }

    return {
      success: false,
      message: 'No hay sesión activa',
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return {
      success: false,
      message: 'Error al obtener datos del usuario',
    };
  }
};

// Función para verificar si el token es válido
export const verifyToken = async () => {
  try {
    const response = await apiClient.get(CONFIG.ENDPOINTS.VERIFY_TOKEN);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Token inválido o expirado',
    };
  }
};

// Función para refrescar el token
export const refreshToken = async () => {
  try {
    const response = await apiClient.post(CONFIG.ENDPOINTS.REFRESH_TOKEN);
    const { token } = response.data;

    if (token) {
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
    }

    return {
      success: true,
      token: token,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return {
      success: false,
      message: 'No se pudo refrescar el token',
    };
  }
};

// Función para registro de usuario (opcional)
export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post(CONFIG.ENDPOINTS.REGISTER, userData);
    return {
      success: true,
      data: response.data,
      message: 'Usuario registrado exitosamente',
    };
  } catch (error) {
    console.error('Register error:', error);

    let errorMessage = 'Error en el registro';
    
    if (error.response) {
      errorMessage = error.response.data?.message || 'Error en el registro';
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Función para actualizar el perfil del usuario
export const updateUserProfile = async (userId, profileData) => {
  try {
    const response = await apiClient.put(`/Users/${userId}`, {
      telephone: profileData.telephone,
      residentialAddress: profileData.residentialAddress,
      // Agregar más campos según lo que permita la API
    });

    if (response.data?.success) {
      return {
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al actualizar el perfil',
      };
    }
  } catch (error) {
    console.error('Update profile error:', error);

    let errorMessage = 'Error al actualizar el perfil';
    
    if (error.response) {
      errorMessage = error.response.data?.message || 'Error al actualizar el perfil';
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Función para cambiar la contraseña
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });

    if (response.data?.success) {
      return {
        success: true,
        message: 'Contraseña cambiada exitosamente',
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al cambiar la contraseña',
      };
    }
  } catch (error) {
    console.error('Change password error:', error);

    let errorMessage = 'Error al cambiar la contraseña';
    
    if (error.response) {
      errorMessage = error.response.data?.message || 'Error al cambiar la contraseña';
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Función para obtener estadísticas del usuario
export const getUserStats = async (userId) => {
  try {
    const response = await apiClient.get(`/Users/${userId}/stats`);

    if (response.data?.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al obtener estadísticas',
      };
    }
  } catch (error) {
    console.error('Get user stats error:', error);

    return {
      success: false,
      message: 'Error al obtener estadísticas del usuario',
    };
  }
};

// Función helper para verificar el rol del usuario
export const getUserRole = async () => {
  try {
    const userData = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
    if (userData) {
      const user = JSON.parse(userData);
      return user.role || 'contratista';
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Función helper para determinar la pantalla de navegación según el rol
export const getNavigationScreenForRole = async () => {
  const role = await getUserRole();
  
  switch (role) {
    case 'funcionario':
      return 'Home';
    case 'contratista':
    case 'contractor':
      return 'Dashboard';
    default:
      return 'Dashboard'; // Por defecto ir al dashboard
  }
};

// Función para verificar si el usuario es funcionario
export const isFuncionario = async () => {
  const role = await getUserRole();
  return role === 'funcionario';
};

// Función para verificar si el usuario es contratista
export const isContratista = async () => {
  const role = await getUserRole();
  return role === 'contratista' || role === 'contractor';
};

// Función para obtener todos los contratos disponibles
export const getContracts = async () => {
  try {
    console.log('🔍 API Call: GET /Contracts');
    const response = await apiClient.get('/Contracts');
    
    console.log('📄 Raw API Response (getContracts):', JSON.stringify(response.data, null, 2));
    console.log('🔍 Response status:', response.status);
    
    if (response.data && response.data.success) {
      console.log('✅ getContracts success - data type:', typeof response.data.data, 'isArray:', Array.isArray(response.data.data));
      return {
        success: true,
        data: Array.isArray(response.data.data) ? response.data.data : [],
        message: 'Contratos obtenidos exitosamente',
      };
    } else {
      console.log('❌ getContracts failed - response.data:', response.data);
      return {
        success: false,
        message: response.data?.message || 'Error al obtener contratos',
        data: [],
      };
    }
  } catch (error) {
    console.error('💥 Get contracts error:', error);
    console.log('💥 Error details:');
    console.log('- error.response?.status:', error.response?.status);
    console.log('- error.response?.data:', JSON.stringify(error.response?.data, null, 2));
    console.log('- error.request:', error.request ? 'Request was made' : 'No request');
    console.log('- error.message:', error.message);

    let errorMessage = 'Error al obtener contratos';
    
    if (error.response) {
      errorMessage = error.response.data?.message || 'Error al obtener contratos';
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return {
      success: false,
      message: errorMessage,
      data: [],
    };
  }
};

// Función para crear un nuevo contratista
export const createContractor = async (contractorData) => {
  try {
    console.log('🔍 API Call: POST /Users');
    console.log('📤 Payload:', JSON.stringify(contractorData, null, 2));
    
    const response = await apiClient.post('/Users', contractorData);
    
    console.log('📄 Raw API Response (createContractor):', JSON.stringify(response.data, null, 2));
    console.log('🔍 Response status:', response.status);
    
    if (response.data && response.data.success) {
      console.log('✅ createContractor success');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Contratista creado exitosamente',
      };
    } else {
      console.log('❌ createContractor failed - response.data:', response.data);
      return {
        success: false,
        message: response.data?.message || 'Error al crear contratista',
      };
    }
  } catch (error) {
    console.error('💥 Create contractor error:', error);
    console.log('💥 Error details:');
    console.log('- error.response?.status:', error.response?.status);
    console.log('- error.response?.data:', JSON.stringify(error.response?.data, null, 2));
    console.log('- error.request:', error.request ? 'Request was made' : 'No request');
    console.log('- error.message:', error.message);

    let errorMessage = 'Error al crear contratista';
    
    if (error.response) {
      errorMessage = error.response.data?.message || 'Error al crear contratista';
      // Si hay errores de validación específicos, incluirlos
      if (error.response.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).join(', ');
        errorMessage = `Errores de validación: ${validationErrors}`;
      }
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Función para crear un nuevo contrato
export const createContract = async (contractData) => {
  try {
    console.log('🔍 API Call: POST /Contracts');
    console.log('📤 Contract Payload:', JSON.stringify(contractData, null, 2));
    
    const response = await apiClient.post('/Contracts', contractData);
    
    console.log('📥 Contract Raw Response:', response);
    console.log('✅ Contract Response Status:', response.status);
    console.log('📋 Contract Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.success) {
      console.log('✅ createContract success');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Contrato creado exitosamente',
      };
    } else {
      console.log('❌ createContract failed - response.data:', response.data);
      return {
        success: false,
        message: response.data?.message || 'Error al crear contrato',
      };
    }
  } catch (error) {
    console.log('❌ Create Contract Error:', error);
    console.log('🔍 Contract Error Response:', error.response);
    console.log('📄 Contract Error Data:', error.response?.data);
    console.log('📊 Contract Error Status:', error.response?.status);
    
    let errorMessage = 'Error al crear contrato';
    
    if (error.response) {
      errorMessage = error.response.data?.message || 'Error al crear contrato';
      if (error.response.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).join(', ');
        errorMessage = `Errores de validación: ${validationErrors}`;
      }
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Función para actualizar un contrato
export const updateContract = async (contractId, contractData) => {
  try {
    console.log('🔍 API Call: PUT /Contracts/' + contractId);
    console.log('📤 Update Contract Payload:', JSON.stringify(contractData, null, 2));
    
    const response = await apiClient.put(`/Contracts/${contractId}`, contractData);
    
    console.log('📥 Contract Update Raw Response:', response);
    console.log('✅ Contract Update Response Status:', response.status);
    console.log('📋 Contract Update Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.success) {
      console.log('✅ updateContract success');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Contrato actualizado exitosamente',
      };
    } else {
      console.log('❌ updateContract failed - response.data:', response.data);
      return {
        success: false,
        message: response.data?.message || 'Error al actualizar contrato',
      };
    }
  } catch (error) {
    console.log('❌ Update Contract Error:', error);
    console.log('🔍 Contract Update Error Response:', error.response);
    console.log('📄 Contract Update Error Data:', error.response?.data);
    console.log('📊 Contract Update Error Status:', error.response?.status);
    
    let errorMessage = 'Error al actualizar contrato';
    
    if (error.response) {
      errorMessage = error.response.data?.message || 'Error al actualizar contrato';
      if (error.response.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).join(', ');
        errorMessage = `Errores de validación: ${validationErrors}`;
      }
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Función para obtener un contratista específico por ID
export const getContractorById = async (contractorId) => {
  try {
    console.log('🔍 API Call: GET /Users/' + contractorId);
    const response = await apiClient.get(`/Users/${contractorId}`);
    
    console.log('📥 Contractor Details Raw Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.success) {
      console.log('✅ getContractorById success');
      return {
        success: true,
        data: response.data.date, // Nota: la API devuelve "date" no "data"
        message: 'Contratista obtenido exitosamente',
      };
    } else {
      console.log('❌ getContractorById failed - response.data:', response.data);
      return {
        success: false,
        message: 'Error al obtener datos del contratista',
        data: null,
      };
    }
  } catch (error) {
    console.error('💥 Get contractor by ID error:', error);
    return {
      success: false,
      message: 'Error al obtener datos del contratista',
      data: null,
    };
  }
};

// Función para actualizar un usuario contratista
export const updateContractor = async (contractorId, contractorData) => {
  try {
    console.log('🔍 API Call: PUT /Users/' + contractorId);
    console.log('📤 Update Contractor Payload:', JSON.stringify(contractorData, null, 2));
    
    const response = await apiClient.put(`/Users/${contractorId}`, contractorData);
    
    console.log('📥 Contractor Update Raw Response:', response);
    console.log('✅ Contractor Update Response Status:', response.status);
    console.log('📋 Contractor Update Response Data:', JSON.stringify(response.data, null, 2));
    console.log('🔍 Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('🎯 Full Response Object Keys:', Object.keys(response));
    
    if (response.data && response.data.success) {
      console.log('✅ updateContractor success');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Contratista actualizado exitosamente',
      };
    } else {
      console.log('❌ updateContractor failed - response.data:', response.data);
      return {
        success: false,
        message: response.data?.message || 'Error al actualizar contratista',
      };
    }
  } catch (error) {
    console.log('❌ Update Contractor Error:', error);
    console.log('🔍 Error Type:', typeof error);
    console.log('🔍 Error Name:', error.name);
    console.log('🔍 Error Message:', error.message);
    console.log('🔍 Contractor Update Error Response:', error.response);
    console.log('📄 Contractor Update Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('📊 Contractor Update Error Status:', error.response?.status);
    console.log('🔗 Error Request URL:', error.config?.url);
    console.log('🔗 Error Request Method:', error.config?.method);
    
    let errorMessage = 'Error al actualizar contratista';
    
    if (error.response) {
      errorMessage = error.response.data?.message || 'Error al actualizar contratista';
      if (error.response.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).join(', ');
        errorMessage = `Errores de validación: ${validationErrors}`;
      }
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Función para obtener todos los contratos
export const getAllContracts = async () => {
  try {
    console.log('🔍 API Call: GET /Contracts');
    const response = await apiClient.get('/Contracts');
    
    console.log('📥 Raw API Response (getAllContracts):', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      console.log('✅ getAllContracts success - contracts found:', response.data.data.length);
      return {
        success: true,
        data: response.data.data,
        message: 'Contratos obtenidos exitosamente',
      };
    } else {
      console.log('❌ getAllContracts failed - unexpected response format');
      return {
        success: false,
        message: 'Formato de respuesta inesperado',
        data: [],
      };
    }
  } catch (error) {
    console.error('💥 Get all contracts error:', error);
    return {
      success: false,
      message: 'Error al obtener contratos',
      data: [],
    };
  }
};

// Función para obtener contratos sin contratista asignado
export const getContractsWithoutContractor = async () => {
  try {
    console.log('🔍 API Call: GET /Contracts?WithContractor=false');
    const response = await apiClient.get('/Contracts?WithContractor=false');
    
    console.log('📥 Raw API Response (getContractsWithoutContractor):', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      console.log('✅ getContractsWithoutContractor success - available contracts:', response.data.data.length);
      return {
        success: true,
        data: response.data.data,
        message: 'Contratos disponibles obtenidos exitosamente',
      };
    } else {
      console.log('❌ getContractsWithoutContractor failed - unexpected response format');
      return {
        success: false,
        message: 'Formato de respuesta inesperado',
        data: [],
      };
    }
  } catch (error) {
    console.error('💥 Get contracts without contractor error:', error);
    return {
      success: false,
      message: 'Error al obtener contratos disponibles',
      data: [],
    };
  }
};

// Función para obtener contratos con contratista asignado
export const getContractsWithContractor = async () => {
  try {
    console.log('🔍 API Call: GET /Contracts?WithContractor=true');
    const response = await apiClient.get('/Contracts?WithContractor=true');
    
    console.log('📥 Raw API Response (getContractsWithContractor):', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      console.log('✅ getContractsWithContractor success - assigned contracts:', response.data.data.length);
      return {
        success: true,
        data: response.data.data,
        message: 'Contratos asignados obtenidos exitosamente',
      };
    } else {
      console.log('❌ getContractsWithContractor failed - unexpected response format');
      return {
        success: false,
        message: 'Formato de respuesta inesperado',
        data: [],
      };
    }
  } catch (error) {
    console.error('💥 Get contracts with contractor error:', error);
    return {
      success: false,
      message: 'Error al obtener contratos asignados',
      data: [],
    };
  }
};

// Función para obtener contratistas activos o inactivos
export const getContractors = async (state = true) => {
  try {
    const response = await apiClient.get(`/Users/Contractor?state=${state}`);
    
    if (response.data && response.data.success) {
      // Asegurar que siempre devolvamos un array
      const contractorsData = response.data.data || response.data.users || [];
      
      return {
        success: true,
        data: Array.isArray(contractorsData) ? contractorsData : [],
        message: 'Contratistas obtenidos exitosamente',
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al obtener contratistas',
        data: [],
      };
    }
  } catch (error) {
    console.error('Get contractors error:', error);

    let errorMessage = 'Error al obtener contratistas';
    
    if (error.response) {
      errorMessage = error.response.data?.message || 'Error al obtener contratistas';
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return {
      success: false,
      message: errorMessage,
      data: [],
    };
  }
};

// Función para obtener todos los contratistas (activos e inactivos)
export const getAllContractors = async () => {
  try {
    const [activeResult, inactiveResult] = await Promise.all([
      getContractors(true),
      getContractors(false)
    ]);

    // Asegurarse de que data sea un array, independientemente de la respuesta de la API
    const activeContractors = activeResult.success && Array.isArray(activeResult.data) ? activeResult.data : [];
    const inactiveContractors = inactiveResult.success && Array.isArray(inactiveResult.data) ? inactiveResult.data : [];

    return {
      success: true,
      data: {
        active: activeContractors,
        inactive: inactiveContractors,
        total: activeContractors.length + inactiveContractors.length
      },
      message: 'Todos los contratistas obtenidos exitosamente',
    };
  } catch (error) {
    console.error('Get all contractors error:', error);
    return {
      success: false,
      message: 'Error al obtener todos los contratistas',
      data: {
        active: [],
        inactive: [],
        total: 0
      },
    };
  }
};

// Función para obtener todos los contratistas para gestión documental (formato completo con user y contract)
export const getAllContractorsForDocuments = async () => {
  try {
    console.log('📋 Obteniendo todos los contratistas para gestión documental...');
    const response = await apiClient.get('/Users/Contractor');
    
    if (response.data && response.data.success) {
      const contractorsData = response.data.data || [];
      console.log('✅ Contratistas obtenidos para documentos:', contractorsData.length);
      
      return {
        success: true,
        data: Array.isArray(contractorsData) ? contractorsData : [],
        message: response.data.message || 'Contratistas obtenidos exitosamente',
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al obtener contratistas',
        data: [],
      };
    }
  } catch (error) {
    console.error('Get contractors for documents error:', error);

    let errorMessage = 'Error al obtener contratistas para documentos';
    
    if (error.response) {
      errorMessage = error.response.data?.message || 'Error al obtener contratistas';
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return {
      success: false,
      message: errorMessage,
      data: [],
    };
  }
};

// Función para subir documentos múltiples de un contratista
export const uploadContractorDocuments = async (contractorId, documents, description, ip, retentionTime, state) => {
  try {
    console.log('📤 ========== INICIANDO SUBIDA DE DOCUMENTOS ==========');
    console.log('📤 Contratista ID:', contractorId);
    console.log('� Documentos a subir:', Object.keys(documents));
    console.log('📤 Detalles de documentos:', JSON.stringify(documents, null, 2));

    // Crear FormData para multipart/form-data
    const formData = new FormData();
    
    // Agregar campos requeridos por el backend
    formData.append('description', description || 'Gestión documental del contratista');
    formData.append('ip', ip || 'N/A');
    formData.append('retentionTime', retentionTime || '365'); // días por defecto
    formData.append('state', state !== undefined ? state : true); // true por defecto
    
    console.log('📤 Campos agregados al FormData:');
    console.log('  - description:', description || 'Gestión documental del contratista');
    console.log('  - ip:', ip || 'N/A');
    console.log('  - retentionTime:', retentionTime || '365');
    console.log('  - state:', state !== undefined ? state : true);

    // Agregar cada archivo con su nombre de campo correspondiente
    Object.entries(documents).forEach(([fieldName, fileData]) => {
      const fileToUpload = {
        uri: fileData.uri,
        type: fileData.mimeType || 'application/octet-stream',
        name: fileData.name,
      };
      
      formData.append(fieldName, fileToUpload);
      console.log(`📎 Agregando archivo para ${fieldName}:`, {
        name: fileData.name,
        size: fileData.size,
        mimeType: fileData.mimeType,
        uri: fileData.uri?.substring(0, 50) + '...'
      });
    });

    const uploadUrl = `/Documents/${contractorId}`;
    console.log('🌐 URL de subida:', uploadUrl);
    console.log('🌐 Base URL:', apiClient.defaults?.baseURL || 'No definida');
    console.log('🌐 URL completa:', `${apiClient.defaults?.baseURL || 'http://192.168.0.6:5000/api'}${uploadUrl}`);
    console.log('📤 Enviando FormData...');

    // Usar la URL correcta para subir documentos: /Documents/:userContract
    const response = await apiClient.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutos para subida de archivos
    });

    console.log('📥 ========== RESPUESTA DE SUBIDA RECIBIDA ==========');
    console.log('📥 Status de respuesta:', response.status);
    console.log('📥 Status text:', response.statusText);
    console.log('📥 Headers de respuesta:', response.headers);
    console.log('📥 Data COMPLETA de respuesta:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.success) {
      console.log('✅ ========== SUBIDA EXITOSA ==========');
      console.log('✅ response.data.success:', response.data.success);
      console.log('✅ response.data.message:', response.data.message);
      console.log('✅ response.data.data:', response.data.data);
      console.log('✅ Tipo de response.data.data:', typeof response.data.data);
      
      const successResult = {
        success: true,
        data: response.data.data || {},
        message: response.data.message || 'Documentos subidos exitosamente',
      };
      
      console.log('✅ Resultado final de subida:', JSON.stringify(successResult, null, 2));
      return successResult;
    } else {
      console.error('❌ ========== ERROR EN SUBIDA ==========');
      console.error('❌ response.data:', response.data);
      console.error('❌ response.data.success:', response.data?.success);
      console.error('❌ response.data.message:', response.data?.message);
      
      const errorResult = {
        success: false,
        message: response.data?.message || 'Error al subir documentos',
        data: {},
      };
      
      console.error('❌ Resultado de error:', JSON.stringify(errorResult, null, 2));
      return errorResult;
    }
  } catch (error) {
    console.error('💥 ========== ERROR AL SUBIR DOCUMENTOS ==========');
    console.error('💥 Error completo:', error);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error name:', error.name);
    console.error('💥 Error stack:', error.stack);

    let errorMessage = 'Error al subir documentos';
    
    if (error.response) {
      console.error('💥 Error response status:', error.response.status);
      console.error('💥 Error response statusText:', error.response.statusText);
      console.error('💥 Error response headers:', error.response.headers);
      console.error('💥 Error response data:', JSON.stringify(error.response.data, null, 2));
      errorMessage = error.response.data?.message || 'Error del servidor al subir documentos';
    } else if (error.request) {
      console.error('💥 Error request:', error.request);
      console.error('💥 No hubo respuesta del servidor');
      errorMessage = 'No se pudo conectar al servidor para subir documentos';
    } else {
      console.error('💥 Error de configuración:', error.message);
    }

    const finalErrorResult = {
      success: false,
      message: errorMessage,
      data: {},
    };

    console.error('💥 Resultado final de error:', JSON.stringify(finalErrorResult, null, 2));
    return finalErrorResult;
  }
};

// Función para obtener documentos de un contratista
export const getContractorDocuments = async (contractorId) => {
  try {
    console.log('🌐 ========== API CALL DOCUMENTS ==========');
    console.log('📂 Obteniendo documentos del contratista ID:', contractorId);
    console.log('🌐 URL completa que se va a llamar:', `/Documents/${contractorId}`);
    console.log('🌐 Base URL del apiClient:', apiClient.defaults?.baseURL || 'No definida');
    
    // Usar la URL correcta: /Documents/:userContract
    const response = await apiClient.get(`/Documents/${contractorId}`);
    
    console.log('📥 ========== RESPUESTA COMPLETA DEL SERVIDOR ==========');
    console.log('📥 Status de respuesta:', response.status);
    console.log('📥 Status text:', response.statusText);
    console.log('📥 Headers completos:', JSON.stringify(response.headers, null, 2));
    console.log('📥 ⭐ DATA COMPLETA DE RESPUESTA:', JSON.stringify(response.data, null, 2));
    console.log('📥 Tipo de response:', typeof response);
    console.log('📥 Tipo de response.data:', typeof response.data);
    console.log('📥 Object.keys(response.data):', Object.keys(response.data || {}));
    console.log('📥 response.data.success:', response.data?.success);
    console.log('📥 response.data.message:', response.data?.message);
    console.log('📥 response.data.data:', response.data?.data);
    
    if (response.data && response.data.success) {
      const documentsData = response.data.data || [];
      console.log('✅ ========== PROCESANDO RESPUESTA EXITOSA ==========');
      console.log('✅ response.data.success:', response.data.success);
      console.log('✅ response.data.data:', response.data.data);
      console.log('✅ Tipo de response.data.data:', typeof response.data.data);
      console.log('✅ Es Array response.data.data:', Array.isArray(response.data.data));
      
      const finalResult = {
        success: true,
        data: response.data.data, // Pasar el objeto tal como viene, no como array
        message: response.data.message || 'Documentos obtenidos exitosamente',
      };
      
      console.log('✅ Resultado final que se retorna:', JSON.stringify(finalResult, null, 2));
      return finalResult;
    } else {
      console.log('❌ ========== RESPUESTA NO EXITOSA ==========');
      console.log('❌ response.data:', response.data);
      console.log('❌ response.data.success:', response.data?.success);
      
      return {
        success: false,
        message: response.data?.message || 'Error al obtener documentos',
        data: {},
      };
    }
  } catch (error) {
    console.error('💥 ========== ERROR EN API CALL ==========');
    console.error('💥 Error completo:', error);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error response:', error.response);
    console.error('💥 Error response status:', error.response?.status);
    console.error('💥 Error response data:', error.response?.data);
    console.error('💥 Error request:', error.request);

    let errorMessage = 'Error al obtener documentos';
    
    // Si es 404, significa que el contratista no tiene gestión documental
    if (error.response && error.response.status === 404) {
      console.log('ℹ️ ========== CONTRATISTA SIN GESTIÓN DOCUMENTAL (404) ==========');
      const result404 = {
        success: true,
        data: {},
        message: 'Este contratista aún no tiene documentos registrados',
        isNewDocumentManagement: true,
      };
      console.log('ℹ️ Retornando resultado 404:', JSON.stringify(result404, null, 2));
      return result404;
    } else if (error.response) {
      errorMessage = error.response.data?.message || 'Error del servidor al obtener documentos';
      console.error('💥 Error del servidor:', errorMessage);
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
      console.error('💥 Error de conexión:', errorMessage);
    }

    const errorResult = {
      success: false,
      message: errorMessage,
      data: {},
    };
    
    console.error('💥 Retornando error:', JSON.stringify(errorResult, null, 2));
    return errorResult;
  }
};

// Función para obtener todas las gestiones documentales
export const getAllDocumentManagements = async () => {
  try {
    console.log('📋 Obteniendo todas las gestiones documentales...');
    
    const response = await apiClient.get('/Documents/');
    
    if (response.data && response.data.success) {
      const documentsData = response.data.data || [];
      console.log('✅ Gestiones documentales obtenidas:', documentsData.length);
      
      return {
        success: true,
        data: Array.isArray(documentsData) ? documentsData : [],
        message: response.data.message || 'Gestiones documentales obtenidas exitosamente',
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error al obtener gestiones documentales',
        data: [],
      };
    }
  } catch (error) {
    console.error('Get all document managements error:', error);

    let errorMessage = 'Error al obtener gestiones documentales';
    
    if (error.response) {
      errorMessage = error.response.data?.message || 'Error del servidor al obtener gestiones documentales';
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return {
      success: false,
      message: errorMessage,
      data: [],
    };
  }
};

// Función para editar/actualizar un documento de contratista
export const updateContractorDocument = async (contractorId, formData) => {
  try {
    console.log('✏️ ========== EDITANDO DOCUMENTO ==========');
    console.log('✏️ Contractor ID (correcto):', contractorId);
    console.log('✏️ FormData keys:', Object.keys(formData));

    const response = await apiClient.put(`/Documents/${contractorId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✏️ ========== RESPUESTA COMPLETA DE EDICIÓN ==========');
    console.log('✏️ Status:', response.status);
    console.log('✏️ Status Text:', response.statusText);
    console.log('✏️ Headers completos:', JSON.stringify(response.headers, null, 2));
    console.log('✏️ ⭐ DATA COMPLETA:', JSON.stringify(response.data, null, 2));
    console.log('✏️ Tipo de response.data:', typeof response.data);
    console.log('✏️ Object.keys(response.data):', Object.keys(response.data || {}));
    console.log('✏️ response.data.success:', response.data?.success);
    console.log('✏️ response.data.message:', response.data?.message);
    console.log('✏️ response.data.data:', response.data?.data);

    if (response.data && response.data.success) {
      console.log('✅ ========== DOCUMENTO EDITADO EXITOSAMENTE ==========');
      return {
        success: true,
        message: response.data.message || 'Documento actualizado correctamente',
        data: response.data.data || {},
      };
    } else {
      console.error('❌ ========== ERROR EN EDICIÓN ==========');
      console.error('❌ response.data:', response.data);
      
      return {
        success: false,
        message: response.data?.message || 'Error al actualizar documento',
        data: {},
      };
    }
  } catch (error) {
    console.error('💥 ========== ERROR AL EDITAR DOCUMENTO ==========');
    console.error('💥 Error completo:', error);
    console.error('💥 Error message:', error.message);

    let errorMessage = 'Error al actualizar documento';
    
    if (error.response) {
      console.error('💥 Error response status:', error.response.status);
      console.error('💥 Error response data:', JSON.stringify(error.response.data, null, 2));
      errorMessage = error.response.data?.message || 'Error del servidor al actualizar documento';
    } else if (error.request) {
      console.error('💥 No hubo respuesta del servidor');
      errorMessage = 'No se pudo conectar al servidor';
    }

    return {
      success: false,
      message: errorMessage,
      data: {},
    };
  }
};

export default apiClient;