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