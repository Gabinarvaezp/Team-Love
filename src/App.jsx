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

// Set language to English
const language = 'en';

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
            
            // Sync to real-time database
            saveRealTimeData(`users/${authUser.uid}/profile`, profile);
          } else {
            // Create default profile if not exists
            const defaultProfile = {
              name: authUser.email.split('@')[0],
              email: authUser.email,
              uid: authUser.uid,
              language: language, // Use English by default
              createdAt: new Date().toISOString()
            };
            
            await addUserProfile(authUser.uid, defaultProfile);
            setUserProfile(defaultProfile);
            
            // Sync to real-time database
            saveRealTimeData(`users/${authUser.uid}/profile`, defaultProfile);
          }
        } catch (error) {
          console.error("Error getting user profile:", error);
        }
        
        // Subscribe to real-time data changes
        const unsubscribeRealtime = subscribeToRealTimeData(`users/${authUser.uid}`, (data) => {
          console.log("Real-time data updated:", data);
          // Update any real-time data in your app state here
        });
        
        setLoading(false);
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (authUser) => {
    setUser(authUser);
  };

  if (loading) {
    return (
      <ChakraProvider>
        <Box display="flex" alignItems="center" justifyContent="center" h="100vh">
          Loading...
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