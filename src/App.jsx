import React, { useState, useEffect } from 'react';
import { onAuthChange, getUserProfile } from './firebaseService';
import Dashboard from './Dashboard';
import Login from './Login';
import { ChakraProvider, Box, Text, Alert, AlertIcon, AlertDescription, Button } from '@chakra-ui/react';
import './App.css';

// Set language to English
const language = 'en';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Manejar cambios en la conexión
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setIsLoading(true);
      
      try {
        if (firebaseUser) {
          let userProfile;
          
          try {
            userProfile = await getUserProfile(firebaseUser.uid);
          } catch (profileError) {
            console.error("Error getting user profile:", profileError);
            // Try to get from localStorage if available
            const storedUserData = localStorage.getItem('userData');
            if (storedUserData) {
              const userData = JSON.parse(storedUserData);
              userProfile = userData[firebaseUser.uid];
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
        console.error("Authentication error:", err);
        setError("Error de autenticación. Por favor recarga la página.");
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

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
          <Text fontSize="2xl" mb={4}>Cargando...</Text>
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
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            onClick={() => window.location.reload()}
            colorScheme="blue"
          >
            Reintentar
          </Button>
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
          Estás en modo sin conexión. Algunos cambios no se sincronizarán hasta que vuelvas a estar en línea.
        </AlertDescription>
      </Alert>
    )
  );

  return (
    <ChakraProvider>
      <OfflineAlert />
      {user ? (
        <Dashboard initialUser={user} firebaseUser={user} />
      ) : (
        <Login />
      )}
    </ChakraProvider>
  );
}

export default App; 