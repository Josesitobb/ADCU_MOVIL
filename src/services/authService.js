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
      
      // Asegurar que el usuario tenga un ID válido
      const userData = {
        ...data.user,
        id: data.user.id || data.user._id // Asegurar que siempre haya un ID
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

export default apiClient;