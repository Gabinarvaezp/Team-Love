import React, { useEffect, useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Box, Text, Flex, Badge, IconButton, Button, Stack, Divider
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { db } from "./firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import dayjs from "dayjs";

function groupByCategory(items) {
  const grouped = {};
  items.forEach(item => {
    const cat = item.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });
  return grouped;
}

function getCategoryTotals(items) {
  const totals = {};
  items.forEach(item => {
    const cat = item.category || "Other";
    if (!totals[cat]) totals[cat] = 0;
    totals[cat] += Number(item.amount);
  });
  return totals;
}

export default function HistoryModal({ isOpen, onClose, user, refreshKey, onChanged }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      let all = [];
      // Incomes
      const qIncomes = query(collection(db, "incomes"), where("user", "==", user));
      const incomes = await getDocs(qIncomes);
      incomes.forEach(docu => {
        all.push({ ...docu.data(), id: docu.id, type: "Income" });
      });
      // Expenses
      const qExpenses = query(collection(db, "expenses"), where("user", "==", user));
      const expenses = await getDocs(qExpenses);
      expenses.forEach(docu => {
        all.push({ ...docu.data(), id: docu.id, type: "Expense" });
      });
      // Sort by date
      all.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setItems(all);
      setLoading(false);
    }
    if (isOpen) fetchHistory();
  }, [user, refreshKey, isOpen]);

  const handleDelete = async (item) => {
    const col = item.type === "Income" ? "incomes" : "expenses";
    await deleteDoc(doc(db, col, item.id));
    setItems(items.filter(i => i.id !== item.id));
    if (onChanged) onChanged();
  };

  // Agrupa por categoría
  const grouped = groupByCategory(items);
  const totals = getCategoryTotals(items);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex align="center" gap={2}>
            <Text fontWeight="bold" fontSize="lg">History</Text>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box mb={4}>
            <Text fontWeight="bold" mb={2}>Category Totals</Text>
            <Flex wrap="wrap" gap={2}>
              {Object.entries(totals).map(([cat, total]) => (
                <Badge
                  key={cat}
                  colorScheme={cat === "Food" ? "green" : cat === "Golf" ? "blue" : cat === "Wife" ? "pink" : "gray"}
                  fontSize="md"
                  px={3}
                  py={1}
                  borderRadius="lg"
                >
                  {cat}: ${total}
                </Badge>
              ))}
            </Flex>
          </Box>
          <Divider mb={3} />
          {Object.keys(grouped).length === 0 && (
            <Text color="gray.400" textAlign="center">No entries yet.</Text>
          )}
          <Stack spacing={4}>
            {Object.entries(grouped).map(([cat, entries]) => (
              <Box key={cat} bg="gray.50" borderRadius="lg" p={3}>
                <Text fontWeight="bold" mb={2} color="gray.600">{cat}</Text>
                <Stack spacing={2}>
                  {entries.map((item, idx) => (
                    <Flex
                      key={item.id}
                      align="center"
                      justify="space-between"
                      bg={item.type === "Income" ? "#e0f2fe" : "#fef2f2"}
                      borderRadius="md"
                      px={3}
                      py={2}
                    >
                      <Box>
                        <Badge colorScheme={item.type === "Income" ? "blue" : "red"} mr={2}>
                          {item.type}
                        </Badge>
                        <Text as="span" fontWeight="bold">
                          {item.amount} {item.currency}
                        </Text>
                        {item.createdAt && (
                          <Text as="span" color="gray.400" ml={2} fontSize="sm">
                            {dayjs.unix(item.createdAt.seconds).format("MMM D, YYYY")}
                          </Text>
                        )}
                      </Box>
                      <IconButton
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        size="sm"
                        aria-label="Delete"
                        onClick={() => handleDelete(item)}
                      />
                    </Flex>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}