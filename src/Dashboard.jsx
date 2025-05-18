// Dashboard.jsx - Version móvil mejorada
import React, { useState, useEffect } from "react";
import {
  Box, Flex, Avatar, Text, Button, HStack, VStack, Divider, IconButton, 
  Tooltip, useBreakpointValue, useToast, Modal, ModalOverlay, 
  ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, 
  Switch, Tabs, TabList, TabPanels, Tab, TabPanel, Popover, 
  PopoverTrigger, PopoverContent, PopoverArrow, PopoverBody,
  Progress, Stat, StatLabel, StatNumber, StatHelpText, StatArrow,
  Badge, Heading, SimpleGrid, FormControl, FormLabel, RadioGroup,
  Radio, Stack
} from "@chakra-ui/react";
import {
  FaPlus, FaMinus, FaHistory, FaDownload, FaTrash, FaUser,
  FaHome, FaExclamationTriangle, FaChartLine, FaUsers,
  FaArrowUp, FaArrowDown, FaPiggyBank, FaCreditCard, FaCalendarAlt,
  FaInfoCircle, FaCheckCircle, FaExchangeAlt, FaSync
} from "react-icons/fa";
import { 
  PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend 
} from "recharts";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from 'framer-motion';

// Constants
const COP_TO_USD = 0.00025; // 4000 COP = 1 USD aproximadamente
const USD_TO_COP = 4000; // 1 USD = 4000 COP aproximadamente
const COLORS = ["#3182ce", "#38a169", "#ecc94b", "#ed8936", "#e53e3e", "#805ad5", "#319795", "#718096"];
const CATEGORIES = [
  "Food", 
  "Cooper", 
  "Wifey", 
  "Hubby",
  "Golf",
  "Car Wash", 
  "Travel", 
  "Family", 
  "Public Transport", 
  "Housing", 
  "Beer", 
  "Snacks", 
  "Health", 
  "Entertainment/Friends", 
  "Shopping", 
  "Other"
];
const PAYMENT_METHODS = ["Debit", "Credit", "Cash", "Other"];
const INCOME_SOURCES = ["First Check", "Second Check", "Both", "Other"];
const GOAL_TYPES = ["Short Term", "Medium Term", "Long Term"];
const MOTIVATIONAL_QUOTES = [
  "One step closer to our cozy house 🏡",
  "Every Friday is a flight closer to you ✈️",
  "Let's go together, paycheck by paycheck!",
  "Thanks for building this cozy house together💖",
];
// Utility functions
function convertToUSD(amount, currency) {
  // Asegurar que amount sea un número
  if (typeof amount !== "number") {
    amount = Number(amount) || 0;
  }
  
  // Realizar la conversión apropiada
  if (currency === "USD") {
    return amount;
  } else if (currency === "COP") {
    return amount * COP_TO_USD; // Multiplicamos por la tasa (1 COP = 0.00025 USD)
  }
  
  // Por defecto, devolver el monto sin cambios
  return amount;
}

function convertToCOP(amount, currency) {
  // Asegurar que amount sea un número
  if (typeof amount !== "number") {
    amount = Number(amount) || 0;
  }
  
  // Realizar la conversión apropiada
  if (currency === "COP") {
    return amount;
  } else if (currency === "USD") {
    return amount * USD_TO_COP; // Multiplicamos por la tasa (1 USD = 4000 COP)
  }
  
  // Por defecto, devolver el monto sin cambios
  return amount;
}

