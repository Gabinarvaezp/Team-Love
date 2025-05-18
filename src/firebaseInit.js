// Firebase initialization helper
import { app, auth, db, rtdb, storage } from './firebase';
import { initializeAutoDiagnosis, diagnoseFirebaseConnection } from './firebaseUtils';
import config from './firebase.config';

// Inicializar diagnóstico automático
const diagnosticTools = initializeAutoDiagnosis();

// Función para verificar el estado de inicialización de Firebase
const checkFirebaseInitialization = () => {
  return {
    app: !!app,
    auth: !!auth,
    db: !!db,
    rtdb: !!rtdb,
    storage: !!storage,
    config: {
      valid: !!config.firebase.databaseURL && !!config.firebase.projectId
    }
  };
};

// Ejecutar verificación inicial
const initialStatus = checkFirebaseInitialization();
console.log('Firebase Initialization Status:', initialStatus);

// Si hay algún problema, ejecutar diagnóstico completo
if (!initialStatus.app || !initialStatus.db || !initialStatus.rtdb) {
  console.warn('Firebase initialization incomplete, running diagnostics...');
  diagnoseFirebaseConnection().then(results => {
    console.log('Diagnostic results:', results);
    
    // Si hay errores, registrarlos
    if (results.errors.length > 0) {
      try {
        // Registrar errores para análisis posterior
        const storedErrors = JSON.parse(localStorage.getItem('firebaseErrors') || '[]');
        localStorage.setItem('firebaseErrors', JSON.stringify([
          ...storedErrors,
          {
            timestamp: new Date().toISOString(),
            errors: results.errors
          }
        ].slice(-20))); // Mantener solo los últimos 20 errores
      } catch (e) {
        console.warn('Error storing diagnostic results:', e);
      }
    }
  });
}

// Monitorear cambios de red
let previousOnlineStatus = navigator.onLine;
window.addEventListener('online', () => {
  if (!previousOnlineStatus) {
    // Si cambiamos de offline a online, verificar la conexión
    console.log('Network connection restored, checking Firebase connections...');
    previousOnlineStatus = true;
    
    // Esperar un momento para que la red se estabilice
    setTimeout(() => {
      diagnoseFirebaseConnection();
    }, 2000);
  }
});

window.addEventListener('offline', () => {
  previousOnlineStatus = false;
  console.log('Network connection lost, Firebase operations will be queued for reconnection');
});

// Exportar herramientas de diagnóstico y funciones auxiliares
export {
  checkFirebaseInitialization,
  diagnoseFirebaseConnection,
  initialStatus
}; 