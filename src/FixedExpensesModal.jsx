import React, { useEffect, useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, Switch, FormControl, FormLabel, Button, Flex, Text, Badge, IconButton
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";

export default function FixedExpensesModal({
  isOpen, onClose, user, activeUser, fixedExpenses, debt, autoSavings, onSave
}) {
  const [expenses, setExpenses] = useState(fixedExpenses || []);
  const [newExpense, setNewExpense] = useState({ name: "", amount: "", currency: "USD", auto: false });
  const [debtState, setDebtState] = useState(debt || { name: "", total: "", monthlyPayment: "", currency: "USD", auto: false, deductedOnPaycheck: "1st" });
  const [savings, setSavings] = useState(autoSavings || { amount: "", currency: "USD", auto: false, deductedOnPaycheck: "1st" });

  useEffect(() => {
    setExpenses(fixedExpenses || []);
    setDebtState(debt || { name: "", total: "", monthlyPayment: "", currency: "USD", auto: false, deductedOnPaycheck: "1st" });
    setSavings(autoSavings || { amount: "", currency: "USD", auto: false, deductedOnPaycheck: "1st" });
  }, [fixedExpenses, debt, autoSavings, isOpen]);

  const handleAddExpense = () => {
    if (!newExpense.name || !newExpense.amount) return;
    setExpenses([...expenses, newExpense]);
    setNewExpense({ name: "", amount: "", currency: "USD", auto: false });
  };

  const handleRemoveExpense = idx => {
    setExpenses(expenses.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onSave(expenses, debtState, savings);
    onClose();
  };

  // Only allow editing if user === activeUser
  const canEdit = user === activeUser;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Fixed Expenses, Debt & Auto Savings ({user === "hubby" ? "Jorgie" : "Gabby"})</ModalHeader>
        <ModalBody>
          <Text fontWeight="bold" mb={2}>Fixed Expenses</Text>
          {expenses.map((exp, idx) => (
            <Flex key={idx} align="center" mb={2}>
              <Text flex="1">{exp.name} - {exp.amount} {exp.currency} {exp.auto && <Badge colorScheme="green" ml={2}>Auto</Badge>}</Text>
              {canEdit && (
                <IconButton size="xs" colorScheme="red" icon={<DeleteIcon />} onClick={() => handleRemoveExpense(idx)} />
              )}
            </Flex>
          ))}
          {canEdit && (
            <Flex gap={2} mb={2}>
              <Input placeholder="Name" value={newExpense.name} onChange={e => setNewExpense({ ...newExpense, name: e.target.value })} />
              <Input placeholder="Amount" type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
              <Select value={newExpense.currency} onChange={e => setNewExpense({ ...newExpense, currency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="COP">COP</option>
              </Select>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="auto-exp" mb="0" fontSize="xs">Auto</FormLabel>
                <Switch id="auto-exp" isChecked={newExpense.auto} onChange={e => setNewExpense({ ...newExpense, auto: e.target.checked })} />
              </FormControl>
              <Button size="sm" colorScheme="blue" onClick={handleAddExpense}>+</Button>
            </Flex>
          )}
          <Text fontWeight="bold" mt={4} mb={2}>Debt</Text>
          <Flex gap={2} mb={2}>
            <Input placeholder="Name" value={debtState.name} onChange={e => setDebtState({ ...debtState, name: e.target.value })} isDisabled={!canEdit} />
            <Input placeholder="Total" type="number" value={debtState.total} onChange={e => setDebtState({ ...debtState, total: e.target.value })} isDisabled={!canEdit} />
            <Input placeholder="Monthly Payment" type="number" value={debtState.monthlyPayment} onChange={e => setDebtState({ ...debtState, monthlyPayment: e.target.value })} isDisabled={!canEdit} />
            <Select value={debtState.currency} onChange={e => setDebtState({ ...debtState, currency: e.target.value })} isDisabled={!canEdit}>
              <option value="USD">USD</option>
              <option value="COP">COP</option>
            </Select>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="auto-debt" mb="0" fontSize="xs">Auto</FormLabel>
              <Switch id="auto-debt" isChecked={debtState.auto} onChange={e => setDebtState({ ...debtState, auto: e.target.checked })} isDisabled={!canEdit} />
            </FormControl>
            <Select value={debtState.deductedOnPaycheck} onChange={e => setDebtState({ ...debtState, deductedOnPaycheck: e.target.value })} isDisabled={!canEdit}>
              <option value="1st">1st</option>
              <option value="15th">15th</option>
            </Select>
          </Flex>
          <Text fontWeight="bold" mt={4} mb={2}>Auto Savings</Text>
          <Flex gap={2} mb={2}>
            <Input placeholder="Amount" type="number" value={savings.amount} onChange={e => setSavings({ ...savings, amount: e.target.value })} isDisabled={!canEdit} />
            <Select value={savings.currency} onChange={e => setSavings({ ...savings, currency: e.target.value })} isDisabled={!canEdit}>
              <option value="USD">USD</option>
              <option value="COP">COP</option>
            </Select>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="auto-savings" mb="0" fontSize="xs">Auto</FormLabel>
              <Switch id="auto-savings" isChecked={savings.auto} onChange={e => setSavings({ ...savings, auto: e.target.checked })} isDisabled={!canEdit} />
            </FormControl>
            <Select value={savings.deductedOnPaycheck} onChange={e => setSavings({ ...savings, deductedOnPaycheck: e.target.value })} isDisabled={!canEdit}>
              <option value="1st">1st</option>
              <option value="15th">15th</option>
            </Select>
          </Flex>
        </ModalBody>
        <ModalFooter>
          {canEdit && <Button colorScheme="green" mr={3} onClick={handleSave}>Save</Button>}
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}