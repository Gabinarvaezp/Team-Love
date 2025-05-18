import React, { useState, useEffect } from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import Dashboard from './Dashboard';
import Login from './Login';
import { 
  onAuthChange, 
  getUserProfile, 
  addUserProfile, 
  saveRealTimeData, 
  subscribeToRealTimeData 
} from './firebaseService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        
        // Obtener perfil del usuario
        try {
          const profile = await getUserProfile(authUser.uid);
          if (profile) {
            setUserProfile(profile);
            
            // Sync the profile to real-time database for other devices
            saveRealTimeData(`users/${authUser.uid}/profile`, profile)
              .catch(error => {
                console.error("Error syncing profile to real-time database:", error);
              });
          } else {
            // Si no tiene perfil, creamos uno por defecto
            const defaultProfile = {
              name: authUser.email.split('@')[0],
              avatar: authUser.email.toLowerCase().includes('jorgie') ? '/hubby.jpg' : '/wifey.jpg',
              currency: authUser.email.toLowerCase().includes('jorgie') ? 'USD' : 'COP',
              savingsAccounts: [],
              debts: [],
              savings: 0,
              debtsTotal: 0,
              budget: 0,
              userId: authUser.uid
            };
            
            await addUserProfile(authUser.uid, defaultProfile);
            
            // Also save to real-time database
            saveRealTimeData(`users/${authUser.uid}/profile`, defaultProfile)
              .catch(error => {
                console.error("Error saving profile to real-time database:", error);
              });
            
            setUserProfile(defaultProfile);
          }
          
          // Subscribe to real-time updates for this user's profile
          const profileUnsubscribe = subscribeToRealTimeData(`users/${authUser.uid}/profile`, (data) => {
            if (data && data !== userProfile) {
              setUserProfile(data);
            }
          });
          
          // Clean up the subscription when the component unmounts or the user changes
          return () => profileUnsubscribe();
        } catch (error) {
          console.error("Error al cargar perfil:", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogin = (authUser) => {
    setUser(authUser);
  };

  if (loading) {
    return (
      <ChakraProvider>
        <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
          Cargando...
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      {user ? (
        <Dashboard 
          initialUser={userProfile} 
          firebaseUser={user} 
        />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </ChakraProvider>
  );
}

export default App; 