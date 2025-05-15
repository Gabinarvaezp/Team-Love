import React, { useState, useEffect } from "react";
import {
  Box, Flex, Avatar, Text, Button, HStack, VStack, Divider, Icon, IconButton, Tooltip, useBreakpointValue, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, Switch
} from "@chakra-ui/react";
import {
  FaPlaneDeparture, FaHeart, FaSuitcase, FaTicketAlt, FaMapMarkedAlt, FaMinus, FaPlus, FaReceipt, FaHistory, FaSignOutAlt, FaChartPie, FaDownload, FaTrash
} from "react-icons/fa";
import { SettingsIcon } from "@chakra-ui/icons";
import { PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import ConfigModal from "./ConfigModal";

// Conversion rate COP to USD (now 4500)
const COP_TO_USD = 4500;
function convertToUSD(amount, currency) {
  if (currency === "USD") return amount;
  if (currency === "COP") return amount / COP_TO_USD;
  return amount;
}

const MOTIVATIONAL_QUOTES = [
  "One step closer to our cozy house 🏡",
  "Every Friday is a flight closer to you ✈️",
  "Let’s go together, paycheck by paycheck!",
  "Thanks for building this dream together 💖",
];

// --- AddExpenseModal ---
function AddExpenseModal({ isOpen, onClose, user, onAdd, avatar }) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(user === "gabby" ? "COP" : "USD");
  const [category, setCategory] = useState("");
  const toast = useToast();

  const handleSubmit = () => {
    if (!amount || !category) {
      toast({ title: "Please fill all fields", status: "warning" });
      return;
    }
    onAdd({ amount: Number(amount), currency, category });
    setAmount("");
    setCategory("");
    setCurrency(user === "gabby" ? "COP" : "USD");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={2} bg="#F7F7F7">
        <ModalHeader textAlign="center" borderTopRadius="2xl" bg="#F3F3F3">
          <VStack spacing={2}>
            <Avatar size="lg" src={avatar} />
            <Text fontWeight="bold" fontSize="2xl" color="#444">
              <FaMinus style={{ display: "inline", marginRight: 8 }} />
              Add Expense
            </Text>
          </VStack>
        </ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <Input
              placeholder="Amount"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
            />
            <Input
              placeholder="Category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
            />
            <Select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
            >
              <option value="USD">USD</option>
              <option value="COP">COP</option>
            </Select>
            {currency === "COP" && amount && (
              <Text fontSize="sm" color="gray.500" textAlign="right">
                ≈ <b>${convertToUSD(Number(amount), "COP")}</b> USD
              </Text>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter bg="#F3F3F3" borderBottomRadius="2xl">
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleSubmit}
            borderRadius="xl"
            fontWeight="bold"
            px={8}
            size="lg"
            disabled={!amount || !category}
          >
            Add
          </Button>
          <Button onClick={onClose} borderRadius="xl" px={8} size="lg">
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// --- AddIncomeModal ---
function AddIncomeModal({ isOpen, onClose, user, onAdd, avatar }) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(user === "gabby" ? "COP" : "USD");
  const [source, setSource] = useState("");
  const toast = useToast();

  const handleSubmit = () => {
    if (!amount || !source) {
      toast({ title: "Please fill all fields", status: "warning" });
      return;
    }
    onAdd({ amount: Number(amount), currency, source });
    setAmount("");
    setSource("");
    setCurrency(user === "gabby" ? "COP" : "USD");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={2} bg="#F7F7F7">
        <ModalHeader textAlign="center" borderTopRadius="2xl" bg="#F3F3F3">
          <VStack spacing={2}>
            <Avatar size="lg" src={avatar} />
            <Text fontWeight="bold" fontSize="2xl" color="#444">
              <FaPlus style={{ display: "inline", marginRight: 8 }} />
              Add Income
            </Text>
          </VStack>
        </ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <Input
              placeholder="Amount"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
            />
            <Input
              placeholder="Source"
              value={source}
              onChange={e => setSource(e.target.value)}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
            />
            <Select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
            >
              <option value="USD">USD</option>
              <option value="COP">COP</option>
            </Select>
            {currency === "COP" && amount && (
              <Text fontSize="sm" color="gray.500" textAlign="right">
                ≈ <b>${convertToUSD(Number(amount), "COP")}</b> USD
              </Text>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter bg="#F3F3F3" borderBottomRadius="2xl">
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleSubmit}
            borderRadius="xl"
            fontWeight="bold"
            px={8}
            size="lg"
            disabled={!amount || !source}
          >
            Add
          </Button>
          <Button onClick={onClose} borderRadius="xl" px={8} size="lg">
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// --- UploadReceiptsModal ---
function UploadReceiptsModal({ isOpen, onClose, user, onUpload, avatar }) {
  const [files, setFiles] = useState([]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(user === "gabby" ? "COP" : "USD");
  const [category, setCategory] = useState("");
  const toast = useToast();

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 10) {
      toast({ title: "You can upload up to 10 images at once.", status: "warning" });
      setFiles(selected.slice(0, 10));
    } else {
      setFiles(selected);
    }
  };

  const handleUpload = () => {
    if (!amount || files.length === 0) {
      toast({ title: "Please enter an amount and select at least one file.", status: "warning" });
      return;
    }
    onUpload({ files, amount: Number(amount), currency, category });
    setFiles([]);
    setAmount("");
    setCategory("");
    setCurrency(user === "gabby" ? "COP" : "USD");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={2} bg="#F7F7F7">
        <ModalHeader textAlign="center" borderTopRadius="2xl" bg="#F3F3F3">
          <VStack spacing={2}>
            <Avatar size="lg" src={avatar} />
            <Text fontWeight="bold" fontSize="2xl" color="#444">
              <FaReceipt style={{ display: "inline", marginRight: 8 }} />
              Upload Receipts
            </Text>
          </VStack>
        </ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              borderRadius="xl"
              bg="white"
            />
            <Input
              placeholder="Amount"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
            />
            <Input
              placeholder="Category (optional)"
              value={category}
              onChange={e => setCategory(e.target.value)}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
            />
            <Select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
            >
              <option value="USD">USD</option>
              <option value="COP">COP</option>
            </Select>
            {currency === "COP" && amount && (
              <Text fontSize="sm" color="gray.500" textAlign="right">
                ≈ <b>${convertToUSD(Number(amount), "COP")}</b> USD
              </Text>
            )}
            <Text fontSize="sm" color="gray.500">
              You can upload up to 10 images at once.
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter bg="#F3F3F3" borderBottomRadius="2xl">
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleUpload}
            borderRadius="xl"
            fontWeight="bold"
            px={8}
            size="lg"
            disabled={files.length === 0 || !amount}
          >
            Upload & Register Expense
          </Button>
          <Button onClick={onClose} borderRadius="xl" px={8} size="lg">
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// --- HistoryModal ---
function HistoryModal({ isOpen, onClose, history, onDownload, onDelete }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={2}>
        <ModalHeader textAlign="center" bg="#F7F7F7" borderTopRadius="2xl">
          <HStack justify="center">
            <FaHistory color="#888" />
            <Text fontWeight="bold" fontSize="xl" color="#444">History</Text>
            <Tooltip label="Download Excel report">
              <IconButton
                icon={<FaDownload />}
                size="sm"
                colorScheme="gray"
                aria-label="Download Excel"
                ml={2}
                onClick={onDownload}
              />
            </Tooltip>
          </HStack>
        </ModalHeader>
        <ModalBody bg="#F7F7F7">
          <VStack spacing={3} align="stretch">
            {history.length === 0 && (
              <Text color="gray.400" textAlign="center">No movements yet.</Text>
            )}
            {history.map((item, idx) => (
              <Box key={idx} bg="white" p={3} borderRadius="lg" boxShadow="sm" position="relative">
                <Text fontWeight="bold">{item.type}</Text>
                <Text fontSize="sm" color="gray.500">{item.date}</Text>
                <Text>
                  {item.currency === "COP"
                    ? `COP ${item.amount}`
                    : `$${item.amount}`}{" "}
                  {item.category && <span>({item.category})</span>}
                </Text>
                {item.type === "Expense" && (
                  <IconButton
                    icon={<FaTrash />}
                    aria-label="Delete"
                    colorScheme="red"
                    size="xs"
                    position="absolute"
                    top={2}
                    right={2}
                    onClick={() => onDelete(idx)}
                  />
                )}
              </Box>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter bg="#F7F7F7" borderBottomRadius="2xl">
          <Button onClick={onClose} borderRadius="xl" px={8} size="lg">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// --- SummaryChartModal ---
function SummaryChartModal({ isOpen, onClose, title, data, color, allowCurrencySwitch, currencyMode, setCurrencyMode }) {
  const COLORS = [color, "#eee", "#ddd", "#ccc", "#bbb"];
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={2}>
        <ModalHeader textAlign="center" bg="#F7F7F7" borderTopRadius="2xl">
          <Text fontWeight="bold" fontSize="2xl" color={color}>
            <FaChartPie style={{ display: "inline", marginRight: 8 }} />
            {title} Summary
          </Text>
          {allowCurrencySwitch && (
            <HStack justify="center" mt={2}>
              <Text fontSize="sm" color="gray.500">Show in:</Text>
              <Switch
                isChecked={currencyMode === "USD"}
                onChange={() => setCurrencyMode(currencyMode === "USD" ? "COP" : "USD")}
                colorScheme="teal"
              />
              <Text fontSize="sm" color="gray.500">{currencyMode}</Text>
            </HStack>
          )}
        </ModalHeader>
        <ModalBody>
          <Box w="100%" h="220px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <PieTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <VStack mt={4} spacing={1}>
            {data.map((d, i) => (
              <HStack key={i}>
                <Box w={3} h={3} borderRadius="full" bg={COLORS[i % COLORS.length]} />
                <Text fontSize="md">{d.name}: <b>{d.value}</b> {currencyMode}</Text>
              </HStack>
            ))}
            <Divider />
            <Text fontWeight="bold" fontSize="lg">Total: {total} {currencyMode}</Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} colorScheme="blue" borderRadius="xl" px={8} size="lg">Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// --- Main Dashboard ---
export default function Dashboard({ user = "gabby", onLogout }) {
  const quote = MOTIVATIONAL_QUOTES[new Date().getDay() % MOTIVATIONAL_QUOTES.length];
  const [showConfig, setShowConfig] = useState(false);
  const [configProfile, setConfigProfile] = useState("gabby");
  const [showExpense, setShowExpense] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [showReceipts, setShowReceipts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSavingsChart, setShowSavingsChart] = useState(null);
  const [showDebtsChart, setShowDebtsChart] = useState(null);
  const [currencyModes, setCurrencyModes] = useState({ jorgie: "USD", gabby: "COP" });

  // --- Persistencia en localStorage ---
  const defaultUserData = {
    jorgie: {
      savingsAccounts: [],
      debts: [],
      savings: 0,
      debtsTotal: 0,
      currency: "USD",
      avatar: "/hubby.jpg",
      name: "Jorgie",
      autoPayments: false,
    },
    gabby: {
      savingsAccounts: [],
      debts: [],
      savings: 0,
      debtsTotal: 0,
      currency: "COP",
      avatar: "/wifey.jpg",
      name: "Gabby",
      autoPayments: false,
    },
  };

  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem("userData");
    return saved ? JSON.parse(saved) : defaultUserData;
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("history");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("userData", JSON.stringify(userData));
  }, [userData]);
  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const goal = 30000;

  // Suma total en USD
  const togetherSaved =
    convertToUSD(userData.jorgie?.savings || 0, userData.jorgie?.currency || "USD") +
    convertToUSD(userData.gabby?.savings || 0, userData.gabby?.currency || "COP");
  const progress = Math.min((togetherSaved / goal) * 100, 100);

  const formatUSD = (n) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Guardar cambios desde ConfigModal
  const handleSaveConfig = (savingsAccounts, debts, profileData) => {
    setUserData(prev => ({
      ...prev,
      [configProfile]: {
        ...prev[configProfile],
        ...profileData,
        savingsAccounts,
        debts,
        savings: savingsAccounts.reduce((acc, s) => acc + Number(s.amount || 0), 0),
        debtsTotal: debts.reduce((acc, d) => acc + Number(d.total || 0), 0),
      }
    }));
    setShowConfig(false);
  };

  // Add expense/income/receipt to history and update savings/debts
  const handleAddExpense = ({ amount, currency, category }) => {
    setHistory(prev => [
      { type: "Expense", amount, currency, category, date: new Date().toLocaleDateString() },
      ...prev,
    ]);
    setUserData(prev => ({
      ...prev,
      [user]: {
        ...prev[user],
        savings: Math.max(0, (prev[user]?.savings || 0) - convertToUSD(amount, currency)),
      }
    }));
  };

  const handleAddIncome = ({ amount, currency, source }) => {
    setHistory(prev => [
      { type: "Income", amount, currency, category: source, date: new Date().toLocaleDateString() },
      ...prev,
    ]);
    setUserData(prev => ({
      ...prev,
      [user]: {
        ...prev[user],
        savings: (prev[user]?.savings || 0) + convertToUSD(amount, currency),
      }
    }));
  };

  const handleUploadReceipts = ({ files, amount, currency, category }) => {
    setHistory(prev => [
      { type: "Receipt", amount, currency, category, date: new Date().toLocaleDateString() },
      ...prev,
    ]);
    setUserData(prev => ({
      ...prev,
      [user]: {
        ...prev[user],
        savings: Math.max(0, (prev[user]?.savings || 0) - convertToUSD(amount, currency)),
      }
    }));
  };

  // Eliminar expense del historial
  const handleDeleteHistory = (idx) => {
    setHistory(prev => prev.filter((_, i) => i !== idx));
  };

  // Excel download
  const handleDownloadExcel = () => {
    if (history.length === 0) return;
    const grouped = {};
    history.forEach(item => {
      const [month, day, year] = item.date.split("/");
      const key = `${year}-${month.padStart(2, "0")}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    const rows = [];
    Object.entries(grouped).forEach(([month, items]) => {
      items.forEach(item => {
        rows.push({
          Month: month,
          Type: item.type,
          Amount: item.amount,
          Currency: item.currency,
          Category: item.category,
          Date: item.date,
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");
    XLSX.writeFile(wb, "financial_history.xlsx");
  };

  const flexDirection = useBreakpointValue({ base: "column", md: "row" });
  const cardWidth = useBreakpointValue({ base: "100%", md: "320px" });

  // Render a user card
  const renderUserCard = (profileKey, color, bgColor) => {
    const profile = userData[profileKey];
    const currencyMode = currencyModes[profileKey];

    if (!profile) return null;

    let savingsData = (profile.savingsAccounts || []).map(s => ({
      name: s.name,
      value: currencyMode === "USD"
        ? convertToUSD(s.amount, s.currency || "COP")
        : s.amount
    }));
    let debtsData = (profile.debts || []).map(d => ({
      name: d.name,
      value: currencyMode === "USD"
        ? convertToUSD(d.total, d.currency || "COP")
        : d.total
    }));

    const savingsDisplay = currencyMode === "USD"
      ? `$${Number(convertToUSD(profile.savings, profile.currency)).toLocaleString()}`
      : `${profile.currency} ${Number(profile.savings).toLocaleString()}`;
    const debtsDisplay = currencyMode === "USD"
      ? `$${Number(convertToUSD(profile.debtsTotal, profile.currency)).toLocaleString()}`
      : `${profile.currency} ${Number(profile.debtsTotal).toLocaleString()}`;

    // Gasto del mes actual
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const userExpenses = history.filter(
      h =>
        h.type === "Expense" &&
        h.currency &&
        h.date &&
        ((profileKey === "gabby" && userData.gabby.currency === h.currency) ||
          (profileKey === "jorgie" && userData.jorgie.currency === h.currency)) &&
        (function () {
          const parts = h.date.split("/");
          let day, month, year;
          if (parts[2]?.length === 4) {
            // dd/mm/yyyy
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            year = parseInt(parts[2], 10);
          } else {
            // mm/dd/yyyy
            month = parseInt(parts[0], 10) - 1;
            day = parseInt(parts[1], 10);
            year = parseInt(parts[2], 10);
          }
          return month === thisMonth && year === thisYear;
        })()
    );
    const totalExpense = userExpenses.reduce(
      (acc, h) => acc + convertToUSD(h.amount, h.currency),
      0
    );

    return (
      <VStack
        key={profileKey}
        bg={bgColor}
        borderRadius="2xl"
        p={8}
        w={cardWidth}
        minW="260px"
        spacing={3}
        boxShadow="lg"
        position="relative"
        align="center"
        mb={flexDirection === "column" ? 6 : 0}
        transition="box-shadow 0.2s"
        _hover={{ boxShadow: "2xl" }}
      >
        <Avatar
          size="2xl"
          src={profile.avatar}
          borderWidth={3}
          borderColor={color}
        />
        <Text fontWeight="bold" fontSize="2xl" color={color} mt={2}>
          {profile.name}
        </Text>
        <Text
          fontSize="md"
          color={color}
          bg="#F3F3F3"
          px={4}
          py={1}
          borderRadius="lg"
          fontWeight="semibold"
        >
          {profileKey === "gabby" ? "Wifey" : "Hubby"}
        </Text>
        <Divider my={2} />
        <HStack>
          <Text fontWeight="bold" color="gray.500" fontSize="md" mt={2}>
            Current Savings
          </Text>
          <Switch
            isChecked={currencyMode === "USD"}
            onChange={() =>
              setCurrencyModes(m => ({
                ...m,
                [profileKey]: m[profileKey] === "USD" ? "COP" : "USD"
              }))
            }
            colorScheme="teal"
            size="sm"
            ml={2}
          />
          <Text fontSize="sm" color="gray.500">{currencyMode}</Text>
        </HStack>
        <Text
          fontSize="2xl"
          color={color}
          fontWeight="bold"
          cursor="pointer"
          onClick={() => setShowSavingsChart(profileKey)}
          _hover={{ textDecoration: "underline" }}
        >
          {savingsDisplay}
        </Text>
        <Text fontSize="md" color="red.500" fontWeight="bold" mt={1}>
          Expenses this month: ${totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
        </Text>
        <Text fontWeight="bold" color="gray.500" fontSize="md" mt={2}>
          Debts
        </Text>
        <Text
          fontSize="2xl"
          color="red.400"
          fontWeight="bold"
          cursor="pointer"
          onClick={() => setShowDebtsChart(profileKey)}
          _hover={{ textDecoration: "underline" }}
        >
          {debtsDisplay}
        </Text>
        {/* Modals de gráfica */}
        {showSavingsChart === profileKey && (
          <SummaryChartModal
            isOpen={true}
            onClose={() => setShowSavingsChart(null)}
            title="Savings"
            data={savingsData}
            color={color}
            allowCurrencySwitch={true}
            currencyMode={currencyMode}
            setCurrencyMode={mode =>
              setCurrencyModes(m => ({ ...m, [profileKey]: mode }))
            }
          />
        )}
        {showDebtsChart === profileKey && (
          <SummaryChartModal
            isOpen={true}
            onClose={() => setShowDebtsChart(null)}
            title="Debts"
            data={debtsData}
            color="red"
            allowCurrencySwitch={true}
            currencyMode={currencyMode}
            setCurrencyMode={mode =>
              setCurrencyModes(m => ({ ...m, [profileKey]: mode }))
            }
          />
        )}
      </VStack>
    );
  };

  return (
    <Box bg="#F7F7F7" minH="100vh" py={10}>
      <Box
        maxW="900px"
        mx="auto"
        borderRadius="2xl"
        p={[3, 8]}
        bg="white"
        boxShadow="2xl"
      >
        <Text
          fontSize="3xl"
          fontWeight="bold"
          color="#444"
          textAlign="center"
          mb={1}
          letterSpacing={1}
        >
          Hubby & Wifey <Icon as={FaPlaneDeparture} color="#888" />
        </Text>
        <Text fontSize="lg" color="gray.500" textAlign="center" mb={2}>
          Countdown to the Cozy House
        </Text>
        <HStack justify="center" spacing={3} mb={2}>
          <Icon as={FaPlaneDeparture} color="#888" />
          <Icon as={FaHeart} color="#888" />
          <Icon as={FaTicketAlt} color="#888" />
          <Icon as={FaSuitcase} color="#888" />
          <Icon as={FaMapMarkedAlt} color="#888" />
        </HStack>
        <Text fontSize="md" color="gray.400" textAlign="center" mb={6} fontStyle="italic">
          {quote}
        </Text>
        {/* User cards */}
        <Flex
          justify="center"
          gap={12}
          mb={8}
          flexWrap="wrap"
          direction={flexDirection}
          align="center"
        >
          {renderUserCard("jorgie", "#444", "#F3F3F3")}
          {renderUserCard("gabby", "#444", "#F3F3F3")}
        </Flex>
        {/* Savings goal and actions */}
        <VStack spacing={4} align="center" w="100%">
          <Text fontWeight="bold" fontSize="lg" color="#444" mt={2}>
            Savings Goal
          </Text>
          <Text fontSize="4xl" fontWeight="extrabold" color="#444" letterSpacing={1}>
            ${formatUSD(goal)}
          </Text>
          <Box
            w="100%"
            h="14px"
            bg="#E0E0E0"
            borderRadius="full"
            overflow="hidden"
            maxW="500px"
            boxShadow="sm"
          >
            <Box w={`${progress}%`} h="100%" bg="#888" transition="width 0.5s" />
          </Box>
          <Text fontWeight="bold" color="#444" fontSize="lg" mt={2}>
            Together saved: ${togetherSaved.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Divider my={2} />
          <HStack
            justify="center"
            spacing={4}
            flexWrap="wrap"
            w="100%"
          >
            <Button
              leftIcon={<FaMinus />}
              colorScheme="gray"
              borderRadius="xl"
              variant="outline"
              onClick={() => setShowExpense(true)}
              w={["100%", "auto"]}
              minW="160px"
            >
              Add Expense
            </Button>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="gray"
              borderRadius="xl"
              variant="outline"
              onClick={() => setShowIncome(true)}
              w={["100%", "auto"]}
              minW="160px"
            >
              Add Income
            </Button>
            <Button
              leftIcon={<FaReceipt />}
              colorScheme="gray"
              borderRadius="xl"
              variant="outline"
              onClick={() => setShowReceipts(true)}
              w={["100%", "auto"]}
              minW="160px"
            >
              Upload Receipts
            </Button>
            {user && (
              <Button
                leftIcon={<SettingsIcon />}
                colorScheme="blue"
                borderRadius="xl"
                variant="solid"
                fontWeight="bold"
                onClick={() => {
                  setConfigProfile(user);
                  setShowConfig(true);
                }}
                w={["100%", "auto"]}
                minW="200px"
              >
                Información financiera
              </Button>
            )}
          </HStack>
          <HStack w="100%" spacing={4}>
            <Button
              leftIcon={<FaHistory />}
              colorScheme="gray"
              borderRadius="xl"
              variant="ghost"
              w="100%"
              fontWeight="bold"
              fontSize="lg"
              onClick={() => setShowHistory(true)}
            >
              View History
            </Button>
            <Button
              leftIcon={<FaSignOutAlt />}
              colorScheme="gray"
              borderRadius="xl"
              variant="ghost"
              w="100%"
              fontWeight="bold"
              fontSize="lg"
              onClick={onLogout}
            >
              Log out
            </Button>
          </HStack>
        </VStack>
      </Box>
      {/* Config Modal */}
      <ConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        data={userData[configProfile] || { savingsAccounts: [], debts: [] }}
        onSave={handleSaveConfig}
        canEdit={user === configProfile}
        user={configProfile}
      />
      <AddExpenseModal
        isOpen={showExpense}
        onClose={() => setShowExpense(false)}
        user={user}
        onAdd={handleAddExpense}
        avatar={user === "jorgie" ? "/hubby.jpg" : "/wifey.jpg"}
      />
      <AddIncomeModal
        isOpen={showIncome}
        onClose={() => setShowIncome(false)}
        user={user}
        onAdd={handleAddIncome}
        avatar={user === "jorgie" ? "/hubby.jpg" : "/wifey.jpg"}
      />
      <UploadReceiptsModal
        isOpen={showReceipts}
        onClose={() => setShowReceipts(false)}
        user={user}
        onUpload={handleUploadReceipts}
        avatar={user === "jorgie" ? "/hubby.jpg" : "/wifey.jpg"}
      />
      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onDownload={handleDownloadExcel}
        onDelete={handleDeleteHistory}
      />
    </Box>
  );
}