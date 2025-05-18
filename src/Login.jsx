import React, { useState } from 'react';
import {
  Box, VStack, HStack, Text, Input, Button, FormControl, FormLabel,
  Heading, useToast, Divider, Flex, Image
} from "@chakra-ui/react";
import { loginUser, registerUser } from './firebaseService';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let user;
      if (isRegistering) {
        user = await registerUser(email, password);
        toast({
          title: "Cuenta creada exitosamente",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        user = await loginUser(email, password);
      }
      
      if (user) {
        onLogin(user);
      }
    } catch (error) {
      let errorMessage = "Error de autenticación";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Este correo ya está registrado";
          break;
        case 'auth/invalid-email':
          errorMessage = "Correo electrónico inválido";
          break;
        case 'auth/weak-password':
          errorMessage = "La contraseña es muy débil";
          break;
        case 'auth/user-not-found':
          errorMessage = "Usuario no encontrado";
          break;
        case 'auth/wrong-password':
          errorMessage = "Contraseña incorrecta";
          break;
        default:
          errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bgGradient="linear(to-br, #e0e7ff 0%, #fce7f3 100%)"
    >
      <Box
        bg="white"
        p={8}
        borderRadius="xl"
        boxShadow="xl"
        w={["90%", "400px"]}
      >
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading fontSize="2xl" mb={4}>
              Hubby <span style={{color:'#ec4899', fontSize:'1.3em', verticalAlign:'middle'}}>❤</span> Wifey
            </Heading>
            <HStack justify="center" spacing={8} mb={6}>
              <Image 
                src="/hubby.jpg" 
                alt="Hubby"
                boxSize="70px"
                borderRadius="full"
                border="3px solid #3b82f6"
              />
              <Image 
                src="/wifey.jpg"
                alt="Wifey"
                boxSize="70px"
                borderRadius="full"
                border="3px solid #ec4899"
              />
            </HStack>
          </Box>
          
          <form onSubmit={handleAuth}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Correo electrónico</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Contraseña</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                />
              </FormControl>
              
              <Button
                colorScheme="blue"
                width="100%"
                mt={4}
                type="submit"
                isLoading={isLoading}
              >
                {isRegistering ? "Registrarme" : "Iniciar sesión"}
              </Button>
            </VStack>
          </form>
          
          <Divider my={4} />
          
          <Box textAlign="center">
            <Text fontSize="sm">
              {isRegistering ? "¿Ya tienes una cuenta?" : "¿No tienes cuenta?"}
            </Text>
            <Button
              variant="link"
              colorScheme="blue"
              onClick={() => setIsRegistering(!isRegistering)}
              mt={1}
            >
              {isRegistering ? "Iniciar sesión" : "Registrarme"}
            </Button>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
};

export default Login;