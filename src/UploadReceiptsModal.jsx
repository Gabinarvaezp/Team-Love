import React, { useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, VStack, HStack, Text, Input, Avatar
} from "@chakra-ui/react";
import { FaReceipt } from "react-icons/fa";

export default function UploadReceiptsModal({ isOpen, onClose, user, onUpload }) {
  const [files, setFiles] = useState([]);
  const profilePic = user === "hubby" ? "/hubby.jpg" : "/wifey.jpg";
  const profileName = user === "hubby" ? "Jorgie" : "Gabby";

  const handleFileChange = (e) => {
    setFiles([...e.target.files].slice(0, 10));
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    onUpload(files);
    setFiles([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xs">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" p={2} bg="#FFFDEB">
        <ModalHeader textAlign="center" borderTopRadius="2xl" bg="#FEF3C7">
          <VStack spacing={2}>
            <Avatar size="xl" src={profilePic} />
            <Text fontWeight="bold" fontSize="lg" color="gray.700">{profileName}</Text>
            <HStack justify="center" mt={2}>
              <FaReceipt color="#D69E2E" />
              <Text fontSize="2xl" fontWeight="bold" color="yellow.600">
                Upload Receipts
              </Text>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              borderRadius="xl"
              bg="white"
            />
            <Text fontSize="sm" color="gray.500">
              You can upload up to 10 images at a time.
            </Text>
            {files.length > 0 && (
              <Text fontSize="sm" color="green.500">
                {files.length} file(s) selected
              </Text>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter bg="#FEF3C7" borderBottomRadius="2xl">
          <Button
            colorScheme="yellow"
            mr={3}
            onClick={handleUpload}
            borderRadius="xl"
            fontWeight="bold"
            px={6}
            disabled={files.length === 0}
          >
            Upload
          </Button>
          <Button onClick={onClose} borderRadius="xl" px={6}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}