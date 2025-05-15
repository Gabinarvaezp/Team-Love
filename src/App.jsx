import React, { useState, useEffect } from "react";
import {
  ChakraProvider, Box, Flex, Text, Button, Input, Avatar, VStack, HStack, useToast, theme, Icon
} from "@chakra-ui/react";
import { FaPlaneDeparture, FaHeart, FaSuitcase, FaMapMarkedAlt } from "react-icons/fa";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import Dashboard from "./Dashboard";
import "./App.css";

// Usuarios y avatares
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

// Frases motivacionales en inglés y Spanglish
const PHRASES = [
  "One step closer to our cozy house 🏡",
  "Cada Friday is a flight más cerca de ti ✈️",
  "Together, check a check!",
  "Gracias for building this dream together 💖",
  "Un cheque más closer to our cozy house!",
];

export default function App() {
  // Carga usuario y pin guardados (si existen)
  const [selected, setSelected] = useState(() => localStorage.getItem("user") || null);
  const [pin, setPin] = useState(() => localStorage.getItem("pin") || "");
  const [logged, setLogged] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phraseIdx] = useState(Math.floor(Math.random() * PHRASES.length));
  const toast = useToast();

  // Encuentra el usuario seleccionado
  const userObj = USERS.find(u => u.key === selected);

  // Login automático si hay datos guardados
  useEffect(() => {
    if (selected && pin && !logged) {
      handleLogin();
    }
    // eslint-disable-next-line
  }, []);

  // Login con Firebase Auth
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!userObj) return;
    setLoading(true);
    setError("");
    const email = userObj.key === "hubby" ? "hubby@cozy.com" : "wifey@cozy.com";
    const password = pin.trim();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLogged(userObj.key);
      localStorage.setItem("user", userObj.key);
      localStorage.setItem("pin", pin);
      setError("");
    } catch (err) {
      setError("Incorrect PIN. Try again.");
      toast({
        title: "Login error",
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true
      });
      localStorage.removeItem("pin");
    }
    setLoading(false);
  };

  // Cambiar usuario y limpiar PIN guardado
  const handleChangeUser = (u) => {
    setSelected(u);
    setPin("");
    setError("");
    localStorage.setItem("user", u);
    localStorage.removeItem("pin");
  };

  // Landing page (login)
  if (!logged) {
    return (
      <ChakraProvider theme={theme}>
        <Box minH="100vh" bgGradient="linear(to-br, #fdf6f0, #e0e7ff 80%)" py={10}>
          <Flex direction="column" align="center" justify="center" minH="100vh">
            <HStack spacing={4} mb={6}>
              <Icon as={FaPlaneDeparture} w={10} h={10} color="blue.400" />
              <Icon as={FaHeart} w={10} h={10} color="pink.300" />
              <Icon as={FaSuitcase} w={10} h={10} color="yellow.400" />
              <Icon as={FaMapMarkedAlt} w={10} h={10} color="green.300" />
            </HStack>
            <Text fontSize={["2xl", "3xl", "4xl"]} fontWeight="bold" color="gray.700" mb={2} textAlign="center">
              Hubby & Wifey Finances
            </Text>
            <Text fontSize="lg" color="gray.500" mb={6} textAlign="center">
              Countdown to the Cozy House 🏡✈️
            </Text>
            <Box bg="white" p={8} borderRadius="2xl" boxShadow="xl" minW={["90vw", "400px"]} maxW="400px">
              <Text fontWeight="bold" color="gray.600" mb={4} textAlign="center">
                Sign in with your PIN
              </Text>
              <Flex justify="center" mb={4} gap={6}>
                {USERS.map(u => (
                  <VStack key={u.key} spacing={1}>
                    <Avatar
                      src={u.avatar}
                      size="xl"
                      border={`3px solid ${u.color}`}
                      cursor="pointer"
                      onClick={() => handleChangeUser(u.key)}
                      boxShadow={selected === u.key ? "0 0 0 4px #c7d2fe" : ""}
                    />
                    <Text fontWeight="bold" color={u.color}>{u.name}</Text>
                  </VStack>
                ))}
              </Flex>
              {selected && (
                <Box as="form" onSubmit={handleLogin}>
                  <Text fontSize="sm" color="gray.500" mb={2} textAlign="center">
                    Enter your PIN
                  </Text>
                  <HStack justify="center" mb={2}>
                    <Input
                      type="password"
                      value={pin}
                      onChange={e => setPin(e.target.value)}
                      textAlign="center"
                      fontSize="2xl"
                      w="180px"
                      borderRadius="xl"
                      bg="#f3f4f6"
                      autoFocus
                    />
                  </HStack>
                  <Button
                    colorScheme={selected === "hubby" ? "blue" : "pink"}
                    w="100%"
                    borderRadius="xl"
                    fontWeight="bold"
                    type="submit"
                    isLoading={loading}
                    isDisabled={pin.length === 0}
                  >
                    Sign in
                  </Button>
                  <Button
                    variant="ghost"
                    w="100%"
                    mt={2}
                    onClick={() => { setSelected(null); setPin(""); setError(""); }}
                  >
                    Change user
                  </Button>
                  {error && <Text color="red.400" mt={2}>{error}</Text>}
                </Box>
              )}
            </Box>
            <Box mt={8} textAlign="center">
              <Text fontSize="lg" color="gray.600" fontWeight="semibold">
                {PHRASES[phraseIdx]}
              </Text>
            </Box>
            <Box mt={8} textAlign="center">
              <Text color="gray.500" fontSize="md">
                Thanks for building this dream together despite the distance 💖
              </Text>
            </Box>
          </Flex>
        </Box>
      </ChakraProvider>
    );
  }

  // Dashboard principal
  return (
    <ChakraProvider theme={theme}>
      <Dashboard user={logged} onLogout={() => {
        setLogged(null);
        setSelected(null);
        setPin("");
        localStorage.removeItem("user");
        localStorage.removeItem("pin");
      }} />
    </ChakraProvider>
  );
}