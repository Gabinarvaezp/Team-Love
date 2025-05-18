import React, { useState, useEffect } from 'react';
import { onAuthChange, getUserProfile } from './firebaseService';
import Dashboard from './Dashboard';
import Login from './Login';
import { ChakraProvider, Box, Text, Alert, AlertIcon, AlertDescription, Button, Spinner, VStack } from '@chakra-ui/react';
import './App.css';
import { diagnoseFirebaseConnection } from './firebaseUtils';

// Set language to English
const language = 'en';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [diagnosticResults, setDiagnosticResults] = useState(null);

  // Manejar cambios en la conexión
  useEffect(() => {
    const handleOnline = () => {
      console.log('Aplicación en línea');
      setIsOffline(false);
      
      // Si tenemos un error, intentar reconectar y ejecutar diagnóstico
      if (error || !authInitialized) {
        setConnectionAttempt(prev => prev + 1);
        
        // Ejecutar diagnóstico cuando volvemos a estar online
        diagnoseFirebaseConnection().then(results => {
          setDiagnosticResults(results);
          console.log('Diagnóstico de reconexión:', results);
        });
      }
    };
    
    const handleOffline = () => {
      console.log('Aplicación fuera de línea');
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error, authInitialized]);

  // Ejecutar diagnóstico al inicio
  useEffect(() => {
    if (connectionAttempt === 0) {
      diagnoseFirebaseConnection().then(results => {
        setDiagnosticResults(results);
        console.log('Diagnóstico inicial:', results);
        
        // Si hay errores y estamos online, intentar reconectar
        if (results.errors.length > 0 && navigator.onLine) {
          console.log('Problemas detectados, intentando reconectar...');
          setTimeout(() => setConnectionAttempt(prev => prev + 1), 2000);
        }
      });
    }
  }, [connectionAttempt]);

  // Intentar cargar datos de usuario desde localStorage si estamos offline
  useEffect(() => {
    if (isOffline && !user && !authInitialized) {
      try {
        const sessionData = localStorage.getItem('user_session');
        if (sessionData) {
          const userData = JSON.parse(sessionData);
          console.log('Usando datos de usuario desde localStorage en modo offline');
          
          // Intentar obtener el perfil completo
          try {
            const storedUserData = localStorage.getItem('userData');
            if (storedUserData) {
              const profiles = JSON.parse(storedUserData);
              const userProfile = profiles[userData.uid];
              
              if (userProfile) {
                setUser({
                  ...userData,
                  ...userProfile,
                  offlineMode: true
                });
                setAuthInitialized(true);
                setIsLoading(false);
                return;
              }
            }
          } catch (e) {
            console.warn('Error obteniendo perfil en modo offline:', e);
          }
          
          // Si no hay perfil completo, usar datos básicos
          setUser({
            ...userData,
            offlineMode: true
          });
          setAuthInitialized(true);
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Error cargando datos de usuario en modo offline:', e);
      }
    }
  }, [isOffline, user, authInitialized]);

  // Auth state change handler
  useEffect(() => {
    console.log('Inicializando observador de autenticación, intento:', connectionAttempt);
    
    let authTimeout = setTimeout(() => {
      if (!authInitialized) {
        console.warn('Tiempo de espera de autenticación excedido');
        setError('Tiempo de espera excedido. Verifica tu conexión e intenta de nuevo.');
        setIsLoading(false);
        
        // Ejecutar diagnóstico para identificar el problema
        diagnoseFirebaseConnection().then(results => {
          setDiagnosticResults(results);
          console.log('Diagnóstico tras timeout:', results);
        });
      }
    }, 15000); // Reducido a 15 segundos
    
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setIsLoading(true);
      clearTimeout(authTimeout);
      
      try {
        console.log('Estado de autenticación cambiado:', firebaseUser ? 'Usuario autenticado' : 'No autenticado');
        setAuthInitialized(true);
        
        if (firebaseUser) {
          // Guardar datos básicos de usuario en localStorage para uso offline
          try {
            localStorage.setItem('user_session', JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              lastLogin: new Date().toISOString()
            }));
          } catch (e) {
            console.warn('Error guardando sesión en localStorage:', e);
          }
          
          let userProfile;
          
          try {
            userProfile = await getUserProfile(firebaseUser.uid);
            console.log('Perfil de usuario obtenido');
            
            // Guardar perfil en localStorage para uso offline
            try {
              const storedData = localStorage.getItem('userData') || '{}';
              const userData = JSON.parse(storedData);
              userData[firebaseUser.uid] = userProfile;
              localStorage.setItem('userData', JSON.stringify(userData));
            } catch (e) {
              console.warn('Error guardando perfil en localStorage:', e);
            }
          } catch (profileError) {
            console.error("Error obteniendo perfil:", profileError);
            
            // Intentar obtener desde localStorage
            try {
              const storedUserData = localStorage.getItem('userData');
              if (storedUserData) {
                const userData = JSON.parse(storedUserData);
                userProfile = userData[firebaseUser.uid];
                console.log('Usando perfil desde caché local');
              }
            } catch (cacheError) {
              console.warn('Error obteniendo perfil desde caché:', cacheError);
            }
          }

          const defaultUser = {
            userId: firebaseUser.uid, 
            email: firebaseUser.email,
            name: userProfile?.name || (firebaseUser.email?.split('@')[0] || "Usuario"),
            avatar: userProfile?.avatar || "/profile.jpg",
            currency: userProfile?.currency || "USD"
          };

          setUser(userProfile || defaultUser);
        } else {
          setUser(null);
        }
        
        setError(null);
      } catch (err) {
        console.error("Error de autenticación:", err);
        setError("Error de autenticación. Verifica tu conexión e intenta de nuevo.");
        
        // Ejecutar diagnóstico para identificar el problema
        diagnoseFirebaseConnection().then(results => {
          setDiagnosticResults(results);
          console.log('Diagnóstico tras error de auth:', results);
        });
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, [connectionAttempt]);

  // Si está cargando, mostrar un indicador
  if (isLoading) {
    return (
      <ChakraProvider>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="100vh"
          flexDirection="column"
        >
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" speed="0.65s" />
            <Text fontSize="xl">Cargando...</Text>
            {isOffline && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  Estás en modo sin conexión. Se usarán datos guardados localmente.
                </AlertDescription>
              </Alert>
            )}
          </VStack>
        </Box>
      </ChakraProvider>
    );
  }

  // Si hay error, mostrar mensaje de error
  if (error) {
    return (
      <ChakraProvider>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="100vh"
          flexDirection="column"
          p={4}
        >
          <VStack spacing={4} width="100%" maxWidth="500px">
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            {isOffline && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  Estás en modo sin conexión. Algunos datos podrían no estar disponibles.
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              colorScheme="blue" 
              onClick={() => {
                setConnectionAttempt(prev => prev + 1);
                setError(null);
                setIsLoading(true);
              }}
            >
              Reintentar
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                // Ejecutar diagnóstico manualmente
                setIsLoading(true);
                diagnoseFirebaseConnection()
                  .then(results => {
                    setDiagnosticResults(results);
                    console.log('Diagnóstico manual:', results);
                    // Mostrar resultados en la consola para facilitar la depuración
                    if (results.errors.length > 0) {
                      console.warn('Problemas detectados en la conexión Firebase:', results.errors);
                    }
                  })
                  .finally(() => setIsLoading(false));
              }}
            >
              Diagnosticar problema
            </Button>
          </VStack>
        </Box>
      </ChakraProvider>
    );
  }

  // Display de la aplicación normal
  const OfflineAlert = () => (
    isOffline && (
      <Alert status="warning" position="fixed" bottom="0" width="100%" zIndex="banner">
        <AlertIcon />
        <AlertDescription>
          Sin conexión a Internet. Los cambios se guardarán cuando vuelva la conexión.
        </AlertDescription>
      </Alert>
    )
  );

  return (
    <ChakraProvider>
      {user ? (
        <>
          <Dashboard user={user} isOffline={isOffline} />
          <OfflineAlert />
        </>
      ) : (
        <Login />
      )}
    </ChakraProvider>
  );
}

export default App; 