// ConfigModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, FormControl, VStack, HStack, Select, Switch, Text, Box, IconButton, Badge, Divider, Tooltip, Avatar
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { FaPiggyBank, FaMoneyCheckAlt } from "react-icons/fa";

const CHEQUES = [
  { value: "first", label: "First Check" },
  { value: "second", label: "Second Check" },
  { value: "both", label: "Both Checks" }
];

export default function ConfigModal({ isOpen, onClose, data, onSave, canEdit }) {
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    setSavingsAccounts(data.savingsAccounts || []);
    setDebts(data.debts || []);
  }, [data]);

  const handleInput = (setter, idx, field, value, arr) => {
    if (value === "0" && arr[idx][field] === 0) value = "";
    setter(arr =>
      arr.map((a, i) =>
        i === idx
          ? {
              ...a,
              [field]:
                field === "amount" ||
                field === "perCheck" ||
                field === "total" ||
                field === "monthlyPayment"
                  ? Number(value)
                  : field === "auto"
                  ? value
                  : value,
            }
          : a
      )
    );
  };

  const handleAddSavings = () => {
    setSavingsAccounts(accs => [
      ...accs,
      { name: "", amount: 0, currency: "USD", auto: false, perCheck: 0, paycheck: "first" }
    ]);
  };
  const handleDeleteSavings = (idx) => {
    setSavingsAccounts(accs => accs.filter((_, i) => i !== idx));
  };

  const handleAddDebt = () => {
    setDebts(debts => [
      ...debts,
      { name: "", total: 0, monthlyPayment: 0, currency: "USD", paycheck: "first" }
    ]);
  };
  const handleDeleteDebt = (idx) => {
    setDebts(debts => debts.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onSave(
      savingsAccounts.map(a => ({ ...a, amount: Number(a.amount), perCheck: Number(a.perCheck) })),
      debts.map(d => ({ ...d, total: Number(d.total), monthlyPayment: Number(d.monthlyPayment) }))
    );
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={2}>
        <ModalHeader textAlign="center" bg="#F0F8FF" borderTopRadius="2xl">
          <VStack spacing={2}>
            {data.avatar && (
              <Avatar
                src={data.avatar}
                size="xl"
                mb={2}
                alignSelf="center"
                name={data.name || "User"}
              />
            )}
            <Text fontWeight="bold" fontSize="2xl" color="blue.500">
              <FaMoneyCheckAlt style={{ marginRight: 8, display: "inline" }} />
              Edit Financial Settings
            </Text>
          </VStack>
        </ModalHeader>
        <ModalBody bg="#F0F8FF">
          <VStack spacing={8} align="stretch">
            {/* Savings Accounts */}
            <Box>
              <HStack mb={2}>
                <FaPiggyBank color="#68d391" size={22} />
                <Text fontWeight="bold" color="gray.600" fontSize="lg">Savings Accounts</Text>
                <Tooltip label="You can have several savings goals. Each one can be automatic and deducted from one or both paychecks.">
                  <InfoOutlineIcon color="gray.400" />
                </Tooltip>
              </HStack>
              <VStack spacing={3} align="stretch">
                {savingsAccounts.length === 0 && canEdit && (
                  <Button leftIcon={<AddIcon />} size="sm" mt={2} onClick={handleAddSavings} colorScheme="blue" alignSelf="center">
                    Add Savings Account
                  </Button>
                )}
                {savingsAccounts.map((a, idx) => (
                  <Box key={idx} bg="white" p={3} borderRadius="lg" boxShadow="sm" position="relative">
                    <HStack spacing={2} mb={2}>
                      <Input
                        placeholder="Name"
                        value={a.name}
                        onChange={e => handleInput(setSavingsAccounts, idx, "name", e.target.value, savingsAccounts)}
                        isDisabled={!canEdit}
                        fontWeight="bold"
                      />
                      <Input
                        placeholder="Total"
                        type="number"
                        value={a.amount === 0 ? "" : a.amount}
                        onChange={e => handleInput(setSavingsAccounts, idx, "amount", e.target.value, savingsAccounts)}
                        isDisabled={!canEdit}
                      />
                      <Input
                        placeholder="Monthly Savings"
                        type="number"
                        value={a.perCheck === 0 ? "" : a.perCheck}
                        onChange={e => handleInput(setSavingsAccounts, idx, "perCheck", e.target.value, savingsAccounts)}
                        isDisabled={!canEdit}
                      />
                      <Select
                        value={a.currency}
                        onChange={e => handleInput(setSavingsAccounts, idx, "currency", e.target.value, savingsAccounts)}
                        isDisabled={!canEdit}
                      >
                        <option value="USD">USD</option>
                        <option value="COP">COP</option>
                      </Select>
                      <Select
                        value={a.paycheck}
                        onChange={e => handleInput(setSavingsAccounts, idx, "paycheck", e.target.value, savingsAccounts)}
                        isDisabled={!canEdit}
                      >
                        {CHEQUES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </Select>
                      <FormControl display="flex" alignItems="center">
                        <Switch
                          isChecked={!!a.auto}
                          onChange={e => handleInput(setSavingsAccounts, idx, "auto", e.target.checked, savingsAccounts)}
                          isDisabled={!canEdit}
                        />
                        <Text ml={2} fontSize="sm">Auto</Text>
                      </FormControl>
                      {canEdit && (
                        <IconButton
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          aria-label="Delete"
                          onClick={() => handleDeleteSavings(idx)}
                        />
                      )}
                    </HStack>
                    <Badge colorScheme="green" fontSize="xs">
                      {a.auto ? "Automatic" : "Manual"} | {CHEQUES.find(c => c.value === a.paycheck)?.label}
                    </Badge>
                  </Box>
                ))}
                {savingsAccounts.length > 0 && canEdit && (
                  <Button leftIcon={<AddIcon />} size="sm" mt={2} onClick={handleAddSavings} colorScheme="blue" alignSelf="flex-start">
                    Add Savings Account
                  </Button>
                )}
              </VStack>
            </Box>
            <Divider />
            {/* Debts */}
            <Box>
              <HStack mb={2}>
                <FaMoneyCheckAlt color="#f56565" size={22} />
                <Text fontWeight="bold" color="gray.600" fontSize="lg">Debts</Text>
                <Tooltip label="You can have several debts. Each one can be paid from a specific paycheck.">
                  <InfoOutlineIcon color="gray.400" />
                </Tooltip>
              </HStack>
              <VStack spacing={3} align="stretch">
                {debts.length === 0 && canEdit && (
                  <Button leftIcon={<AddIcon />} size="sm" mt={2} onClick={handleAddDebt} colorScheme="red" alignSelf="center">
                    Add Debt
                  </Button>
                )}
                {debts.map((d, idx) => (
                  <Box key={idx} bg="white" p={3} borderRadius="lg" boxShadow="sm" position="relative">
                    <HStack spacing={2} mb={2}>
                      <Input
                        placeholder="Name"
                        value={d.name}
                        onChange={e => handleInput(setDebts, idx, "name", e.target.value, debts)}
                        isDisabled={!canEdit}
                        fontWeight="bold"
                      />
                      <Input
                        placeholder="Total Debt"
                        type="number"
                        value={d.total === 0 ? "" : d.total}
                        onChange={e => handleInput(setDebts, idx, "total", e.target.value, debts)}
                        isDisabled={!canEdit}
                      />
                      <Input
                        placeholder="Monthly Payment"
                        type="number"
                        value={d.monthlyPayment === 0 ? "" : d.monthlyPayment}
                        onChange={e => handleInput(setDebts, idx, "monthlyPayment", e.target.value, debts)}
                        isDisabled={!canEdit}
                      />
                      <Select
                        value={d.currency}
                        onChange={e => handleInput(setDebts, idx, "currency", e.target.value, debts)}
                        isDisabled={!canEdit}
                      >
                        <option value="USD">USD</option>
                        <option value="COP">COP</option>
                      </Select>
                      <Select
                        value={d.paycheck}
                        onChange={e => handleInput(setDebts, idx, "paycheck", e.target.value, debts)}
                        isDisabled={!canEdit}
                      >
                        {CHEQUES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </Select>
                      {canEdit && (
                        <IconButton
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          aria-label="Delete"
                          onClick={() => handleDeleteDebt(idx)}
                        />
                      )}
                    </HStack>
                    <Badge colorScheme="red" fontSize="xs">
                      {CHEQUES.find(c => c.value === d.paycheck)?.label}
                    </Badge>
                  </Box>
                ))}
                {debts.length > 0 && canEdit && (
                  <Button leftIcon={<AddIcon />} size="sm" mt={2} onClick={handleAddDebt} colorScheme="red" alignSelf="flex-start">
                    Add Debt
                  </Button>
                )}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter bg="#F0F8FF" borderBottomRadius="2xl">
          {canEdit && (
            <Button onClick={handleSave} borderRadius="xl" px={6} colorScheme="blue" mr={2}>
              Save
            </Button>
          )}
          <Button onClick={onClose} borderRadius="xl" px={6}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}