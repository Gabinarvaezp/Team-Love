import React, { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, useDisclosure, Text, FormControl, FormLabel, Avatar, VStack, HStack
} from "@chakra-ui/react";
import { convertToUSD } from "./utils";
import { FaMinus } from "react-icons/fa";

export default function AddExpense({ user, onAdded }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(user === "wifey" ? "COP" : "USD");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const profilePic = user === "hubby" ? "/hubby.jpg" : "/wifey.jpg";
  const profileName = user === "hubby" ? "Jorgie" : "Gabby";

  const handleAdd = async () => {
    setLoading(true);
    try {
      const usdAmount = convertToUSD(Number(amount), currency);
      await addDoc(collection(db, "expenses"), {
        user,
        amount: Number(amount),
        currency,
        usdAmount,
        category,
        createdAt: serverTimestamp(),
      });
      setAmount("");
      setCategory("");
      onClose();
      if (onAdded) onAdded();
    } catch (e) {
      alert("Error saving expense: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        colorScheme="pink"
        leftIcon={<FaMinus />}
        onClick={onOpen}
        w="100%"
        borderRadius="xl"
        fontWeight="bold"
        fontSize="lg"
        boxShadow="md"
      >
        Add Expense
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xs" motionPreset="slideInBottom">
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
            {currency === "COP" && amount && (
              <Text fontSize="sm" color="gray.500" textAlign="right" mt={-2}>
                ≈ <b>${convertToUSD(Number(amount), "COP")}</b> USD
              </Text>
            )}
          </ModalBody>
          <ModalFooter bg="#FFF0F6" borderBottomRadius="2xl">
            <Button
              colorScheme="pink"
              mr={3}
              onClick={handleAdd}
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
    </>
  );
}