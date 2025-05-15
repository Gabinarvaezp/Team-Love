import React, { useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, useToast, Text, FormControl, FormLabel, Avatar, VStack, HStack
} from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";

export default function AddIncomeModal({ isOpen, onClose, user, onAdd }) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(user === "wifey" ? "COP" : "USD");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const profilePic = user === "hubby" ? "/hubby.jpg" : "/wifey.jpg";
  const profileName = user === "hubby" ? "Jorgie" : "Gabby";

  const handleSubmit = async () => {
    if (!amount || !source) {
      toast({ title: "Please fill all fields", status: "warning" });
      return;
    }
    setLoading(true);
    await onAdd({ amount: Number(amount), currency, source });
    setAmount("");
    setSource("");
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xs">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={2} bg="#F0F8FF">
        <ModalHeader textAlign="center" borderTopRadius="2xl" bg="#E0F2FE">
          <VStack spacing={2}>
            <Avatar size="xl" src={profilePic} />
            <Text fontWeight="bold" fontSize="lg" color="gray.700">{profileName}</Text>
            <HStack justify="center" mt={2}>
              <FaPlus color="#3182CE" />
              <Text fontSize="2xl" fontWeight="bold" color="blue.400">
                Add Income
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
            <FormLabel color="gray.600" fontWeight="semibold">Source</FormLabel>
            <Input
              placeholder="e.g. Paycheck, Bonus"
              value={source}
              onChange={e => setSource(e.target.value)}
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
        <ModalFooter bg="#E0F2FE" borderBottomRadius="2xl">
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleSubmit}
            isLoading={loading}
            borderRadius="xl"
            fontWeight="bold"
            px={6}
            disabled={!amount || !source}
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