import React, { useState } from "react";
import { Box, Button, Input, Select, VStack, Heading, Text, Checkbox } from "@chakra-ui/react";
import { db, auth } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export default function OnboardingWizard({ user, onFinish }) {
  const [step, setStep] = useState(0);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [debt, setDebt] = useState({ name: "", total: "", payment: "", auto: false });
  const [saving, setSaving] = useState({ amount: "", auto: false });
  const [input, setInput] = useState({ name: "", amount: "", currency: user === "wifey" ? "COP" : "USD", auto: false, period: "first" });

  const addExpense = () => {
    setFixedExpenses([...fixedExpenses, input]);
    setInput({ name: "", amount: "", currency: user === "wifey" ? "COP" : "USD", auto: false, period: "first" });
  };

  const finish = async () => {
    await setDoc(doc(db, "onboarding", auth.currentUser.uid), {
      fixedExpenses,
      debt,
      saving,
    });
    onFinish();
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="#FFF8F3">
      <Box bg="white" p={8} borderRadius="2xl" boxShadow="lg" minW="320px" maxW="400px">
        <VStack spacing={4}>
          <Heading size="md">Welcome, {user === "hubby" ? "Jorgie" : "Gabby"}! ✈️🏡</Heading>
          {step === 0 && (
            <>
              <Text fontWeight="bold">Add a fixed monthly expense</Text>
              <Input placeholder="Name" value={input.name} onChange={e => setInput({ ...input, name: e.target.value })} />
              <Input placeholder="Amount" type="number" value={input.amount} onChange={e => setInput({ ...input, amount: e.target.value })} />
              <Select value={input.currency} onChange={e => setInput({ ...input, currency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="COP">COP</option>
              </Select>
              <Select value={input.period} onChange={e => setInput({ ...input, period: e.target.value })}>
                <option value="first">First half</option>
                <option value="second">Second half</option>
              </Select>
              <Checkbox isChecked={input.auto} onChange={e => setInput({ ...input, auto: e.target.checked })}>Automatic payment</Checkbox>
              <Button colorScheme="blue" onClick={addExpense}>Add Expense</Button>
              <Button colorScheme="green" onClick={() => setStep(1)}>Next</Button>
            </>
          )}
          {step === 1 && (
            <>
              <Text fontWeight="bold">Add a debt (optional)</Text>
              <Input placeholder="Debt name" value={debt.name} onChange={e => setDebt({ ...debt, name: e.target.value })} />
              <Input placeholder="Total amount" type="number" value={debt.total} onChange={e => setDebt({ ...debt, total: e.target.value })} />
              <Input placeholder="Monthly payment" type="number" value={debt.payment} onChange={e => setDebt({ ...debt, payment: e.target.value })} />
              <Checkbox isChecked={debt.auto} onChange={e => setDebt({ ...debt, auto: e.target.checked })}>Automatic payment</Checkbox>
              <Button colorScheme="blue" onClick={() => setStep(2)}>Next</Button>
            </>
          )}
          {step === 2 && (
            <>
              <Text fontWeight="bold">Add a saving plan (optional)</Text>
              <Input placeholder="Monthly saving amount" type="number" value={saving.amount} onChange={e => setSaving({ ...saving, amount: e.target.value })} />
              <Checkbox isChecked={saving.auto} onChange={e => setSaving({ ...saving, auto: e.target.checked })}>Automatic saving</Checkbox>
              <Button colorScheme="green" onClick={finish}>Finish</Button>
            </>
          )}
        </VStack>
      </Box>
    </Box>
  );
}