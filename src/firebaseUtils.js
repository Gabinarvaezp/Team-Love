// Utilidades para diagnóstico y resolución de problemas de Firebase
import { db, rtdb, auth } from './firebase';
import { onValue, ref as rtdbRef, get } from 'firebase/database';
import { collection, getDocs, limit, query, getDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import config from './firebase.config';

// Función para diagnosticar problemas de conexión con Firebase
export const diagnoseFirebaseConnection = async () => {
  const results = {
    isOnline: navigator.onLine,
    authInitialized: false,
    firestoreConnected: false,
    rtdbConnected: false,
    connectionTime: Date.now(),
    configStatus: {
      projectId: config.firebase.projectId || 'no-project-id',
      databaseURL: config.firebase.databaseURL || 'no-database-url',
      authDomain: config.firebase.authDomain || 'no-auth-domain',
      storageBucket: config.firebase.storageBucket || 'no-storage-bucket'
    },
    errors: []
  };

  try {
    // Verificar autenticación
    results.authInitialized = auth !== null;

    // Intentar recuperar datos de Firestore
    if (db) {
      try {
        // Try reading a document that should always exist (or could be created)
        const systemMetadataRef = doc(db, 'system_metadata', 'connectivity_test');
        const metadataQuery = await getDoc(systemMetadataRef);
        
        // If doesn't exist, try reading any document or perform an empty query
        if (!metadataQuery.exists()) {
          const testQuery = query(collection(db, 'metadata'), limit(1));
          await getDocs(testQuery);
        }
        
        results.firestoreConnected = true;
      } catch (error) {
        results.errors.push({
          service: 'Firestore',
          error: error.message,
          code: error.code || 'unknown',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      results.errors.push({
        service: 'Firestore',
        error: 'Firestore instance is null',
        code: 'null-instance',
        timestamp: new Date().toISOString()
      });
    }

    // Intentar recuperar datos de Realtime Database
    if (rtdb) {
      try {
        // Explicitly using the URL from config to avoid reference issues
        console.log("RTDB URL for diagnosis:", config.firebase.databaseURL);
        
        // Try reading a simple path that should always be accessible
        const connectionRef = rtdbRef(rtdb, '.info/connected');
        const snapshot = await get(connectionRef);
        
        // Check if connected
        results.rtdbConnected = snapshot.exists() ? snapshot.val() : false;
        
        // Additional debug info
        console.log("RTDB Connection state:", results.rtdbConnected);
      } catch (error) {
        results.errors.push({
          service: 'RealtimeDatabase',
          error: error.message,
          code: error.code || 'unknown',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      results.errors.push({
        service: 'RealtimeDatabase',
        error: 'Realtime Database instance is null',
        code: 'null-instance',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar conectividad de autenticación
    if (auth) {
      try {
        await new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            results.authUser = user ? { uid: user.uid, email: user.email } : null;
            resolve();
          });
          
          // Timeout para no esperar indefinidamente
          setTimeout(resolve, 5000);
        });
      } catch (error) {
        results.errors.push({
          service: 'Authentication',
          error: error.message,
          code: error.code || 'unknown',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      results.errors.push({
        service: 'Authentication',
        error: 'Authentication instance is null',
        code: 'null-instance',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    results.errors.push({
      service: 'General',
      error: error.message,
      code: error.code || 'unknown',
      timestamp: new Date().toISOString()
    });
  }

  // Calcular tiempo de diagnóstico
  results.diagnosisTime = Date.now() - results.connectionTime;
  
  // Guardar resultados en localStorage para depuración
  try {
    localStorage.setItem('firebaseDiagnostics', JSON.stringify(results));
  } catch (e) {
    console.warn('No se pudo guardar diagnóstico en localStorage');
  }
  
  // Log to console for immediate feedback
  console.log('Firebase Connection Diagnostic Results:', results);

  return results;
};

// Validar la configuración de Firebase
export const validateFirebaseConfig = () => {
  const config = localStorage.getItem('firebaseConfig');
  let parsedConfig;
  
  try {
    parsedConfig = JSON.parse(config);
  } catch (e) {
    return {
      valid: false,
      error: 'No se pudo parsear la configuración'
    };
  }
  
  // Validar campos requeridos
  const requiredFields = [
    'apiKey', 
    'authDomain', 
    'projectId', 
    'storageBucket', 
    'messagingSenderId',
    'appId',
    'databaseURL'
  ];
  
  const missingFields = requiredFields.filter(field => !parsedConfig[field]);
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Faltan campos requeridos: ${missingFields.join(', ')}`,
      missingFields
    };
  }
  
  // Verificar que los dominios coincidan (previene problemas de CORS)
  const actualDomain = window.location.hostname;
  let authDomain;
  
  try {
    authDomain = new URL('https://' + parsedConfig.authDomain).hostname;
  } catch (e) {
    authDomain = '';
  }
  
  // En desarrollo local, no hacemos esta verificación
  const isLocalhost = actualDomain === 'localhost' || actualDomain === '127.0.0.1';
  const domainMismatch = !isLocalhost && authDomain !== actualDomain;
  
  if (domainMismatch) {
    return {
      valid: false,
      error: `El dominio de autenticación (${authDomain}) no coincide con el dominio actual (${actualDomain})`,
      authDomain,
      actualDomain
    };
  }
  
  // Verificar la URL de la base de datos en tiempo real
  if (!parsedConfig.databaseURL || !parsedConfig.databaseURL.includes('firebaseio.com')) {
    return {
      valid: false,
      error: `La URL de la base de datos en tiempo real no es válida: ${parsedConfig.databaseURL}`,
      databaseURL: parsedConfig.databaseURL
    };
  }
  
  // Si todo está bien
  return {
    valid: true,
    config: parsedConfig
  };
};

// Obtener el estado de conexión actual
export const getConnectionStatus = async () => {
  const networkStatus = navigator.onLine;
  let firestoreStatus = false;
  let rtdbStatus = false;
  
  // Verificar Firestore
  if (db) {
    try {
      const testQuery = query(collection(db, 'metadata'), limit(1));
      await getDocs(testQuery);
      firestoreStatus = true;
    } catch (e) {
      firestoreStatus = false;
    }
  }
  
  // Verificar RTDB
  if (rtdb) {
    try {
      const connectedRef = rtdbRef(rtdb, '.info/connected');
      const snapshot = await get(connectedRef);
      rtdbStatus = snapshot.exists() && snapshot.val() === true;
    } catch (e) {
      rtdbStatus = false;
    }
  }
  
  return {
    network: networkStatus,
    firestore: firestoreStatus,
    realtimeDb: rtdbStatus,
    timestamp: new Date().toISOString()
  };
};

// Obtener logs de errores
export const getErrorLogs = () => {
  try {
    const logs = localStorage.getItem('firebaseErrors');
    return logs ? JSON.parse(logs) : [];
  } catch (e) {
    console.warn('Error al recuperar logs de errores:', e);
    return [];
  }
};

// Limpiar logs de errores
export const clearErrorLogs = () => {
  try {
    localStorage.removeItem('firebaseErrors');
    return true;
  } catch (e) {
    console.warn('Error al limpiar logs de errores:', e);
    return false;
  }
};

// Ejecutar diagnóstico automático si hay problemas
export const initializeAutoDiagnosis = () => {
  // Escuchar a eventos de red
  window.addEventListener('online', async () => {
    console.log("Red disponible, ejecutando diagnóstico de Firebase...");
    await diagnoseFirebaseConnection();
  });
  
  // Ejecutar diagnóstico inicial después de 5 segundos
  setTimeout(async () => {
    await diagnoseFirebaseConnection();
  }, 5000);
  
  // También ejecutar cuando hay problemas de red
  window.addEventListener('error', async (event) => {
    if (event.message && (
      event.message.includes('Firebase') || 
      event.message.includes('network') ||
      event.message.includes('connection')
    )) {
      console.log("Error detectado, ejecutando diagnóstico...");
      await diagnoseFirebaseConnection();
    }
  }, { passive: true });
  
  return {
    runDiagnosis: diagnoseFirebaseConnection,
    checkConnection: getConnectionStatus
  };
};

// Exportar funciones de diagnóstico
export default {
  diagnoseFirebaseConnection,
  validateFirebaseConfig,
  getConnectionStatus,
  getErrorLogs,
  clearErrorLogs,
  initializeAutoDiagnosis
}; 