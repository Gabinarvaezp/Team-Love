import React, { useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, useToast, Text, FormControl, FormLabel, Avatar, VStack, HStack
} from "@chakra-ui/react";
import { FaMinus } from "react-icons/fa";

export default function AddExpenseModal({ isOpen, onClose, user, onAdd }) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(user === "wifey" ? "COP" : "USD");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const profilePic = user === "hubby" ? "/hubby.jpg" : "/wifey.jpg";
  const profileName = user === "hubby" ? "Jorgie" : "Gabby";

  const handleSubmit = async () => {
    if (!amount || !category) {
      toast({ title: "Please fill all fields", status: "warning" });
      return;
    }
    setLoading(true);
    await onAdd({ amount: Number(amount), currency, category });
    setAmount("");
    setCategory("");
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xs">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={2} bg="#FFF8F3">
        <ModalHeader textAlign="center" borderTopRadius="2xl" bg="#FFF0F6">
          <VStack spacing={2}>
            <Avatar size="xl" src={profilePic} />
            <Text fontWeight="bold" fontSize="lg" color="gray.700">{profileName}</Text>
            <HStack justify="center" mt={2}>
              <FaMinus color="#D53F8C" />
              <Text fontSize="2xl" fontWeight="bold" color="pink.400">
                Add Expense
              </Text>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalBody>
          <FormControl mb={3}>
            <FormLabel color="gray.600" fontWeight="semibold">$ Amount</FormLabel>
            <Input
              placeholder="Amount"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
              min={0}
            />
          </FormControl>
          <FormControl mb={3}>
            <FormLabel color="gray.600" fontWeight="semibold">Category</FormLabel>
            <Input
              placeholder="e.g. Groceries, Rent, Transport"
              value={category}
              onChange={e => setCategory(e.target.value)}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
            />
          </FormControl>
          <FormControl mb={3}>
            <FormLabel color="gray.600" fontWeight="semibold">Currency</FormLabel>
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
          </FormControl>
        </ModalBody>
        <ModalFooter bg="#FFF0F6" borderBottomRadius="2xl">
          <Button
            colorScheme="pink"
            mr={3}
            onClick={handleSubmit}
            isLoading={loading}
            borderRadius="xl"
            fontWeight="bold"
            px={6}
            disabled={!amount || !category}
          >
            Add
          </Button>
          <Button onClick={onClose} borderRadius="xl" px={6}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}