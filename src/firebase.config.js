// Configuración centralizada de Firebase
const config = {
  // Credenciales principales
  firebase: {
    apiKey: "AIzaSyCqR8DOBCOsNsiycBvJNWd1JQKu73i7VLU",
    authDomain: "team-love-2dd83.firebaseapp.com",
    projectId: "team-love-2dd83",
    storageBucket: "team-love-2dd83.appspot.com",
    messagingSenderId: "794621460850",
    appId: "1:794621460850:web:bb9ee5132f1aa638ce9deb",
    measurementId: "G-0W56K3B12G",
    databaseURL: "https://team-love-2dd83-default-rtdb.firebaseio.com"
  },
  
  // Opciones de Firestore
  firestore: {
    cacheSizeBytes: 50000000, // ~50MB
    // Removing deprecated options
    persistence: true,
    synchronizeTabs: true,
    ignoreUndefinedProperties: true,
  },
  
  // Opciones de Autenticación
  auth: {
    persistence: true,
    languagePreference: 'es'
  },
  
  // Opciones de Base de Datos en Tiempo Real
  database: {
    persistence: true,
    url: "https://team-love-2dd83-default-rtdb.firebaseio.com"
  },
  
  // Opciones de Storage
  storage: {
    bucketUrl: "gs://team-love-2dd83.appspot.com"
  },
  
  // Opciones de conectividad
  connection: {
    timeoutMs: 30000, // 30 segundos (reducido de 60s)
    maxRetries: 3,    // Reducido de 5 para evitar esperas largas
    retryDelayMs: 3000, // 3 segundos (reducido de 5s)
    logErrors: true,
    persistErrors: true,
    autoReconnect: true
  }
};

// Verificar si estamos en ambiente de desarrollo
const isDevelopment = process.env.NODE_ENV === 'development';

// Guardar la configuración en el localStorage para diagnóstico
try {
  localStorage.setItem('firebaseConfig', JSON.stringify(config.firebase));
  // También guarda la URL específica del RTDB para facilitar la depuración
  localStorage.setItem('firebaseRTDBUrl', config.firebase.databaseURL);
} catch (e) {
  console.warn('No se pudo guardar configuración en localStorage:', e);
}

// Exponer la configuración a window para facilitar depuración en desarrollo
if (isDevelopment || true) { // Temporalmente permitir en producción para depuración
  window.__FIREBASE_CONFIG__ = config.firebase;
}

export default config; 