function getMonthYear(dateStr) {
  if (!dateStr) return { month: 0, year: 0 };
  const parts = dateStr.split(/[-\/]/);
  if (parts.length !== 3) {
    return { month: 0, year: 0 };
  }
  if (parts[0].length === 4) {
    return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) - 1 };
  }
  return { year: parseInt(parts[2], 10), month: parseInt(parts[0], 10) - 1 };
}

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatNumber(num, currency) {
  if (typeof num !== "number") num = Number(num) || 0;
  return currency === "COP" 
    ? num.toLocaleString("es-CO", { maximumFractionDigits: 0 }) 
    : num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export default function Dashboard() {
  // All useState hooks at the top level
  const [activeScreen, setActiveScreen] = useState("login"); // login, dashboard, together
  const [activeUser, setActiveUser] = useState(null);
  // Agregar un estado para controlar si está cargando
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem("userData");
    return saved ? JSON.parse(saved) : {
      jorgie: {
        name: "Jorgie",
        avatar: "/hubby.jpg",
        currency: "USD",
        savingsAccounts: [],
        debts: [],
        savings: 0,
        debtsTotal: 0,
        budget: 0,
      },
      gabby: {
        name: "Gabby",
        avatar: "/wifey.jpg",
        currency: "COP",
        savingsAccounts: [],
        debts: [],
        savings: 0,
        debtsTotal: 0,
        budget: 0,
      }
    };
  });
  
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("history");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem("goals");
    return saved ? JSON.parse(saved) : {
      coupleGoal: {
        name: "Cozy House",
        amount: 30000,
        currency: "USD",
        startDate: "2023-01-01",
        targetDate: "2025-01-01",
        progress: 0
      }
    };
  });
    // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [addTab, setAddTab] = useState(0);
  const [motivational, setMotivational] = useState("");
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [notification, setNotification] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showManageAccountsModal, setShowManageAccountsModal] = useState(false);

  // Form data
  const [addData, setAddData] = useState({
    amount: "",
    currency: "USD",
    category: "",
    subcategory: "",
    paymentMethod: PAYMENT_METHODS[0],
    source: INCOME_SOURCES[0],
    date: todayStr(),
    debtName: "",
    debtTotal: "",
    debtCurrency: "USD",
    debtMonthly: "",
    debtSource: INCOME_SOURCES[0],
    debtDate: "",
    savingWhere: "",
    savingAmount: "",
    savingCurrency: "USD",
    savingDate: "",
    isAutomatic: false, // Estado general (para compatibilidad)
    isIncomeAutomatic: false, // Nuevo estado para Income
    isDebtAutomatic: false, // Nuevo estado para Debt
    isSavingAutomatic: false, // Nuevo estado para Savings
    checkSource: "First Check",
    monthlySavings: ""
  });
  
  const [pendingUser, setPendingUser] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [settingsName, setSettingsName] = useState("");
  const [settingsAvatar, setSettingsAvatar] = useState("");
  const [settingsCurrency, setSettingsCurrency] = useState("");
  const [settingsBudget, setSettingsBudget] = useState("");
    // Persistence effects
  useEffect(() => {
    localStorage.setItem("userData", JSON.stringify(userData));
  }, [userData]);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("goals", JSON.stringify(goals));
  }, [goals]);
  
  // Agregar un efecto para cargar datos actualizados al iniciar la aplicación
  useEffect(() => {
    // Función para cargar datos
    const loadData = () => {
      try {
        // Cargar datos de localStorage
        const savedUserData = localStorage.getItem("userData");
        const savedHistory = localStorage.getItem("history");
        const savedGoals = localStorage.getItem("goals");
        
        if (savedUserData) {
          setUserData(JSON.parse(savedUserData));
        }
        
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
        }
        
        if (savedGoals) {
          setGoals(JSON.parse(savedGoals));
        }
      } catch (error) {
        console.error("Error loading data from localStorage:", error);
      }
    };
    
    // Agregar un event listener para detectar cambios en localStorage de otras pestañas
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Este efecto solo se ejecuta una vez al montar el componente

  // Añadir este nuevo efecto después de los otros useEffect
useEffect(() => {
  if (activeScreen === "together") {
    // Desactivamos el código que está causando el bucle infinito
    // const newCombinedFinancials = calculateCombinedFinancials();
    // setUserData({...userData}); <- Esta línea está causando el bucle infinito
    
    // Siempre mostrar en dólares en la pantalla Together
    setDisplayCurrency("USD");
  }
}, [activeScreen]); // Eliminamos la dependencia de userData para evitar el bucle infinito
  
  // Other effects
  useEffect(() => {
    if (activeScreen === "dashboard") {
      const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
      setMotivational(MOTIVATIONAL_QUOTES[idx]);
    }
  }, [activeScreen]);

  useEffect(() => {
    if (showSettingsModal && activeUser) {
      const user = userData[activeUser];
      if (user) {
        setSettingsName(user.name || "");
        setSettingsAvatar(user.avatar || "");
        setSettingsCurrency(user.currency || "USD");
        setSettingsBudget(user.budget || "");
      }
    }
  }, [showSettingsModal, activeUser, userData]);

  // Derived state
  const toast = useToast();
  const currentUser = activeUser ? userData[activeUser] : null;
    const GABBY_COLORS = {
    cardBg: '#F9E3E0',
    accent: '#E7B6A1',
    button1: '#E7B6A1',
    button2: '#D18B5F',
    button3: '#C97A3A',
    text: '#B85A2B',
  };
  
  const JORGIE_COLORS = {
    cardBg: '#E6EFF4',
    accent: '#A7B8C9',
    button1: '#A7B8C9',
    button2: '#5B8B99',
    button3: '#3B6B7A',
    text: '#3B6B7A',
  };
  
  const palette = currentUser?.name === 'Gabby' ? GABBY_COLORS 
                : currentUser?.name === 'Jorgie' ? JORGIE_COLORS 
                : null;
  
  const userHistory = history.filter(h => h.user === activeUser);
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const monthHistory = userHistory.filter(h => {
    const { month, year } = getMonthYear(h.date);
    return month === thisMonth && year === thisYear;
  });

  // Function to convert amount to display currency
  function toDisplayCurrency(amount, currency) {
    if (typeof amount !== 'number') amount = Number(amount) || 0;
    
    // Si amount ya está en la moneda de visualización, devolverlo sin cambios
    if (currency === displayCurrency) return amount;
    
    if (displayCurrency === "USD") {
      // Convertir cualquier no-USD a USD
      return convertToUSD(amount, currency);
    } else {
      // Queremos mostrar en COP
      return convertToCOP(amount, currency);
    }
  }

  // Financial summary
  const totalIncome = monthHistory
    .filter(h => h.type === "Income")
    .reduce((acc, h) => acc + toDisplayCurrency(h.amount, h.currency), 0);
    
  const totalExpenses = monthHistory
    .filter(h => h.type === "Expense")
    .reduce((acc, h) => acc + toDisplayCurrency(h.amount, h.currency), 0);
    
  const balance = totalIncome - totalExpenses;
  
  // This will now just use the user's savings field directly which is more reliable
  // than trying to recalculate from history
  const netSavings = toDisplayCurrency(currentUser?.savings || 0, currentUser?.currency || "USD");
    
  const budget = currentUser?.budget || 0;
    // Calculate combined financial data for both users
 const calculateCombinedFinancials = () => {
  // Para evitar valores NaN y asegurar valores numéricos
  let totalCombinedSavings = 0;
  let totalCombinedIncome = 0;
  let totalCombinedExpenses = 0;
  
  // Calculate for Jorgie
  if (userData.jorgie) {
    // Asegurar que los ahorros de Jorgie estén en USD
    totalCombinedSavings += Number(userData.jorgie.savings) || 0;
    
    const jorgieHistory = history.filter(h => h.user === "jorgie");
    
    // Convertir todos los ingresos a USD
    const jorgieIncome = jorgieHistory
      .filter(h => h.type === "Income")
      .reduce((acc, h) => {
        const amountUSD = convertToUSD(Number(h.amount) || 0, h.currency);
        return acc + amountUSD;
      }, 0);
    
    // Convertir todos los gastos a USD
    const jorgieExpenses = jorgieHistory
      .filter(h => h.type === "Expense")
      .reduce((acc, h) => {
        const amountUSD = convertToUSD(Number(h.amount) || 0, h.currency);
        return acc + amountUSD;
      }, 0);
    
    totalCombinedIncome += jorgieIncome;
    totalCombinedExpenses += jorgieExpenses;
  }
  
  // Calculate for Gabby
  if (userData.gabby) {
    // Convertir los ahorros de Gabby en COP a USD para el total combinado
    totalCombinedSavings += convertToUSD(Number(userData.gabby.savings) || 0, "COP");
    
    const gabbyHistory = history.filter(h => h.user === "gabby");
    
    // Convertir todos los ingresos a USD
    const gabbyIncome = gabbyHistory
      .filter(h => h.type === "Income")
      .reduce((acc, h) => {
        const amountUSD = convertToUSD(Number(h.amount) || 0, h.currency);
        return acc + amountUSD;
      }, 0);
    
    // Convertir todos los gastos a USD
    const gabbyExpenses = gabbyHistory
      .filter(h => h.type === "Expense")
      .reduce((acc, h) => {
        const amountUSD = convertToUSD(Number(h.amount) || 0, h.currency);
        return acc + amountUSD;
      }, 0);
    
    totalCombinedIncome += gabbyIncome;
    totalCombinedExpenses += gabbyExpenses;
  }
  
  // Asegurar valores no negativos y evitar NaN
  totalCombinedSavings = Math.max(0, totalCombinedSavings || 0);
  totalCombinedIncome = Math.max(0, totalCombinedIncome || 0);
  totalCombinedExpenses = Math.max(0, totalCombinedExpenses || 0);
  
  return {
    savings: totalCombinedSavings,
    income: totalCombinedIncome,
    expenses: totalCombinedExpenses,
    balance: totalCombinedIncome - totalCombinedExpenses
  };
};
  
  // Cambiamos de constante a estado
  const [combinedFinancials, setCombinedFinancials] = useState({
    savings: 0,
    income: 0,
    expenses: 0,
    balance: 0
  });
  
  // Recalculamos solo cuando cambia el historial o se cambia de pantalla
  useEffect(() => {
    // Si es la pantalla Together o hay cambios en el historial
    if (activeScreen === "together" || history.length > 0) {
      try {
        // Calcular datos financieros combinados
        const newFinancials = calculateCombinedFinancials();
        setCombinedFinancials(newFinancials);
        
        // Si estamos en la pantalla Together, actualizar también timeEstimate
        if (activeScreen === "together") {
          const estimate = calculateEstimatedTime();
          setTimeEstimate(estimate);
        }
      } catch (error) {
        console.error("Error al actualizar datos combinados:", error);
      }
    }
  }, [history, activeScreen, userData]); // Añadir userData como dependencia

  // Calculate progress towards goal
const goalProgress = goals && goals.coupleGoal && goals.coupleGoal.amount
  ? Math.min(100, (combinedFinancials.savings / goals.coupleGoal.amount) * 100) 
  : Math.min(100, (combinedFinancials.savings / 30000) * 100);
    
// Move timeToGoal calculation to state
const [timeEstimate, setTimeEstimate] = useState({ 
  months: 0, 
  years: 0, 
  remainingMonths: 0 
});

// Add useEffect to safely calculate time estimate
  useEffect(() => {
  if (combinedFinancials && activeScreen === "together") {
    const estimate = calculateEstimatedTime();
    setTimeEstimate(estimate);
  }
}, [combinedFinancials.savings, goals, history, activeScreen]);

// Calculate estimated months to reach goal
const calculateEstimatedTime = () => {
  // Primero verificar si hay datos de transacciones
  if (history.length === 0) {
    // Si no hay historial, usamos un valor fijo mensual de $1,200 USD
    const defaultMonthlyContribution = 1200; // USD por mes
    const goalAmount = goals && goals.coupleGoal && goals.coupleGoal.amount ? goals.coupleGoal.amount : 30000;
    const remainingAmount = Math.max(0, goalAmount - combinedFinancials.savings);
    
    if (remainingAmount <= 0) return { months: 0, years: 0, remainingMonths: 0 };
    
    const totalMonths = Math.ceil(remainingAmount / defaultMonthlyContribution);
    
    return {
      months: totalMonths,
      years: Math.floor(totalMonths / 12),
      remainingMonths: totalMonths % 12
    };
  }
  
  // Check if goals or goals.coupleGoal exists
  if (!goals || !goals.coupleGoal) {
    // Usar un valor predeterminado de 30000 para los cálculos
    const defaultGoalAmount = 30000;
    const remainingAmount = Math.max(0, defaultGoalAmount - combinedFinancials.savings);
    
    if (remainingAmount <= 0) return { months: 0, years: 0, remainingMonths: 0 };
    
    // Calcular tasa de ahorro mensual como en el caso normal
    const monthlySavingsRateJorgie = history
      .filter(h => h.user === "jorgie" && h.type === "Income")
      .reduce((acc, h) => acc + convertToUSD(h.amount, h.currency), 0) -
      history
      .filter(h => h.user === "jorgie" && h.type === "Expense")
      .reduce((acc, h) => acc + convertToUSD(h.amount, h.currency), 0);
      
    const monthlySavingsRateGabby = history
      .filter(h => h.user === "gabby" && h.type === "Income")
      .reduce((acc, h) => acc + convertToUSD(h.amount, h.currency), 0) -
      history
      .filter(h => h.user === "gabby" && h.type === "Expense")
      .reduce((acc, h) => acc + convertToUSD(h.amount, h.currency), 0);
      
    // Verificar si hay suficientes datos para un cálculo significativo
    if (monthlySavingsRateJorgie === 0 && monthlySavingsRateGabby === 0) {
      // Si no hay suficientes datos, usar un valor fijo mensual
      const defaultMonthlyContribution = 1200; // USD por mes
      const totalMonths = Math.ceil(remainingAmount / defaultMonthlyContribution);
      
      return {
        months: totalMonths,
        years: Math.floor(totalMonths / 12),
        remainingMonths: totalMonths % 12
      };
    }
    
    const combinedMonthlySavings = Math.max(1200, monthlySavingsRateJorgie + monthlySavingsRateGabby);
    
    // Si los ahorros mensuales son solo el valor mínimo, usar el valor fijo
    if (combinedMonthlySavings <= 100) {
      const defaultMonthlyContribution = 1200; // USD por mes
      const totalMonths = Math.ceil(remainingAmount / defaultMonthlyContribution);
      
      return {
        months: totalMonths,
        years: Math.floor(totalMonths / 12),
        remainingMonths: totalMonths % 12
      };
    }
    
    const totalMonths = Math.ceil(remainingAmount / combinedMonthlySavings);
    
    return {
      months: totalMonths,
      years: Math.floor(totalMonths / 12),
      remainingMonths: totalMonths % 12
    };
  }
  
  // El resto de la función sigue igual
  const monthlySavingsRateJorgie = history
    .filter(h => h.user === "jorgie" && h.type === "Income")
    .reduce((acc, h) => acc + convertToUSD(h.amount, h.currency), 0) -
    history
    .filter(h => h.user === "jorgie" && h.type === "Expense")
    .reduce((acc, h) => acc + convertToUSD(h.amount, h.currency), 0);
    
  const monthlySavingsRateGabby = history
    .filter(h => h.user === "gabby" && h.type === "Income")
    .reduce((acc, h) => acc + convertToUSD(h.amount, h.currency), 0) -
    history
    .filter(h => h.user === "gabby" && h.type === "Expense")
    .reduce((acc, h) => acc + convertToUSD(h.amount, h.currency), 0);
    
  // Verificar si hay suficientes datos para un cálculo significativo
  if (monthlySavingsRateJorgie === 0 && monthlySavingsRateGabby === 0) {
    return { months: 0, years: 0, remainingMonths: 0 };
  }
  
  const combinedMonthlySavings = monthlySavingsRateJorgie + monthlySavingsRateGabby;
  
  if (combinedMonthlySavings <= 0) {
    // Si los ahorros mensuales no son positivos, usar valor fijo
    const defaultMonthlyContribution = 1200; // USD por mes
    const totalMonths = Math.ceil(remainingAmount / defaultMonthlyContribution);
    
    return {
      months: totalMonths,
      years: Math.floor(totalMonths / 12),
      remainingMonths: totalMonths % 12
    };
  }
  
  // Make sure goals.coupleGoal.amount exists and is a number
  const goalAmount = typeof goals.coupleGoal.amount === 'number' ? goals.coupleGoal.amount : 0;
  const remainingAmount = goalAmount - combinedFinancials.savings;
  
  if (remainingAmount <= 0) return { months: 0, years: 0, remainingMonths: 0 };
  
  const totalMonths = Math.ceil(remainingAmount / combinedMonthlySavings);
  
  return {
    months: totalMonths,
    years: Math.floor(totalMonths / 12),
    remainingMonths: totalMonths % 12
  };
};
  
  // Function to generate monthly data for the chart
  function getMonthlyData() {
    const monthlyData = [];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Process both users' history
    const allHistory = [...history];
    
    // Group by month
    const monthGroups = {};
    
    allHistory.forEach(item => {
      const { month, year } = getMonthYear(item.date);
      
      // Only include current year
      if (year !== currentYear) return;
      
      const monthKey = `${year}-${month}`;
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = {
          month: monthNames[month],
          monthIndex: month,
          income: 0,
          expenses: 0,
          savings: 0
        };
      }
      
      // Convert to display currency
      const amount = toDisplayCurrency(item.amount, item.currency);
      
      if (item.type === "Income") {
        monthGroups[monthKey].income += amount;
      } else if (item.type === "Expense") {
        monthGroups[monthKey].expenses += amount;
      } else if (item.type === "Savings") {
        monthGroups[monthKey].savings += amount;
      }
    });
        // Convert to array and sort by month
    Object.values(monthGroups)
      .sort((a, b) => a.monthIndex - b.monthIndex)
      .forEach(data => {
        // Calculate savings as income - expenses if not explicitly tracked
        if (data.savings === 0) {
          data.savings = Math.max(0, data.income - data.expenses);
        }
        
        // Push a copy without the monthIndex used for sorting
        const { monthIndex, ...dataWithoutIndex } = data;
        monthlyData.push(dataWithoutIndex);
      });
    
    // If there's no data, provide some sample data for visualization
    if (monthlyData.length === 0) {
      const now = new Date();
      const currentMonth = now.getMonth();
      
      for (let i = 0; i < 6; i++) {
        const monthIndex = (currentMonth - 5 + i) >= 0 ? 
          (currentMonth - 5 + i) : 
          (currentMonth - 5 + i + 12);
          
        monthlyData.push({
          month: monthNames[monthIndex],
          income: 0,
          expenses: 0,
          savings: 0
        });
      }
    }
    
    return monthlyData;
  }
  
  // Budget notification
  useEffect(() => {
    if (budget > 0 && totalExpenses > budget) {
      setNotification("You have exceeded your monthly budget!");
    } else {
      setNotification(null);
    }
  }, [budget, totalExpenses]);
    // Event handlers
  function handleDeleteMovement(idx) {
  const item = userHistory[idx];
  if (!item) return;
  
  // Find the index in the original history
  const historyIndex = history.findIndex(h => h.user === activeUser && h === item);
  if (historyIndex === -1) return;
  
  // Create a new copy of the array
  const newHistory = [...history];
  newHistory.splice(historyIndex, 1);

  // Recalculate savings for both users in their respective currencies
  // For Jorgie (USD)
  let jorgieHistory = newHistory.filter(h => h.user === "jorgie");
  let jorgieTotalUSD = 0;
  
  jorgieHistory.forEach(h => {
    // Convert all amounts to USD since Jorgie uses USD
    const amountInUSD = convertToUSD(h.amount, h.currency);
    
    if (h.type === "Income" || h.type === "Savings") {
      jorgieTotalUSD += amountInUSD;
    } else if (h.type === "Expense") {
      jorgieTotalUSD -= amountInUSD;
    }
  });
  
  // For Gabby (COP)
  let gabbyHistory = newHistory.filter(h => h.user === "gabby");
  let gabbyTotalCOP = 0;
  
  gabbyHistory.forEach(h => {
    // Calculate the amount in COP
    let amountInCOP;
    if (h.currency === "COP") {
      amountInCOP = h.amount;
    } else { // Si es USD
      amountInCOP = convertToCOP(h.amount, "USD");
    }
    
    if (h.type === "Income" || h.type === "Savings") {
      gabbyTotalCOP += amountInCOP;
    } else if (h.type === "Expense") {
      gabbyTotalCOP -= amountInCOP;
    }
  });
  
  // Ensure the values are not negative
  jorgieTotalUSD = Math.max(0, jorgieTotalUSD);
  gabbyTotalCOP = Math.max(0, gabbyTotalCOP);
  
  // Update history and totals for both users
  setHistory(newHistory);
  setUserData(prev => ({
    ...prev,
    jorgie: {
      ...prev.jorgie,
      savings: jorgieTotalUSD
    },
    gabby: {
      ...prev.gabby, 
      savings: gabbyTotalCOP
    }
  }));
  
  toast({ 
    title: "Movement deleted",
    status: "success",
    duration: 3000,
    isClosable: true,
  });
}

  function handleExportExcel() {
    const rows = userHistory.map((item, idx) => ({
      ID: idx + 1,
      Type: item.type,
      Amount: formatNumber(item.amount, item.currency),
      Currency: item.currency,
      Category: item.category || "",
      Date: item.date,
      Description: item.subcategory || "",
      AutoSaving: item.isAutomatic ? "Yes" : "No",
      Source: item.source || "",
    }));
    
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");
    XLSX.writeFile(wb, `history_${activeUser}.xlsx`);
    
    toast({
      title: "Exported successfully",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }
    function handleSaveSettings() {
    setUserData(prev => ({
      ...prev,
      [activeUser]: {
        ...prev[activeUser],
        name: settingsName,
        avatar: settingsAvatar,
        currency: settingsCurrency,
        budget: Number(settingsBudget)
      }
    }));
    
    setShowSettingsModal(false);
    
    toast({ 
      title: "Settings saved!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }

  function handleResetAll() {
    localStorage.clear();
    window.location.reload();
  }

  function handleProfileClick(user) {
    setPendingUser(user);
    setPasswordInput("");
    setPasswordError("");
    setShowPasswordModal(true);
  }
  
  function handlePasswordSubmit() {
    if (passwordInput === "0325") {
    setActiveUser(pendingUser);
      setActiveScreen("dashboard");
      setShowPasswordModal(false);
    setPasswordError("");
    
    // Establecer la moneda de visualización según el usuario
    setDisplayCurrency(pendingUser === "jorgie" ? "USD" : "COP");
    
    // Reset addData with the correct currency
    setAddData(prev => ({
      ...prev,
      currency: userData[pendingUser]?.currency || "USD",
    }));
    } else {
      setPasswordError("Incorrect password. Try again.");
    }
}
    function handleAddTransaction() {
  if (addTab === 0) {
    // Expense
    if (!addData.amount || !addData.category) {
      toast({
        title: "Please fill required fields",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const amount = Number(addData.amount);
    const movement = {
      amount: amount,
      currency: addData.currency,
      category: addData.category,
      subcategory: addData.subcategory,
      paymentMethod: addData.paymentMethod,
      date: addData.date || todayStr(),
      type: "Expense",
      user: activeUser
    };
    
    setHistory(prev => [movement, ...prev]);
    
    // Update user data with the expense
    setUserData(prev => {
      // Convert expense to user's currency
      const userCurrency = prev[activeUser].currency || "USD";
      let amountInUserCurrency = amount;
      
      if (addData.currency !== userCurrency) {
        if (userCurrency === "USD") {
          amountInUserCurrency = convertToUSD(amount, addData.currency);
        } else {
          // Convert to COP
          amountInUserCurrency = convertToCOP(amount, "USD");
        }
      }
      
      return {
        ...prev,
        [activeUser]: {
          ...prev[activeUser],
          savings: Math.max(0, (prev[activeUser].savings || 0) - amountInUserCurrency)
        }
      };
    });
    
    toast({
      title: "Expense added!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  } else if (addTab === 1) {
    // Income
    if (!addData.amount) {
      toast({
        title: "Please fill required fields",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const amount = Number(addData.amount);
    const movement = {
      amount: amount,
      currency: addData.currency,
      source: addData.source,
      category: addData.source,
      date: addData.date || todayStr(),
      type: "Income",
      user: activeUser,
      subcategory: addData.source === "Other" ? addData.subcategory : ""
    };
    
    setHistory(prev => [movement, ...prev]);
    
    // Update user data with the income
    setUserData(prev => {
      // Convert income to user's currency
      const userCurrency = prev[activeUser].currency || "USD";
      let amountInUserCurrency = amount;
      
      if (addData.currency !== userCurrency) {
        if (userCurrency === "USD") {
          amountInUserCurrency = convertToUSD(amount, addData.currency);
        } else {
          // Convert to COP
          amountInUserCurrency = convertToCOP(amount, "USD");
        }
      }
      
      return {
        ...prev,
        [activeUser]: {
          ...prev[activeUser],
          savings: (prev[activeUser].savings || 0) + amountInUserCurrency
        }
      };
    });
    
    toast({
      title: "Income added!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  } else if (addTab === 2) {
    // Debt
    if (!addData.debtName || !addData.debtTotal) {
      toast({
        title: "Please fill required fields",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const amount = Number(addData.debtTotal);
    
    // Agregar a la estructura de datos de usuario
    setUserData(prev => {
      // Convert debt to user's currency
      const userCurrency = prev[activeUser].currency || "USD";
      let amountInUserCurrency = amount;
      
      if (addData.debtCurrency !== userCurrency) {
        if (userCurrency === "USD") {
          amountInUserCurrency = convertToUSD(amount, addData.debtCurrency);
        } else {
          // Convert to COP
          amountInUserCurrency = convertToCOP(amount, addData.debtCurrency);
        }
      }
      
      return {
        ...prev,
        [activeUser]: {
          ...prev[activeUser],
          debts: [
            ...(prev[activeUser].debts || []),
            {
              name: addData.debtName,
              total: amount,
              currency: addData.debtCurrency || "USD",
              monthlyPayment: Number(addData.debtMonthly) || 0,
              source: addData.debtSource || INCOME_SOURCES[0],
              date: todayStr(),
              isAutomatic: addData.isDebtAutomatic,
              checkSource: addData.checkSource
            }
          ],
          debtsTotal: (prev[activeUser].debtsTotal || 0) + amountInUserCurrency
        }
      };
    });
    
    // Crear un registro en el historial para el debt
    const debtMovement = {
      amount: amount,
      currency: addData.debtCurrency || "USD",
      category: "Debt",
      subcategory: addData.debtName,
      date: todayStr(),
      type: "Debt",
      user: activeUser,
      isAutomatic: addData.isDebtAutomatic,
      checkSource: addData.checkSource,
      monthlyPayment: Number(addData.debtMonthly) || 0
    };
    
    setHistory(prev => [debtMovement, ...prev]);
    
    toast({
      title: "Debt added!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  } else if (addTab === 3) {
    // Savings Account
    if (!addData.savingWhere || !addData.savingAmount) {
      toast({
        title: "Please fill required fields",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const amount = Number(addData.savingAmount);
    // Update user data with the savings
    setUserData(prev => {
      // Convert savings to user's currency
      const userCurrency = prev[activeUser].currency || "USD";
      let amountInUserCurrency = amount;
      
      if (addData.savingCurrency !== userCurrency) {
        if (userCurrency === "USD") {
          amountInUserCurrency = convertToUSD(amount, addData.savingCurrency);
        } else {
          // Convert to COP - este es el caso importante
          amountInUserCurrency = convertToCOP(amount, addData.savingCurrency);
        }
      }
      
      return {
        ...prev,
        [activeUser]: {
          ...prev[activeUser],
          savingsAccounts: [
            ...(prev[activeUser].savingsAccounts || []),
            {
              where: addData.savingWhere,
              amount: amount,
              currency: addData.savingCurrency || "USD",
              date: todayStr(),
              monthlySavings: Number(addData.monthlySavings) || 0,
              isAutomatic: addData.isSavingAutomatic,
              checkSource: addData.checkSource
            }
          ],
          savings: (prev[activeUser].savings || 0) + amountInUserCurrency
        }
      };
    });
    
    // Create history record
    const savingMovement = {
      amount: amount,
      currency: addData.savingCurrency || "USD",
      category: "Savings",
      subcategory: addData.savingWhere,
      date: todayStr(),
      type: "Savings",
      user: activeUser,
      isAutomatic: addData.isSavingAutomatic,
      checkSource: addData.checkSource,
      monthlySavings: Number(addData.monthlySavings) || 0
    };
    
    setHistory(prev => [savingMovement, ...prev]);
    
    toast({
      title: "Savings account added!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }
  
  // Reset form and close modal
  setShowAddModal(false);
  setAddData({
    amount: "",
    currency: currentUser?.currency || "USD",
    category: "",
    subcategory: "",
    paymentMethod: PAYMENT_METHODS[0],
    source: INCOME_SOURCES[0],
    date: todayStr(),
    debtName: "",
    debtTotal: "",
    debtCurrency: "USD",
    debtMonthly: "",
    debtSource: INCOME_SOURCES[0],
    savingWhere: "",
    savingAmount: "",
    savingCurrency: "USD",
    isAutomatic: false,
    isIncomeAutomatic: false,
    isDebtAutomatic: false,
    isSavingAutomatic: false,
    checkSource: "First Check",
    monthlySavings: ""
  });
}
    // Render
    return (
    <Box minH="100vh" bg="#f7f7fa" pb="80px">
      {/* Login screen */}
      {activeScreen === "login" && (
      <Flex minH="100vh" align="center" justify="center" bgGradient="linear(to-br, #e0e7ff 0%, #fce7f3 100%)">
        <Box>
          <Text fontSize="2xl" fontWeight="bold" mb={4} textAlign="center">
            Hubby <span style={{color:'#ec4899', fontSize:'1.3em', verticalAlign:'middle'}}>❤</span> Wifey Finances
          </Text>
          <Box textAlign="center" fontSize="3xl" mb={10}>
            <span role="img" aria-label="house">🏡</span>
            <span style={{margin: '0 16px'}}></span>
            <span role="img" aria-label="plane">✈️</span>
          </Box>
          <Flex gap={8} justify="center">
            <Button
              p={8}
              borderRadius="2xl"
              bg="white"
              boxShadow="xl"
              _hover={{ bg: "blue.50", transform: "scale(1.05)" }}
                onClick={() => handleProfileClick("jorgie")}
              transition="all 0.2s"
            >
              <VStack>
                <Avatar size="2xl" src="/hubby.jpg" border="4px solid #3b82f6" />
                <Text fontWeight="bold" fontSize="xl" color="#2563eb">Jorgie</Text>
              </VStack>
            </Button>
            <Button
              p={8}
              borderRadius="2xl"
              bg="white"
              boxShadow="xl"
              _hover={{ bg: "pink.50", transform: "scale(1.05)" }}
                onClick={() => handleProfileClick("gabby")}
              transition="all 0.2s"
            >
              <VStack>
                <Avatar size="2xl" src="/wifey.jpg" border="4px solid #ec4899" />
                <Text fontWeight="bold" fontSize="xl" color="#ec4899">Gabby</Text>
              </VStack>
            </Button>
          </Flex>
        </Box>
        </Flex>
      )}
        
        {/* Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} isCentered>
          <ModalOverlay />
        <ModalContent borderRadius="xl">
            <ModalHeader>Enter Password</ModalHeader>
            <ModalBody>
              <Input
                type="password"
              placeholder="Password"
                value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
              />
            {passwordError && (
              <Text color="red.500" mt={2} fontSize="sm">{passwordError}</Text>
            )}
            </ModalBody>
            <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handlePasswordSubmit}>
              Submit
            </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      
      {/* Confirm Reset Modal */}
      <Modal isOpen={showConfirmReset} onClose={() => setShowConfirmReset(false)} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>Confirm Reset</ModalHeader>
          <ModalBody>
            <Text>
              Are you sure you want to reset all data? This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowConfirmReset(false)}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleResetAll}>
              Reset All Data
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
            {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} size={{base: "full", md: "md"}}>
        <ModalOverlay />
        <ModalContent borderRadius={{base: "0", md: "xl"}} bg={palette?.cardBg || "#fff"} maxW="100%" maxH="100vh" overflowY="auto">
         <ModalHeader display="flex" alignItems="center" bg={palette?.button3 || "#4299E1"} color="white" borderTopRadius={{base: "0", md: "xl"}} p={4}>
  <Avatar 
    size="sm" 
    src={currentUser?.avatar} 
    mr={3}
    border="2px solid white"
  />
  <Text fontWeight="bold">Add New Movement</Text>
</ModalHeader>
          <ModalBody pb={6}>
            <Tabs isFitted onChange={(idx) => setAddTab(idx)} index={addTab}>
              <TabList mb={4}>
                <Tab fontSize={{base: "sm", md: "md"}} py={2}>Expense</Tab>
                <Tab fontSize={{base: "sm", md: "md"}} py={2}>Income</Tab>
                <Tab fontSize={{base: "sm", md: "md"}} py={2}>Debt</Tab>
                <Tab fontSize={{base: "sm", md: "md"}} py={2}>Savings</Tab>
              </TabList>
              <TabPanels>
                {/* Expense Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Amount</FormLabel>
                      <HStack>
                        <Input
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  placeholder="Amount"
  value={addData.amount ? Number(addData.amount).toLocaleString() : ""}
  onChange={(e) => {
    // Eliminar comas y caracteres no numéricos
    const numericValue = e.target.value.replace(/[^0-9]/g, "");
    setAddData({ ...addData, amount: numericValue });
  }}
  min="0"
/>
                        <Select
                          width="100px"
                          value={addData.currency}
                          onChange={(e) => setAddData({ ...addData, currency: e.target.value })}
                        >
                          <option value="USD">USD</option>
                          <option value="COP">COP</option>
                        </Select>
                      </HStack>
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>Category</FormLabel>
                      <Select
                        placeholder="Select category"
                        value={addData.category}
                        onChange={(e) => setAddData({ ...addData, category: e.target.value })}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Description (optional)</FormLabel>
                      <Input
                        placeholder="Description"
                        value={addData.subcategory}
                        onChange={(e) => setAddData({ ...addData, subcategory: e.target.value })}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        value={addData.paymentMethod}
                        onChange={(e) => setAddData({ ...addData, paymentMethod: e.target.value })}
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Date</FormLabel>
                      <Input
                        type="date"
                        value={addData.date}
                        onChange={(e) => setAddData({ ...addData, date: e.target.value })}
                      />
                    </FormControl>
                  </VStack>
                </TabPanel>
                
                {/* Income Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Amount</FormLabel>
                      <HStack>
                        <Input
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  placeholder="Amount"
  value={addData.amount ? Number(addData.amount).toLocaleString() : ""}
  onChange={(e) => {
    // Eliminar comas y caracteres no numéricos
    const numericValue = e.target.value.replace(/[^0-9]/g, "");
    setAddData({ ...addData, amount: numericValue });
  }}
  min="0"
/>
                        <Select
                          width="100px"
                          value={addData.currency}
                          onChange={(e) => setAddData({ ...addData, currency: e.target.value })}
                        >
                          <option value="USD">USD</option>
                          <option value="COP">COP</option>
                        </Select>
                      </HStack>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Source</FormLabel>
                      <Select
                        value={addData.source}
                        onChange={(e) => setAddData({ ...addData, source: e.target.value })}
                      >
                        {INCOME_SOURCES.map((source) => (
                          <option key={source} value={source}>{source}</option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {addData.source === "Other" && (
                      <FormControl>
                        <FormLabel>Description</FormLabel>
                        <Input
                          placeholder="Description"
                          value={addData.subcategory}
                          onChange={(e) => setAddData({ ...addData, subcategory: e.target.value })}
                        />
                      </FormControl>
                    )}
                    
                    <FormControl>
                      <FormLabel>Date</FormLabel>
                      <Input
                        type="date"
                        value={addData.date}
                        onChange={(e) => setAddData({ ...addData, date: e.target.value })}
                      />
                    </FormControl>
                    
                    {/* Se eliminó la opción de pago automático para ingresos */}
                  </VStack>
                </TabPanel>
                
                
                                    {/* Debt Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Debt Name</FormLabel>
                      <Input
                        placeholder="Name"
                        value={addData.debtName}
                        onChange={(e) => setAddData({ ...addData, debtName: e.target.value })}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
  <FormLabel>Total Amount</FormLabel>
  <HStack>
    <Input
      type="tel"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder="Amount"
      value={addData.debtTotal ? Number(addData.debtTotal).toLocaleString() : ""}
      onChange={(e) => {
        // Eliminar comas y caracteres no numéricos
        const numericValue = e.target.value.replace(/[^0-9]/g, "");
        setAddData({ ...addData, debtTotal: numericValue });
      }}
      min="0"
    />
    <Select
      width="100px"
      value={addData.debtCurrency}
      onChange={(e) => setAddData({ ...addData, debtCurrency: e.target.value })}
    >
      <option value="USD">USD</option>
      <option value="COP">COP</option>
    </Select>
  </HStack>
</FormControl>
                    
                    <FormControl>
                      <FormLabel>Monthly Payment</FormLabel>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Monthly Payment"
                        value={addData.debtMonthly ? Number(addData.debtMonthly).toLocaleString() : ""}
                        onChange={(e) => {
                          // Eliminar comas y caracteres no numéricos
                          const numericValue = e.target.value.replace(/[^0-9]/g, "");
                          setAddData({ ...addData, debtMonthly: numericValue });
                        }}
                        min="0"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Source</FormLabel>
                      <Select
                        value={addData.debtSource}
                        onChange={(e) => setAddData({ ...addData, debtSource: e.target.value })}
                      >
                        {INCOME_SOURCES.map((source) => (
                          <option key={source} value={source}>{source}</option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">
                        Automatic Payment
                      </FormLabel>
                      <Switch
                        isChecked={addData.isDebtAutomatic}
                        onChange={(e) => setAddData({ 
                          ...addData, 
                          isDebtAutomatic: e.target.checked,
                          isAutomatic: e.target.checked // Mantener compatibilidad
                        })}
                      />
                    </FormControl>
                    
                    {addData.isDebtAutomatic && (
                      <FormControl>
                        <FormLabel>Check Source</FormLabel>
                        <RadioGroup
                          value={addData.checkSource}
                          onChange={(value) => setAddData({ ...addData, checkSource: value })}
                        >
                          <Stack direction="row" spacing={5}>
                            <Radio value="First Check">First Check</Radio>
                            <Radio value="Second Check">Second Check</Radio>
                            <Radio value="Both">Both</Radio>
                          </Stack>
                        </RadioGroup>
                      </FormControl>
                    )}
                  </VStack>
                </TabPanel>
                
                {/* Savings Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Where</FormLabel>
                      <Input
                        placeholder="Bank or Account"
                        value={addData.savingWhere}
                        onChange={(e) => setAddData({ ...addData, savingWhere: e.target.value })}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
  <FormLabel>Total Amount</FormLabel>
  <HStack>
    <Input
      type="tel"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder="Amount"
      value={addData.savingAmount ? Number(addData.savingAmount).toLocaleString() : ""}
      onChange={(e) => {
        // Eliminar comas y caracteres no numéricos
        const numericValue = e.target.value.replace(/[^0-9]/g, "");
        setAddData({ ...addData, savingAmount: numericValue });
      }}
      min="0"
    />
    <Select
      width="100px"
      value={addData.savingCurrency}
      onChange={(e) => setAddData({ ...addData, savingCurrency: e.target.value })}
    >
      <option value="USD">USD</option>
      <option value="COP">COP</option>
    </Select>
  </HStack>
</FormControl>
                    
                    <FormControl>
                      <FormLabel>Monthly Savings</FormLabel>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Monthly Amount"
                        value={addData.monthlySavings ? Number(addData.monthlySavings).toLocaleString() : ""}
                        onChange={(e) => {
                          // Eliminar comas y caracteres no numéricos
                          const numericValue = e.target.value.replace(/[^0-9]/g, "");
                          setAddData({ ...addData, monthlySavings: numericValue });
                        }}
                        min="0"
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">
                        Automatic Savings
                      </FormLabel>
                      <Switch
                        isChecked={addData.isSavingAutomatic}
                        onChange={(e) => setAddData({ 
                          ...addData, 
                          isSavingAutomatic: e.target.checked,
                          isAutomatic: e.target.checked // Mantener compatibilidad
                        })}
                      />
                    </FormControl>
                    
                    {addData.isSavingAutomatic && (
                      <FormControl>
                        <FormLabel>Check Source</FormLabel>
                        <RadioGroup
                          value={addData.checkSource}
                          onChange={(value) => setAddData({ ...addData, checkSource: value })}
                        >
                          <Stack direction="row" spacing={5}>
                            <Radio value="First Check">First Check</Radio>
                            <Radio value="Second Check">Second Check</Radio>
                            <Radio value="Both">Both</Radio>
                          </Stack>
                        </RadioGroup>
                      </FormControl>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleAddTransaction}>
              Add
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Settings Modal */}
      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>Settings</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  placeholder="Name"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Avatar URL</FormLabel>
                <Input
                  placeholder="Avatar URL"
                  value={settingsAvatar}
                  onChange={(e) => setSettingsAvatar(e.target.value)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Default Currency</FormLabel>
                <Select
                  value={settingsCurrency}
                  onChange={(e) => setSettingsCurrency(e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="COP">COP</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Monthly Budget</FormLabel>
                <Input
                  type="number"
                  placeholder="Monthly Budget"
                  value={settingsBudget}
                  onChange={(e) => setSettingsBudget(e.target.value)}
                />
              </FormControl>
              
              <Divider my={2} />
              
              <Button 
                colorScheme="red" 
                variant="outline" 
                leftIcon={<FaExclamationTriangle />}
                onClick={() => setShowConfirmReset(true)}
              >
                Reset All Data
              </Button>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowSettingsModal(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveSettings}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* History Modal */}
      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} size="xl">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>Transaction History</ModalHeader>
          <ModalBody>
            <HStack justify="space-between" mb={4}>
              <Text fontWeight="bold">Total: {userHistory.length} transactions</Text>
              <Button 
                size="sm" 
                leftIcon={<FaDownload />} 
                onClick={handleExportExcel}
                colorScheme="blue"
              >
                Export to Excel
              </Button>
          </HStack>
            
            {userHistory.length === 0 ? (
              <Box p={4} textAlign="center" color="gray.500">
                <Text>No movements recorded yet</Text>
                <Text fontSize="sm">Add your first movement using the Add button</Text>
        </Box>
            ) : (
              <Box maxH="400px" overflowY="auto">
                {userHistory.map((item, idx) => (
                  <Box key={idx} p={3} borderRadius="lg" bg="gray.50" mb={2}>
                    <HStack justify="space-between">
                      <HStack>
                        <Box 
                          borderRadius="full" 
                          bg={item.type === "Income" ? "green.100" : "red.100"} 
                          color={item.type === "Income" ? "green.700" : "red.700"} 
                          p={2}
                        >
                          {item.type === "Income" ? <FaPlus /> : <FaMinus />}
                        </Box>
                        <VStack align="start" spacing={0}>
  <Text fontWeight="medium">
    {item.category || (item.type === "Income" ? "Income" : "Expense")}
  </Text>
  <HStack>
    <Text fontSize="sm" color="gray.500">
      {item.date}
    </Text>
    {item.subcategory && (
      <Text fontSize="sm" color="gray.500">
        - {item.subcategory}
      </Text>
    )}
  </HStack>
  
  {/* AÑADIR AQUÍ el código para monthly payments */}
  {item.type === "Debt" && item.monthlyPayment > 0 && (
    <Text fontSize="xs" color="orange.600">
      Monthly: {item.currency === "USD" ? "$" : "COL$"}{formatNumber(item.monthlyPayment, item.currency)}
    </Text>
  )}
  {item.type === "Savings" && item.monthlySavings > 0 && (
    <Text fontSize="xs" color="blue.600">
      Monthly: {item.currency === "USD" ? "$" : "COL$"}{formatNumber(item.monthlySavings, item.currency)}
    </Text>
  )}
</VStack>
                      </HStack>
                      <HStack>
                        <Text fontWeight="bold" color={item.type === "Income" ? "green.500" : "red.500"}>
                          {item.type === "Income" ? "+" : "-"}{item.currency === "USD" ? "$" : "COL$"}
                          {formatNumber(item.amount, item.currency)}
                        </Text>
                        <IconButton
                          aria-label="Delete movement"
                          icon={<FaTrash />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDeleteMovement(idx)}
                        />
                      </HStack>
                    </HStack>
                  </Box>
                ))}
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShowHistoryModal(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Dashboard */}
      {activeScreen === "dashboard" && currentUser && (
        <Box>
          {/* Header - MODIFICADO: Centrado */}
<Box px={4} pt={8} pb={4} textAlign="center">
  <VStack spacing={1}>
    <Text fontWeight="bold" fontSize="3xl" color="#222" letterSpacing={0.5}>
      Personal Finance Dashboard
    </Text>
              <Text fontSize="lg" color="#666">Welcome, {currentUser.name}!</Text>
          
          {/* Botón para alternar moneda */}
          <HStack spacing={2} mt={2} justify="center">
            <Button 
              size="sm" 
              colorScheme={displayCurrency === "USD" ? "blue" : "orange"}
              variant="outline"
              leftIcon={displayCurrency === "USD" ? <span>$</span> : <span>COL$</span>}
              onClick={() => setDisplayCurrency(prev => prev === "USD" ? "COP" : "USD")}
            >
              {displayCurrency === "USD" ? "Show in COP" : "Show in USD"}
            </Button>
            
            <IconButton
              aria-label="Recargar datos"
              icon={<FaSync />}
              size="sm"
              colorScheme="green"
              variant="outline"
              onClick={() => {
                try {
                  setIsLoading(true);
                  
                  // Recargar datos de localStorage
                  const savedUserData = localStorage.getItem("userData");
                  const savedHistory = localStorage.getItem("history");
                  const savedGoals = localStorage.getItem("goals");
                  
                  if (savedUserData) {
                    setUserData(JSON.parse(savedUserData));
                  }
                  
                  if (savedHistory) {
                    setHistory(JSON.parse(savedHistory));
                  }
                  
                  if (savedGoals) {
                    setGoals(JSON.parse(savedGoals));
                  }
                  
                  // Calcular datos financieros combinados
                  const newFinancials = calculateCombinedFinancials();
                  setCombinedFinancials(newFinancials);
                  
                  toast({
                    title: "Datos actualizados",
                    status: "success",
                    duration: 2000,
                    isClosable: true,
                  });
                } catch (error) {
                  console.error("Error al recargar datos:", error);
                  toast({
                    title: "Error al actualizar",
                    status: "error",
                    duration: 2000,
                    isClosable: true,
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              isDisabled={isLoading}
            />
          </HStack>
  </VStack>
</Box>

          {/* Notification */}
          {notification && (
            <Box bg="red.100" color="red.700" p={3} borderRadius="xl" mx={4} mb={2} display="flex" alignItems="center">
              <FaExclamationTriangle style={{ marginRight: 8 }} />
              <Text fontWeight="bold">{notification}</Text>
            </Box>
          )}
          
          {/* Enhanced Financial Summary - MODIFICADO: Simplificado, sin foto de perfil */}
        <Box 
          mx="auto" 
          mt={4} 
          mb={4} 
            maxW="400px"
          borderRadius="2xl" 
          boxShadow="xl" 
          p={6} 
            bg={palette?.cardBg || '#fff'}
            position="relative"
            overflow="hidden"
          >
<Heading size="md" textAlign="center" mb={3} color={palette?.text || '#222'}>
  Financial Summary
          </Heading>
          
{/* Añadir foto de perfil aquí */}
<Box textAlign="center" mb={3}>
  <Avatar 
    size="2xl" 
    src={currentUser.avatar} 
    border="3px solid" 
    borderColor={palette?.button2 || '#D18B5F'}
  />
</Box>
            {/* Decorative header strip */}
            <Box 
              position="absolute" 
              top="0" 
              left="0" 
              right="0" 
              height="8px" 
              bg={palette?.button3 || '#C97A3A'} 
            />

            <Box 
              p={4} 
              borderRadius="xl" 
              bg="white" 
              boxShadow="sm" 
              mb={4}
              borderLeft="4px solid"
              borderLeftColor={palette?.button2 || '#D18B5F'}
            >
              <Heading size="md" textAlign="center" mb={3} color={palette?.text || '#222'}>
                Financial Summary
              </Heading>
              
              {/* Esta es la sección donde están los valores numéricos */}
<VStack spacing={3} align="stretch">
  <HStack justify="space-between" p={2} bg="gray.50" borderRadius="md">
    <Text fontWeight="medium" color={palette?.text || '#222'}>Total Income</Text>
    <Text fontWeight="bold" color={palette?.button2 || 'green.600'} fontSize="md">
      {displayCurrency === "USD" ? "$" : "COL$"}{formatNumber(totalIncome, displayCurrency)}
    </Text>
  </HStack>
  
  <HStack justify="space-between" p={2} bg="gray.50" borderRadius="md">
    <Text fontWeight="medium" color={palette?.text || '#222'}>Total Expenses</Text>
    <Text fontWeight="bold" color={palette?.button3 || 'blue.600'} fontSize="md">
      {displayCurrency === "USD" ? "$" : "COL$"}{formatNumber(totalExpenses, displayCurrency)}
    </Text>
  </HStack>
  
  <HStack justify="space-between" p={2} bg="gray.50" borderRadius="md">
    <Text fontWeight="medium" color={palette?.text || '#222'}>Balance</Text>
    <Text
      fontWeight="extrabold"
      color={balance >= 0 ? (palette?.button2 || 'green.600') : (palette?.button1 || 'red.600')}
      fontSize="md"
    >
      {displayCurrency === "USD" ? "$" : "COL$"}{formatNumber(balance, displayCurrency)}
    </Text>
  </HStack>
  
  <HStack justify="space-between" p={2} bg="gray.50" borderRadius="md">
    <Text fontWeight="medium" color={palette?.text || '#222'}>Savings</Text>
    <Text fontWeight="extrabold" color={palette?.button3 || 'blue.600'} fontSize="md">
      {displayCurrency === "USD" ? "$" : "COL$"}{formatNumber(netSavings, displayCurrency)}
    </Text>
  </HStack>
</VStack>
        </Box>
        
            {/* Add Movement Button */}
<Button
  leftIcon={<FaExchangeAlt />}
  bg={palette?.button3 || '#C97A3A'}
  color="#fff"
  fontWeight="bold"
  fontSize="lg"
  borderRadius="xl"
  px={8}
  py={6}
  boxShadow="md"
  _hover={{ bg: palette?.button2 || '#D18B5F', transform: "translateY(-2px)" }}
  transition="all 0.2s"
  onClick={() => {
    setAddTab(0);
    setShowAddModal(true);
  }}
  width="100%"
  mb={3} /* Añadir este margen */
>
  Add Movement
</Button>

{/* Botón para Manage Savings & Debts */}
<Button
  leftIcon={<FaPiggyBank />}
  bg="white"
  color={palette?.text || "#444"}
  border="1px solid"
  borderColor={palette?.button3 || '#C97A3A'}
  fontWeight="bold"
  fontSize="md"
  borderRadius="xl"
  px={6}
  py={5}
  boxShadow="sm"
  _hover={{ bg: "gray.50", transform: "translateY(-2px)" }}
  transition="all 0.2s"
  onClick={() => setShowManageAccountsModal(true)}
  width="100%"
>
  Manage Savings & Debts
</Button>
            {/* History Modal */}
<Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} size="xl">
  {/* ... contenido del modal ... */}
</Modal>
          </Box>
          {/* Manage Accounts Modal */}
<Modal isOpen={showManageAccountsModal} onClose={() => setShowManageAccountsModal(false)} size="lg">
  <ModalOverlay />
  <ModalContent borderRadius="xl">
    <ModalHeader>Manage Accounts</ModalHeader>
    <ModalBody>
      <Tabs isFitted>
        <TabList mb={4}>
          <Tab>Savings</Tab>
          <Tab>Debts</Tab>
        </TabList>
        <TabPanels>
          {/* Savings Tab */}
          <TabPanel>
            <Box maxH="400px" overflowY="auto">
              {currentUser && (currentUser.savingsAccounts || []).length === 0 ? (
                <Box p={4} textAlign="center" color="gray.500">
                  <Text>No savings accounts added yet</Text>
                  <Text fontSize="sm">Add your first savings account using the Add button</Text>
                </Box>
              ) : (
                <VStack spacing={3} align="stretch">
                  {currentUser && (currentUser.savingsAccounts || []).map((account, idx) => (
                    <Box 
                      key={idx} 
                      p={4} 
                      borderRadius="lg" 
                      bg="blue.50" 
                      borderLeft="4px solid" 
                      borderLeftColor="blue.500"
                    >
            <HStack justify="space-between" mb={2}>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">{account.where}</Text>
                          <Text fontSize="sm" color="gray.600">{account.date}</Text>
                        </VStack>
                        <Text fontWeight="bold" color="blue.600">
                          {account.currency === "USD" ? "$" : "COL$"}
                          {formatNumber(account.amount, account.currency)}
                        </Text>
            </HStack>
            
                      {account.monthlySavings > 0 && (
                        <HStack justify="space-between" fontSize="sm">
                          <Text color="blue.600">Monthly Contribution:</Text>
                          <Text fontWeight="medium">
                            {account.currency === "USD" ? "$" : "COL$"}
                            {formatNumber(account.monthlySavings, account.currency)}
                          </Text>
            </HStack>
                      )}
                      
                      <Divider my={2} />
                      
                      <HStack justify="flex-end">
                        <Button 
                          size="sm" 
                          colorScheme="red" 
                          variant="ghost" 
                          leftIcon={<FaTrash />}
                          onClick={() => {
                            // Remover de savingsAccounts
                            setUserData(prev => {
                              const newSavingsAccounts = [...(prev[activeUser].savingsAccounts || [])];
                              newSavingsAccounts.splice(idx, 1);
                              
                              // Recalcular el total de savings 
                              const newTotal = newSavingsAccounts.reduce(
                                (sum, acc) => sum + toDisplayCurrency(acc.amount, acc.currency), 
                                0
                              );
                              
                              return {
                                ...prev,
                                [activeUser]: {
                                  ...prev[activeUser],
                                  savingsAccounts: newSavingsAccounts,
                                  savings: newTotal
                                }
                              };
                            });
                            
                            // Remover del historial si existe
                            setHistory(prev => 
                              prev.filter(item => 
                                !(item.user === activeUser && 
                                  item.type === "Savings" && 
                                  item.subcategory === account.where &&
                                  item.date === account.date)
                              )
                            );
                            
                            toast({
                              title: "Savings account deleted",
                              status: "success",
                              duration: 3000,
                              isClosable: true,
                            });
                          }}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </TabPanel>
          
          {/* Debts Tab */}
          <TabPanel>
            <Box maxH="400px" overflowY="auto">
              {currentUser && (currentUser.debts || []).length === 0 ? (
                <Box p={4} textAlign="center" color="gray.500">
                  <Text>No debts added yet</Text>
                  <Text fontSize="sm">Add your first debt using the Add button</Text>
                </Box>
              ) : (
                <VStack spacing={3} align="stretch">
                  {currentUser && (currentUser.debts || []).map((debt, idx) => (
                    <Box 
                      key={idx} 
                      p={4} 
                      borderRadius="lg" 
                      bg="orange.50" 
                      borderLeft="4px solid" 
                      borderLeftColor="orange.500"
                    >
            <HStack justify="space-between" mb={2}>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">{debt.name}</Text>
                          <Text fontSize="sm" color="gray.600">{debt.date}</Text>
                        </VStack>
                        <Text fontWeight="bold" color="orange.600">
                          {debt.currency === "USD" ? "$" : "COL$"}
                          {formatNumber(debt.total, debt.currency)}
                        </Text>
            </HStack>
            
                      {debt.monthlyPayment > 0 && (
                        <HStack justify="space-between" fontSize="sm">
                          <Text color="orange.600">Monthly Payment:</Text>
                          <Text fontWeight="medium">
                            {debt.currency === "USD" ? "$" : "COL$"}
                            {formatNumber(debt.monthlyPayment, debt.currency)}
              </Text>
                        </HStack>
                      )}
                      
                      <HStack justify="space-between" fontSize="sm" mt={1}>
                        <Text color="gray.600">Payment Source:</Text>
                        <Badge colorScheme="purple">{debt.source}</Badge>
                      </HStack>
                      
                      <Divider my={2} />
                      
                      <HStack justify="flex-end">
                        <Button 
                          size="sm" 
                          colorScheme="red" 
                          variant="ghost" 
                          leftIcon={<FaTrash />}
                          onClick={() => {
                            // Remover de debts
                            setUserData(prev => {
                              const newDebts = [...(prev[activeUser].debts || [])];
                              newDebts.splice(idx, 1);
                              
                              // Recalcular el total de debts
                              const newTotal = newDebts.reduce(
                                (sum, d) => sum + toDisplayCurrency(d.total, d.currency), 
                                0
                              );
                              
                              return {
                                ...prev,
                                [activeUser]: {
                                  ...prev[activeUser],
                                  debts: newDebts,
                                  debtsTotal: newTotal
                                }
                              };
                            });
                            
                            // Remover del historial si existe
                            setHistory(prev => 
                              prev.filter(item => 
                                !(item.user === activeUser && 
                                  item.type === "Debt" && 
                                  item.subcategory === debt.name &&
                                  item.date === debt.date)
                              )
                            );
                            
                            toast({
                              title: "Debt deleted",
                              status: "success",
                              duration: 3000,
                              isClosable: true,
                            });
                          }}
                        >
                          Delete
                        </Button>
                      </HStack>
            </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </ModalBody>
    <ModalFooter>
      <Button onClick={() => setShowManageAccountsModal(false)}>Close</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
          {/* Pie Chart */}
          <Box mx="auto" mb={4} maxW="400px" borderRadius="2xl" boxShadow="md" p={4} bg="#fff">
            <Text fontWeight="bold" mb={2} textAlign="center">Income vs Expenses</Text>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Income", value: totalIncome },
                    { name: "Expenses", value: totalExpenses }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#38a169" />
                  <Cell fill="#e53e3e" />
                </Pie>
                <PieTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
          
          {/* Movements Table - MODIFICADO: Sin botón Together */}
          <Box mx="auto" mb={4} maxW="600px" borderRadius="2xl" boxShadow="md" p={4} bg="#fff">
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="bold" textAlign="center">Movements</Text>
              <Button size="sm" leftIcon={<FaDownload />} onClick={handleExportExcel}>Export</Button>
            </HStack>
            
            {userHistory.length === 0 ? (
              <Box p={4} textAlign="center" color="gray.500">
                <Text>No movements recorded yet</Text>
                <Text fontSize="sm">Add your first movement using the button above</Text>
              </Box>
            ) : (
              <Box maxH="300px" overflowY="auto" pr={2}>
                {userHistory.slice(0, 5).map((item, idx) => (
                  <Box key={idx} p={3} borderRadius="lg" bg="gray.50" mb={2}>
            <HStack justify="space-between">
                      <HStack>
                        <Box 
  borderRadius="full" 
  bg={
    item.type === "Income" ? "green.100" : 
    item.type === "Expense" ? "red.100" : 
    item.type === "Savings" ? "blue.100" : 
    item.type === "Debt" ? "orange.100" : "gray.100"
  } 
  color={
    item.type === "Income" ? "green.700" : 
    item.type === "Expense" ? "red.700" : 
    item.type === "Savings" ? "blue.700" : 
    item.type === "Debt" ? "orange.700" : "gray.700"
  } 
  p={2}
>
  {item.type === "Income" ? <FaPlus /> : 
   item.type === "Expense" ? <FaMinus /> : 
   item.type === "Savings" ? <FaPiggyBank /> : 
   item.type === "Debt" ? <FaCreditCard /> : <FaExchangeAlt />}
          </Box>
                        <VStack align="start" spacing={0}>
  <Text fontWeight="medium" fontSize="sm">
    {item.category || (item.type === "Income" ? "Income" : "Expense")}
  </Text>
  <Text fontSize="xs" color="gray.500">
    {item.date}
  </Text>
  
  {/* AÑADIR AQUÍ el código para monthly payments */}
  {item.type === "Debt" && item.monthlyPayment > 0 && (
    <Text fontSize="xs" color="orange.600">
      Monthly: {item.currency === "USD" ? "$" : "COL$"}{formatNumber(item.monthlyPayment, item.currency)}
    </Text>
  )}
  {item.type === "Savings" && item.monthlySavings > 0 && (
    <Text fontSize="xs" color="blue.600">
      Monthly: {item.currency === "USD" ? "$" : "COL$"}{formatNumber(item.monthlySavings, item.currency)}
              </Text>
  )}
</VStack>
                      </HStack>
                      <HStack>
                        <Text 
  fontWeight="bold" 
  color={
    item.type === "Income" ? "green.500" : 
    item.type === "Expense" ? "red.500" : 
    item.type === "Savings" ? "blue.500" : 
    item.type === "Debt" ? "orange.500" : "gray.500"
  }
>
  {item.type === "Income" || item.type === "Savings" ? "+" : "-"}
  {item.currency === "USD" ? "$" : "COL$"}
  {formatNumber(item.amount, item.currency)}
              </Text>
                        <IconButton
                          aria-label="Delete movement"
                          icon={<FaTrash />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDeleteMovement(idx)}
                        />
                      </HStack>
            </HStack>
          </Box>
                ))}
        </Box>
            )}
        
            {userHistory.length > 5 && (
            <Button
              variant="ghost"
                size="sm" 
                mt={2} 
                width="100%"
                onClick={() => setShowHistoryModal(true)}
              >
                View all ({userHistory.length})
              </Button>
            )}
          </Box>
          
          {/* Bottom navigation - MODIFICADO: Together en lugar de History y Logout en lugar de Settings */}
          <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            borderTopWidth="1px"
            borderTopColor="gray.200"
            p={2}
            bg="white"
            zIndex={10}
          >
            <HStack spacing={0} justify="space-around">
              <Button
                variant="ghost"
                py={6}
                flex={1}
                borderRadius="none"
                color={activeScreen === "dashboard" ? palette?.button3 || "blue.500" : "gray.400"}
                _hover={{ bg: "gray.50" }}
              onClick={() => setActiveScreen("dashboard")}
              >
                <VStack spacing={1}>
                  <FaHome />
                  <Text fontSize="xs">Home</Text>
                </VStack>
            </Button>
              
            <Button
              variant="ghost"
              py={6}
              flex={1}
              borderRadius="none"
              color={activeScreen === "together" ? palette?.button3 || "blue.500" : "gray.400"}
              _hover={{ bg: "gray.50" }}
              onClick={() => {
                // Forzar una actualización y cambiar a Together
                const updatedFinancials = calculateCombinedFinancials();
                setCombinedFinancials(updatedFinancials);
                setActiveScreen("together");
              }}
              isDisabled={isLoading}
            >
              <VStack spacing={1}>
                <FaUsers />
                <Text fontSize="xs">Together</Text>
              </VStack>
            </Button>
              
            <Button
              variant="ghost"
                py={6}
                flex={1}
                borderRadius="none"
                color="gray.400"
                _hover={{ bg: "gray.50" }}
                onClick={() => {
                  setActiveUser(null);
                  setActiveScreen("login");
                }}
              >
                <VStack spacing={1}>
                  <Avatar size="xs" src={currentUser.avatar} />
                  <Text fontSize="xs">Log out</Text>
                </VStack>
            </Button>
          </HStack>
        </Box>
      </Box>
      )}

      {/* Together Screen - MODIFICADO: Header centrado y meta mostrada primero */}
      
      {activeScreen === "together" && currentUser && (
        <Box bg="gray.100" minH="100vh">
          {/* Header - MODIFICADO: Centrado */}
<Box px={4} pt={8} pb={4} textAlign="center">
  <VStack spacing={1} position="relative">
    <Heading fontWeight="bold" fontSize={{base: "2xl", md: "3xl"}} color="#222" letterSpacing={0.5}>
      Couple Finance <span style={{color:'#ec4899', fontSize:'0.9em', verticalAlign:'middle'}}>❤</span>
    </Heading>
    <Text fontSize="lg" color="#666">Welcome, {currentUser.name}!</Text>
    
    <IconButton
      aria-label="Recargar datos"
      icon={<FaSync />}
      size="sm"
      colorScheme="green"
      variant="outline"
      mt={2}
      onClick={() => {
        try {
          setIsLoading(true);
          
          // Recargar datos de localStorage
          const savedUserData = localStorage.getItem("userData");
          const savedHistory = localStorage.getItem("history");
          const savedGoals = localStorage.getItem("goals");
          
          if (savedUserData) {
            setUserData(JSON.parse(savedUserData));
          }
          
          if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
          }
          
          if (savedGoals) {
            setGoals(JSON.parse(savedGoals));
          }
          
          // Calcular datos financieros combinados
          const newFinancials = calculateCombinedFinancials();
          setCombinedFinancials(newFinancials);
          
          toast({
            title: "Datos actualizados",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
        } catch (error) {
          console.error("Error al recargar datos:", error);
          toast({
            title: "Error al actualizar",
            status: "error",
            duration: 2000,
            isClosable: true,
          });
        } finally {
          setIsLoading(false);
        }
      }}
      isDisabled={isLoading}
    />
  </VStack>
          </Box>
          
          {/* Goal Card - MODIFICADO: Ahora mostrado primero */}
          <Box 
            mx="auto" 
            mb={4} 
            maxW="600px" 
              borderRadius="2xl"
              boxShadow="xl"
            p={6} 
            bg="white"
          >
            <VStack spacing={4}>
              <Heading size="md" textAlign="center" color="#2D3748">
                {goals && goals.coupleGoal && goals.coupleGoal.name ? goals.coupleGoal.name : "Cozy House"}
              </Heading>
              
              <Box
                position="relative"
                width="100%"
                height="12px"
                borderRadius="full"
                bg="gray.100"
                overflow="hidden"
              >
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  height="100%"
                  width={`${goalProgress}%`}
                  borderRadius="full"
                  background={
                    goalProgress > 80 
                      ? "linear-gradient(90deg, #48BB78 0%, #38A169 100%)" 
                      : goalProgress > 40 
                        ? "linear-gradient(90deg, #4299E1 0%, #3182CE 100%)"
                        : "linear-gradient(90deg, #ECC94B 0%, #D69E2E 100%)"
                  }
                  transition="width 0.5s ease"
                />
              </Box>
              
              <HStack width="100%" justify="space-between" flexWrap={{base: "wrap", md: "nowrap"}}>
                <Badge colorScheme="green" p={2} borderRadius="md" mb={{base: 1, md: 0}}>
                  ${formatNumber(combinedFinancials.savings, "USD")} saved
                </Badge>
                <Badge colorScheme="blue" p={2} borderRadius="md" mb={{base: 1, md: 0}}>
                  {goalProgress.toFixed(1)}% complete
                </Badge>
                <Badge colorScheme="purple" p={2} borderRadius="md">
                  ${formatNumber(goals && goals.coupleGoal && goals.coupleGoal.amount ? goals.coupleGoal.amount : 30000, "USD")} goal
                </Badge>
              </HStack>
              
              <Divider my={1} />
              
              <SimpleGrid columns={{base: 1, sm: 2}} width="100%" spacing={{base: 4, sm: 8}} mb={6}>
                <Box 
                  p={4} 
                  borderRadius="xl" 
                  bg="#f7f7fa" 
                  boxShadow="sm"
                  borderLeft="4px solid #38A169"
                >
                  <VStack align="start" spacing={1}>
                    <Text color="gray.500" fontSize="sm">Combined Savings</Text>
                    <Text fontWeight="bold" fontSize={{base: "lg", md: "xl"}} color="#2D3748">
                      ${formatNumber(combinedFinancials.savings, "USD")}
                    </Text>
                    <HStack>
                      <FaArrowUp color="#38A169" />
                      <Text color="green.500" fontSize="xs">
                        {userData.jorgie && userData.gabby 
                          ? "From both of you" 
                          : "Your current savings"}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
                
                <Box 
                  p={4} 
                  borderRadius="xl" 
                  bg="#f7f7fa" 
                  boxShadow="sm"
                  borderLeft="4px solid #3182CE"
                >
                  <VStack align="start" spacing={1}>
                    <Text color="gray.500" fontSize="sm">Time to Goal</Text>
                    <Text fontWeight="bold" fontSize={{base: "lg", md: "xl"}} color="#2D3748">
                      {timeEstimate.years > 0 ? `${timeEstimate.years}y ` : ""}
                      {timeEstimate.remainingMonths}m
                    </Text>
                    <HStack>
                      <FaCalendarAlt color="#3182CE" />
                      <Text color="blue.500" fontSize="xs">
                        Estimated time left
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              </SimpleGrid>
              
              <Box width="100%">
                <Text fontWeight="bold" mb={2}>Monthly Contribution Needed</Text>
                <HStack 
                  p={3} 
                  borderRadius="lg" 
                  bg="blue.50" 
                  width="100%" 
                  justify="space-between"
                  boxShadow="sm"
                  flexWrap={{base: "wrap", md: "nowrap"}}
                >
                  <HStack spacing={2}>
                    <Box bg="blue.100" p={2} borderRadius="md">
                      <FaPiggyBank color="#3182CE" />
                    </Box>
                    <Text fontWeight="medium">To reach goal on time</Text>
                  </HStack>
                  <Text fontWeight="bold" color="blue.600" fontSize={{base: "md", md: "lg"}}>
                    ${formatNumber(
                      Math.max(0, goals && goals.coupleGoal && goals.coupleGoal.amount ? goals.coupleGoal.amount - combinedFinancials.savings : 30000 - combinedFinancials.savings) / 
                      Math.max(1, timeEstimate.months || 24), 
                      "USD"
                    )}/mo
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </Box>
          
          {/* Individual Contributions */}
<Box mx="auto" mb={4} maxW="600px" borderRadius="2xl" boxShadow="md" p={4} bg="#fff">
  <Heading size="sm" mb={4} textAlign="center">Individual Contributions</Heading>
  
  <SimpleGrid columns={2} spacing={4} mb={4}>
    {/* Siempre mostrar a Jorgie */}
    <Box 
      p={4} 
      borderRadius="xl" 
      bg={JORGIE_COLORS.cardBg} 
      boxShadow="sm"
            >
              <VStack>
        <Avatar size="md" src={userData.jorgie?.avatar || "/hubby.jpg"} />
        <Text fontWeight="bold">{userData.jorgie?.name || "Jorgie"}</Text>
        <Stat textAlign="center">
          <StatNumber fontSize="lg">
            ${formatNumber(userData.jorgie?.savings || 0, "USD")}
          </StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            {combinedFinancials.savings > 0 ? 
              ((userData.jorgie?.savings || 0) / 
              convertToCOP(combinedFinancials.savings, "USD") * 100).toFixed(1) : "0.0"}%
          </StatHelpText>
        </Stat>
      </VStack>
    </Box>
    
    {/* Siempre mostrar a Gabby */}
    <Box 
      p={4} 
      borderRadius="xl" 
      bg={GABBY_COLORS.cardBg} 
      boxShadow="sm"
    >
      <VStack>
        <Avatar size="md" src={userData.gabby?.avatar || "/wifey.jpg"} />
        <Text fontWeight="bold">{userData.gabby?.name || "Gabby"}</Text>
        <Stat textAlign="center">
          <StatNumber fontSize="lg">
            COL${formatNumber(userData.gabby?.savings || 0, "COP")}
          </StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            {combinedFinancials.savings > 0 ? 
              ((convertToUSD(userData.gabby?.savings || 0, "COP") / 
              combinedFinancials.savings) * 100).toFixed(1) : "0.0"}%
          </StatHelpText>
        </Stat>
      </VStack>
    </Box>
  </SimpleGrid>
            
            {/* Combined Chart */}
            <Box>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => [`$${formatNumber(value, "USD")}`, undefined]} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#4299E1" />
                  <Bar dataKey="expenses" name="Expenses" fill="#F56565" />
                  <Bar dataKey="savings" name="Savings" fill="#38A169" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          {/* Bottom navigation - Together screen - MODIFICADO: Con Together activo y Log out */}
          <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            borderTopWidth="1px"
            borderTopColor="gray.200"
            p={1}
            bg="white"
            zIndex={10}
            boxShadow="0 -2px 10px rgba(0,0,0,0.05)"
          >
            <HStack spacing={0} justify="space-around">
              <Button
                variant="ghost"
                py={{base: 4, md: 6}}
                px={2}
                flex={1}
                borderRadius="none"
                color="gray.400"
                _hover={{ bg: "gray.50" }}
                onClick={() => setActiveScreen("dashboard")}
              >
                <VStack spacing={1}>
                  <FaHome size={18} />
                  <Text fontSize="xs">Home</Text>
              </VStack>
            </Button>
              
            <Button
                variant="ghost"
                py={{base: 4, md: 6}}
                px={2}
                flex={1}
                borderRadius="none"
                color={palette?.button3 || "blue.500"}
                _hover={{ bg: "gray.50" }}
                onClick={() => {
                  // Forzar una actualización y cambiar a Together
                  const updatedFinancials = calculateCombinedFinancials();
                  setCombinedFinancials(updatedFinancials);
                  setActiveScreen("together");
                }}
                isDisabled={isLoading}
              >
                <VStack spacing={1}>
                  <FaUsers size={18} />
                  <Text fontSize="xs">Together</Text>
              </VStack>
            </Button>
              
              <Button
                variant="ghost"
                py={{base: 4, md: 6}}
                px={2}
                flex={1}
                borderRadius="none"
                color="gray.400"
                _hover={{ bg: "gray.50" }}
                onClick={() => {
                  setActiveUser(null);
                  setActiveScreen("login");
                }}
              >
                <VStack spacing={1}>
                  <Avatar size="xs" src={currentUser.avatar} />
                  <Text fontSize="xs">Log out</Text>
                </VStack>
              </Button>
            </HStack>
          </Box>
        </Box>
      )}
    </Box>
  );
}