import apiClient from './authService';
import { CONFIG } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Función para obtener los datos del usuario y su contrato
export const getUserContractData = async (userId) => {
  try {
    const response = await apiClient.get(`/Users/${userId}`);
    
    if (response.data && response.data.success) {
      const userData = response.data.date; // Note: API uses "date" instead of "data"
      
      // Formatear los datos para que coincidan con la estructura esperada
      const formattedData = {
        success: true,
        user: {
          id: userData.user._id,
          firstName: userData.user.firsName, // Note: API uses "firsName" 
          lastName: userData.user.lastName,
          idCard: userData.user.idcard,
          telephone: userData.user.telephone,
          email: userData.user.email,
          state: userData.user.state,
          position: userData.user.post,
          role: userData.user.role,
          residentialAddress: userData.residentialAddress,
          institutionalEmail: userData.institutionalEmail,
          economicActivityNumber: userData.EconomicaActivityNumber
        },
        contract: {
          id: userData.contract._id,
          contractNumber: userData.contract.contractNumber,
          typeOfContract: userData.contract.typeofcontract,
          startDate: userData.contract.startDate,
          endDate: userData.contract.endDate,
          state: userData.contract.state,
          periodValue: parseInt(userData.contract.periodValue),
          totalValue: userData.contract.totalValue,
          objective: userData.contract.objectiveContract,
          hasExtension: userData.contract.extension,
          hasAddiction: userData.contract.addiction,
          hasSuspension: userData.contract.suspension
        }
      };

      return formattedData;
    } else {
      return {
        success: false,
        message: 'No se encontraron datos del usuario'
      };
    }
  } catch (error) {
    console.error('Error getting user contract data:', error);
    
    let errorMessage = 'Error de conexión';
    
    if (error.response) {
      switch (error.response.status) {
        case 404:
          errorMessage = 'Usuario no encontrado';
          break;
        case 403:
          errorMessage = 'No tienes permisos para acceder a esta información';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = error.response.data?.message || 'Error desconocido';
      }
    } else if (error.request) {
      errorMessage = 'No se pudo conectar al servidor';
    }

    return {
      success: false,
      message: errorMessage
    };
  }
};

// Función para obtener el ID del usuario actual desde AsyncStorage
export const getCurrentUserId = async () => {
  try {
    const userData = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
    if (userData) {
      const user = JSON.parse(userData);
      const userId = user.id || user._id || null;
      console.log('Current User ID:', userId); // Debug
      return userId;
    }
    console.log('No user data found in AsyncStorage'); // Debug
    return null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

// Función para obtener el ID del usuario contratista (necesario para documentos)
export const getUserContractId = async () => {
  try {
    console.log('🔍 Obteniendo ID del usuario contratista...'); // Debug
    
    // Primero obtener el ID del usuario desde AsyncStorage
    const userId = await getCurrentUserId();
    console.log('📝 User ID obtenido:', userId); // Debug
    
    if (!userId) {
      console.error('❌ No se encontró User ID en AsyncStorage'); // Debug
      return { success: false, message: 'No se pudo obtener el ID del usuario. Inicia sesión nuevamente.' };
    }

    // Hacer consulta a la API de usuario para obtener el _id del objeto principal
    console.log('🌐 Consultando API de usuario con ID:', userId);
    const response = await apiClient.get(`/Users/${userId}`);
    
    console.log('\n📡 ========== RESPUESTA COMPLETA DE /Users ==========');
    console.log('📊 Status:', response.status);
    console.log('📦 Data completa:', JSON.stringify(response.data, null, 2));
    console.log('🏁 =================================================\n');
    
    if (response.data && response.data.success && response.data.date) {
      const dateObject = response.data.date;
      console.log('📋 Objeto date completo:', JSON.stringify(dateObject, null, 2));
      console.log('🔍 Propiedades disponibles en date:', Object.keys(dateObject));
      
      // El userContractId es el _id del objeto principal (date._id)
      const userContractId = dateObject._id;
      console.log('✅ UserContract ID obtenido del date._id:', userContractId);
      console.log('📝 Comparación:');
      console.log('   - UserID (login):', userId);
      console.log('   - UserContractID (date._id):', userContractId);
      console.log('   - Son iguales:', userId === userContractId);
      
      // Verificar si hay un contract._id diferente
      if (dateObject.contract && dateObject.contract._id) {
        console.log('🔍 También encontrado contract._id:', dateObject.contract._id);
        console.log('📝 Contract ID vs UserContract ID:', dateObject.contract._id === userContractId);
      }
      
      return {
        success: true,
        userContractId: userContractId
      };
    } else {
      console.error('❌ No se encontró _id en la respuesta'); // Debug
      return { success: false, message: 'No se encontró el ID del contratista en la respuesta' };
    }
  } catch (error) {
    console.error('💥 Error crítico getting user contract ID:', error); // Debug
    return { success: false, message: 'Error al obtener ID del contratista: ' + error.message };
  }
};

// Función para calcular el progreso del contrato basado en las fechas
export const calculateContractProgress = (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    // Si aún no ha empezado
    if (now < start) {
      return 0;
    }
    
    // Si ya terminó
    if (now > end) {
      return 100;
    }
    
    // Calcular progreso basado en tiempo transcurrido
    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = now.getTime() - start.getTime();
    
    const progress = Math.round((elapsedDuration / totalDuration) * 100);
    return Math.max(0, Math.min(100, progress));
  } catch (error) {
    console.error('Error calculating contract progress:', error);
    return 0;
  }
};

// Función para obtener el estado del contrato basado en fechas y flags
export const getContractStatus = (contract) => {
  try {
    const now = new Date();
    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);
    
    // Verificar estados especiales primero
    if (contract.hasSuspension) {
      return 'Suspendido';
    }
    
    if (!contract.state) {
      return 'Inactivo';
    }
    
    // Estados basados en fechas
    if (now < startDate) {
      return 'Pendiente';
    } else if (now > endDate) {
      return 'Finalizado';
    } else {
      return 'En Progreso';
    }
  } catch (error) {
    console.error('Error getting contract status:', error);
    return 'Desconocido';
  }
};

// Función para formatear valores monetarios
export const formatCurrency = (amount) => {
  try {
    const numAmount = typeof amount === 'string' ? parseInt(amount) : amount;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `$${amount}`;
  }
};

// Función para formatear fechas
export const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

export default {
  getUserContractData,
  getCurrentUserId,
  calculateContractProgress,
  getContractStatus,
  formatCurrency,
  formatDate
};