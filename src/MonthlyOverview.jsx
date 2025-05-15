import React from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Box, Text, VStack, Divider
} from "@chakra-ui/react";
import { formatMoney } from "./utils";

export default function MonthlyOverview({ isOpen, onClose, summary }) {
  if (!summary) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={2}>
        <ModalHeader textAlign="center" bg="#F0FFF0" borderTopRadius="2xl">
          <Text fontWeight="bold" fontSize="2xl" color="green.500">
            Monthly Overview
          </Text>
        </ModalHeader>
        <ModalBody bg="#F0FFF0">
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="bold" color="gray.600">Fixed Expenses:</Text>
              <Text fontSize="lg" color="gray.800">{formatMoney(summary.fixed, "USD")}</Text>
            </Box>
            <Divider />
            <Box>
              <Text fontWeight="bold" color="gray.600">Debt Payments:</Text>
              <Text fontSize="lg" color="gray.800">{formatMoney(summary.debt, "USD")}</Text>
            </Box>
            <Divider />
            <Box>
              <Text fontWeight="bold" color="gray.600">Auto Savings:</Text>
              <Text fontSize="lg" color="gray.800">{formatMoney(summary.savings, "USD")}</Text>
            </Box>
            <Divider />
            <Box>
              <Text fontWeight="bold" color="gray.600">Variable Expenses:</Text>
              <Text fontSize="lg" color="gray.800">{formatMoney(summary.variable, "USD")}</Text>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter bg="#F0FFF0" borderBottomRadius="2xl">
          <Button onClick={onClose} borderRadius="xl" px={6} colorScheme="green">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}