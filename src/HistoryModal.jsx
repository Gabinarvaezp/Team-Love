import React, { useEffect, useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Box, Text, VStack, HStack, Divider, IconButton, Badge
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { db } from "./firebase";
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from "firebase/firestore";
import { formatMoney } from "./utils";

export default function HistoryModal({ isOpen, onClose, user, refreshKey, onChanged }) {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    async function fetchData() {
      const qExp = query(collection(db, "expenses"), where("user", "==", user), orderBy("createdAt", "desc"));
      const qInc = query(collection(db, "incomes"), where("user", "==", user), orderBy("createdAt", "desc"));
      const [expSnap, incSnap] = await Promise.all([getDocs(qExp), getDocs(qInc)]);
      setExpenses(expSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setIncomes(incSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchData();
  }, [isOpen, refreshKey, user]);

  const handleDelete = async (id, type) => {
    if (!window.confirm("Delete this record?")) return;
    await deleteDoc(doc(db, type, id));
    if (onChanged) onChanged();
  };

  const sumExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const sumIncomes = incomes.reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={2} maxH="90vh" overflowY="auto">
        <ModalHeader textAlign="center" bg="#FFF8F3" borderTopRadius="2xl">
          <Text fontWeight="bold" fontSize="2xl" color="purple.500">
            {user === "hubby" ? "Jorgie" : "Gabby"}'s History
          </Text>
        </ModalHeader>
        <ModalBody bg="#FFF8F3">
          <VStack align="stretch" spacing={3}>
            <Box>
              <Text fontWeight="bold" color="gray.600">Incomes</Text>
              {incomes.length === 0 && <Text color="gray.400">No incomes</Text>}
              {incomes.map((inc) => (
                <HStack key={inc.id} justify="space-between" bg="green.50" p={2} borderRadius="md">
                  <Box>
                    <Text fontWeight="bold">{inc.source || "Income"}</Text>
                    <Text fontSize="sm" color="gray.500">{inc.currency} {formatMoney(inc.amount, inc.currency)}</Text>
                  </Box>
                  <Text color="green.600" fontWeight="bold">{formatMoney(inc.amount, inc.currency)}</Text>
                  <IconButton
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    aria-label="Delete"
                    onClick={() => handleDelete(inc.id, "incomes")}
                  />
                </HStack>
              ))}
              <Text mt={2} fontWeight="bold" color="green.700">
                Total: {formatMoney(sumIncomes, "USD")}
              </Text>
            </Box>
            <Divider />
            <Box>
              <Text fontWeight="bold" color="gray.600">Expenses</Text>
              {expenses.length === 0 && <Text color="gray.400">No expenses</Text>}
              {expenses.map((exp) => (
                <HStack key={exp.id} justify="space-between" bg="red.50" p={2} borderRadius="md">
                  <Box>
                    <Text fontWeight="bold">{exp.category || "Expense"}</Text>
                    <Text fontSize="sm" color="gray.500">{exp.currency} {formatMoney(exp.amount, exp.currency)}</Text>
                    {exp.receipts && exp.receipts.length > 0 && (
                      <Badge colorScheme="yellow" ml={2}>Receipt</Badge>
                    )}
                  </Box>
                  <Text color="red.600" fontWeight="bold">{formatMoney(exp.amount, exp.currency)}</Text>
                  <IconButton
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    aria-label="Delete"
                    onClick={() => handleDelete(exp.id, "expenses")}
                  />
                </HStack>
              ))}
              <Text mt={2} fontWeight="bold" color="red.700">
                Total: {formatMoney(sumExpenses, "USD")}
              </Text>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter bg="#FFF8F3" borderBottomRadius="2xl">
          <Button onClick={onClose} borderRadius="xl" px={6} colorScheme="purple">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}