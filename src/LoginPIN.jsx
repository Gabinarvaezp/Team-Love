import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { Box, Button, Input, Select, Text, VStack, useToast, Avatar, HStack } from "@chakra-ui/react";

const USERS = [
  {
    key: "hubby",
    name: "Jorgie",
    avatar: "/hubby.jpg",
    color: "blue.500"
  },
  {
    key: "wifey",
    name: "Gabby",
    avatar: "/wifey.jpg",
    color: "pink.400"
  }
];

export default function LoginPIN({ onLogin }) {
  // Carga usuario y pin guardados (si existen)
  const [user, setUser] = useState(() => localStorage.getItem("user") || "hubby");
  const [pin, setPin] = useState(() => localStorage.getItem("pin") || "");
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    // Si ya hay usuario y pin guardados, intenta login automático
    if (user && pin) {
      handleLogin();
    }
    // eslint-disable-next-line
  }, []);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    const email = user === "hubby" ? "hubby@cozy.com" : "wifey@cozy.com";
    const password = pin.trim();
    console.log("EMAIL:", email, "PASSWORD:", password);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError("");
      // Guarda en localStorage
      localStorage.setItem("user", user);
      localStorage.setItem("pin", pin);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Incorrect PIN. Try again.");
      toast({
        title: "Login error",
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true
      });
      console.error("Firebase error:", err);
      // Limpia el pin guardado si falla
      localStorage.removeItem("pin");
    }
  };

  // Permite cambiar de usuario y limpiar el pin guardado
  const handleChangeUser = (e) => {
    setUser(e.target.value);
    setPin("");
    localStorage.setItem("user", e.target.value);
    localStorage.removeItem("pin");
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="#FFF8F3">
      <Box bg="white" p={8} borderRadius="2xl" boxShadow="lg" minW="320px">
        <VStack spacing={4}>
          <Text fontSize="2xl" fontWeight="bold" color="blue.900">Sign In</Text>
          <HStack justify="center" mb={2} gap={6}>
            {USERS.map(u => (
              <VStack key={u.key} spacing={1}>
                <Avatar
                  src={u.avatar}
                  size="xl"
                  border={`3px solid ${u.color}`}
                  cursor="pointer"
                  onClick={() => handleChangeUser({ target: { value: u.key } })}
                  boxShadow={user === u.key ? "0 0 0 4px #c7d2fe" : ""}
                />
                <Text fontWeight="bold" color={u.color}>{u.name}</Text>
              </VStack>
            ))}
          </HStack>
          <Text fontSize="sm" color="gray.500" mb={2} textAlign="center">
            Enter your PIN
          </Text>
          <Input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="Enter your PIN"
            fontSize={20}
            textAlign="center"
            autoFocus
          />
          <Button
            colorScheme="blue"
            w="100%"
            onClick={handleLogin}
            isDisabled={pin.length === 0}
          >
            Sign in
          </Button>
          <Button
            variant="ghost"
            w="100%"
            mt={2}
            onClick={() => {
              setPin("");
              localStorage.removeItem("pin");
            }}
          >
            Change user
          </Button>
          {error && <Text color="red.400">{error}</Text>}
        </VStack>
      </Box>
    </Box>
  );
}