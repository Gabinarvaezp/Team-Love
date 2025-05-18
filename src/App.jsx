import React, { useState, useEffect } from 'react';
import { onAuthChange, getUserProfile } from './firebaseService';
import Dashboard from './Dashboard';
import Login from './Login';
import { ChakraProvider, Box, Text, Alert, AlertIcon, AlertDescription, Button, Spinner, VStack } from '@chakra-ui/react';
import './App.css';

// Set language to English
const language = 'en';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [connectionAttempt, setConnectionAttempt] = useState(0);

  // Manejar cambios en la conexión
  useEffect(() => {
    const handleOnline = () => {
      console.log('Aplicación en línea');
      setIsOffline(false);
      
      // Si tenemos un error, intentar reconectar
      if (error && !authInitialized) {
        setConnectionAttempt(prev => prev + 1);
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
      }
    }, 20000); // 20 segundos de timeout
    
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setIsLoading(true);
      clearTimeout(authTimeout);
      
      try {
        console.log('Estado de autenticación cambiado:', firebaseUser ? 'Usuario autenticado' : 'No autenticado');
        setAuthInitialized(true);
        
        if (firebaseUser) {
          let userProfile;
          
          try {
            userProfile = await getUserProfile(firebaseUser.uid);
            console.log('Perfil de usuario obtenido');
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
                  No hay conexión a internet. Verifica tu conexión e intenta de nuevo.
                </AlertDescription>
              </Alert>
            )}
            
            <Button
              onClick={() => window.location.reload()}
              colorScheme="blue"
              width="100%"
            >
              Reintentar
            </Button>
            
            {isOffline && (
              <Button
                onClick={() => {
                  try {
                    const sessionData = localStorage.getItem('user_session');
                    if (sessionData) {
                      const userData = JSON.parse(sessionData);
                      setUser({
                        ...userData,
                        offlineMode: true
                      });
                      setError(null);
                    } else {
                      alert('No hay datos guardados localmente para continuar en modo offline');
                    }
                  } catch (e) {
                    console.error('Error cargando modo offline:', e);
                    alert('Error al cargar modo offline');
                  }
                }}
                colorScheme="orange"
                width="100%"
              >
                Continuar en modo offline
              </Button>
            )}
          </VStack>
        </Box>
      </ChakraProvider>
    );
  }

  // Advertencia de modo offline
  const OfflineAlert = () => (
    isOffline && (
      <Alert status="warning" position="fixed" top="0" left="0" right="0" zIndex="1000">
        <AlertIcon />
        <AlertDescription>
          Estás en modo sin conexión. Los cambios se guardarán localmente y se sincronizarán cuando vuelvas a estar en línea.
        </AlertDescription>
      </Alert>
    )
  );

  return (
    <ChakraProvider>
      <OfflineAlert />
      {user ? (
        <Dashboard initialUser={user} firebaseUser={user} isOffline={isOffline} />
      ) : (
        <Login />
      )}
    </ChakraProvider>
  );
}

export default App; 