import React from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Avatar, Text, VStack, Box, Badge, Divider
} from "@chakra-ui/react";
import { formatMoney } from "./utils";

export default function ProfileModal({ isOpen, onClose, profile, name }) {
  if (!profile) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={2}>
        <ModalHeader textAlign="center" bg="#F0F8FF" borderTopRadius="2xl">
          <VStack spacing={2}>
            <Avatar size="xl" src={name === "Jorgie" ? "/hubby.jpg" : "/wifey.jpg"} />
            <Text fontWeight="bold" fontSize="lg" color="gray.700">{name}</Text>
            <Badge colorScheme={name === "Jorgie" ? "blue" : "pink"}>{name === "Jorgie" ? "HUBBY" : "WIFEY"}</Badge>
          </VStack>
        </ModalHeader>
        <ModalBody bg="#F0F8FF">
          <Box mb={3}>
            <Text fontWeight="bold" color="gray.500">Balance:</Text>
            <Text fontSize="2xl" color={name === "Jorgie" ? "blue.500" : "pink.400"}>
              {formatMoney(profile.balance || 0, "USD")}
            </Text>
          </Box>
          <Divider my={2} />
          <Box mb={3}>
            <Text fontWeight="bold" color="gray.500">Current Savings:</Text>
            <Text color={name === "Jorgie" ? "blue.500" : "pink.400"} fontWeight="bold">
              {formatMoney(profile.currentSavings || 0, "USD")}
            </Text>
          </Box>
          <Divider my={2} />
          <Box mb={3}>
            <Text fontWeight="bold" color="gray.500">Auto Savings:</Text>
            {profile.savings && profile.savings.amount ? (
              <Text color={name === "Jorgie" ? "blue.500" : "pink.400"} fontWeight="bold">
                {formatMoney(profile.savings.amount, profile.savings.currency || "USD")} {profile.savings.currency} {profile.savings.auto && <Badge colorScheme="green" ml={1}>Auto</Badge>}
              </Text>
            ) : <Text color="gray.400">None</Text>}
          </Box>
          <Divider my={2} />
          <Box>
            <Text fontWeight="bold" color="gray.500">Debt:</Text>
            {profile.debt && profile.debt.payment ? (
              <Text color="red.400" fontWeight="bold">
                {formatMoney(profile.debt.payment, profile.debt.currency || "USD")} {profile.debt.currency} {profile.debt.auto && <Badge colorScheme="red" ml={1}>Auto</Badge>}
              </Text>
            ) : <Text color="gray.400">None</Text>}
          </Box>
        </ModalBody>
        <ModalFooter bg="#F0F8FF" borderBottomRadius="2xl">
          <Button onClick={onClose} borderRadius="xl" px={6} colorScheme="blue">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}