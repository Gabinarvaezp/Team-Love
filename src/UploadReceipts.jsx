import React, { useState } from "react";
import { storage, db, auth } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, useDisclosure, Text, Avatar, VStack, Select, HStack, Box, useToast
} from "@chakra-ui/react";
import { convertToUSD } from "./utils";
import { FaReceipt } from "react-icons/fa";

export default function UploadReceipts({ user, onUploaded }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [files, setFiles] = useState([]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(user === "wifey" ? "COP" : "USD");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const profilePic = user === "hubby" ? "/hubby.jpg" : "/wifey.jpg";
  const profileName = user === "hubby" ? "Jorgie" : "Gabby";

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 10) {
      toast({ title: "You can upload up to 10 images at once.", status: "warning" });
      setFiles(selected.slice(0, 10));
    } else {
      setFiles(selected);
    }
  };

  const handleUpload = async () => {
    if (!amount || files.length === 0) {
      toast({ title: "Please enter an amount and select at least one file.", status: "warning" });
      return;
    }
    setLoading(true);
    try {
      const urls = [];
      for (let file of files) {
        const storageRef = ref(storage, `receipts/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        urls.push(url);
      }
      // Register the variable expense automatically
      const usdAmount = convertToUSD(Number(amount), currency);
      await addDoc(collection(db, "expenses"), {
        user,
        amount: Number(amount),
        currency,
        usdAmount,
        category: category || "Receipt",
        receipts: urls,
        createdAt: serverTimestamp(),
      });
      setFiles([]);
      setAmount("");
      setCategory("");
      onClose();
      if (onUploaded) onUploaded();
      toast({ title: "Receipts uploaded and expense registered!", status: "success" });
    } catch (e) {
      toast({ title: "Error uploading receipt: " + e.message, status: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        colorScheme="yellow"
        leftIcon={<FaReceipt />}
        onClick={onOpen}
        w="100%"
        borderRadius="xl"
        fontWeight="bold"
        fontSize="lg"
        boxShadow="md"
      >
        Upload Receipts
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xs">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" p={2}>
          <ModalHeader textAlign="center" bg="#FFFBEA" borderTopRadius="2xl">
            <VStack spacing={2}>
              <Avatar size="xl" src={profilePic} />
              <Text fontWeight="bold" fontSize="lg" color="gray.700">{profileName}</Text>
              <HStack justify="center" mt={2}>
                <FaReceipt color="#D69E2E" />
                <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                  Upload Receipts
                </Text>
              </HStack>
            </VStack>
          </ModalHeader>
          <ModalBody bg="#FFFBEA">
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              mb={3}
              borderRadius="xl"
              bg="white"
            />
            {files.length > 0 && (
              <Box mb={2}>
                <Text fontSize="sm" color="green.500">
                  {files.length} file(s) selected
                </Text>
                <HStack wrap="wrap" spacing={1} mt={1}>
                  {files.map((file, idx) => (
                    <Text key={idx} fontSize="xs" color="gray.500" isTruncated>
                      {file.name}
                    </Text>
                  ))}
                </HStack>
              </Box>
            )}
            <Input
              placeholder="Amount"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              mb={3}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
            />
            <Input
              placeholder="Category (optional)"
              value={category}
              onChange={e => setCategory(e.target.value)}
              mb={3}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
            />
            <Select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              borderRadius="xl"
              bg="white"
              fontSize="lg"
              mb={3}
            >
              <option value="USD">USD</option>
              <option value="COP">COP</option>
            </Select>
            {currency === "COP" && amount && (
              <Text fontSize="sm" color="gray.500" textAlign="right">
                ≈ <b>${convertToUSD(Number(amount), "COP")}</b> USD
              </Text>
            )}
            <Text fontSize="sm" color="gray.500">
              You can upload up to 10 images at once.
            </Text>
          </ModalBody>
          <ModalFooter bg="#FFFBEA" borderBottomRadius="2xl">
            <Button
              colorScheme="yellow"
              mr={3}
              onClick={handleUpload}
              isLoading={loading}
              borderRadius="xl"
              fontWeight="bold"
              px={6}
              disabled={files.length === 0 || !amount}
            >
              Upload & Register Expense
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