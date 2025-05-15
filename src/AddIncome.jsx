import React, { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, useDisclosure, Text, FormControl, FormLabel, Avatar, VStack
} from "@chakra-ui/react";
import { convertToUSD } from "./utils";

export default function AddIncome({ user, onAdded }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(user === "wifey" ? "COP" : "USD");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);

  const profilePic = user === "hubby" ? "/hubby.jpg" : "/wifey.jpg";
  const profileName = user === "hubby" ? "Jorgie" : "Gabby";

  const handleAdd = async () => {
    setLoading(true);
    try {
      const usdAmount = convertToUSD(Number(amount), currency);
      await addDoc(collection(db, "incomes"), {
        user,
        amount: Number(amount),
        currency,
        usdAmount,
        source,
        createdAt: serverTimestamp(),
      });
      setAmount("");
      setSource("");
      onClose();
      if (onAdded) onAdded();
    } catch (e) {
      alert("Error saving income: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button colorScheme="blue" leftIcon={<span>➕</span>} onClick={onOpen} w="100%">
        Add Income
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xs">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" p={2}>
          <ModalHeader textAlign="center" bg="#F0F8FF" borderTopRadius="2xl">
            <VStack spacing={2}>
              <Avatar size="xl" src={profilePic} />
              <Text fontWeight="bold" fontSize="lg" color="gray.700">{profileName}</Text>
              <Text fontSize="2xl" fontWeight="bold" color="blue.400" mt={2}>
                Add Income
              </Text>
            </VStack>
          </ModalHeader>
          <ModalBody bg="#F0F8FF">
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
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel color="gray.600" fontWeight="semibold">Source</FormLabel>
              <Input
                placeholder="Source"
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
            {currency === "COP" && amount && (
              <Text fontSize="sm" color="gray.500" textAlign="right">
                ≈ ${convertToUSD(Number(amount), "COP")} USD
              </Text>
            )}
          </ModalBody>
          <ModalFooter bg="#F0F8FF" borderBottomRadius="2xl">
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleAdd}
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
    </>
  );
}