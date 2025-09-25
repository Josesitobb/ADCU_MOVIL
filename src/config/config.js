// Configuración de la aplicación
export const CONFIG = {
  // URL de tu API
  API_BASE_URL: 'http://192.168.0.6:5000/api',
  
  // Configuración de la API
  API_TIMEOUT: 10000, // 10 segundos
  
  // Configuración de AsyncStorage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'userData',
  },
  
  // Endpoints de la API
  ENDPOINTS: {
    LOGIN: '/auth/signin',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    VERIFY_TOKEN: '/auth/verify',
    REFRESH_TOKEN: '/auth/refresh',
    USER_CONTRACT: '/Users', // Base endpoint, se concatena con /:id
    DOCUMENTS: '/Documents', // Base endpoint, se concatena con /:userContract
  },
};

export default CONFIG;