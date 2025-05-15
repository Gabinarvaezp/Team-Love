import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { db } from "./firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

export const COP_TO_USD = 4000;

export function convertToUSD(amount, currency) {
  if (currency === "COP") {
    return Math.round((Number(amount) / COP_TO_USD) * 100) / 100;
  }
  return Number(amount);
}

export function formatMoney(amount, currency = "USD") {
  const num = Number(amount) || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Utilidad para ordenar por fecha (más reciente primero)
function sortByDate(arr, field = "Fecha") {
  return arr.sort((a, b) => {
    const da = new Date(a[field] || 0);
    const db_ = new Date(b[field] || 0);
    return db_ - da;
  });
}

// Exporta TODO a Excel: ingresos, gastos variables, gastos fijos, deudas, ahorros, resumen general y por usuario
export async function exportToExcel() {
  // 1. Ingresos
  const incomesSnap = await getDocs(collection(db, "incomes"));
  const incomes = incomesSnap.docs.map(doc => ({
    Tipo: "Ingreso",
    Monto: doc.data().amount,
    Moneda: doc.data().currency,
    Usuario: doc.data().user,
    Fuente: doc.data().source || "",
    Fecha: doc.data().createdAt?.toDate?.().toLocaleDateString?.("es-CO") || ""
  }));

  // 2. Gastos variables
  const expensesSnap = await getDocs(collection(db, "expenses"));
  const expenses = expensesSnap.docs.map(doc => ({
    Tipo: "Gasto variable",
    Monto: doc.data().amount,
    Moneda: doc.data().currency,
    Usuario: doc.data().user,
    Categoria: doc.data().category || "",
    Fecha: doc.data().createdAt?.toDate?.().toLocaleDateString?.("es-CO") || ""
  }));

  // 3. Gastos fijos, deudas y ahorros (de cada usuario)
  const users = [
    { uid: "hubby@cozy.com", nombre: "Hubby" },
    { uid: "wifey@cozy.com", nombre: "Wifey" }
  ];
  let fixedRows = [];
  let debtRows = [];
  let savingsRows = [];
  let resumenUsuarios = [];
  let totalIngresos = 0;
  let totalGastos = 0;
  let totalAhorros = 0;
  let totalSaldo = 0;

  for (const u of users) {
    const onboardingSnap = await getDoc(doc(db, "onboarding", u.uid));
    let currentSavings = 0;
    if (onboardingSnap.exists()) {
      const data = onboardingSnap.data();
      // Gastos fijos
      (data.fixed || []).forEach(f => {
        fixedRows.push({
          Tipo: "Gasto fijo",
          Usuario: u.nombre,
          Nombre: f.name,
          Monto: f.amount,
          Moneda: f.currency,
          Auto: f.auto ? "Sí" : "No",
          Cheque: f.paycheck || "",
        });
      });
      // Deuda
      if (data.debt && data.debt.payment) {
        debtRows.push({
          Tipo: "Deuda",
          Usuario: u.nombre,
          Nombre: data.debt.name || "",
          PagoMensual: data.debt.payment,
          Moneda: data.debt.currency,
          Auto: data.debt.auto ? "Sí" : "No",
          Cheque: data.debt.paycheck || "",
        });
      }
      // Ahorro automático
      if (data.savings && data.savings.amount) {
        savingsRows.push({
          Tipo: "Ahorro automático",
          Usuario: u.nombre,
          Monto: data.savings.amount,
          Moneda: data.savings.currency,
          Auto: data.savings.auto ? "Sí" : "No",
          Cheque: data.savings.paycheck || "",
        });
        totalAhorros += Number(data.savings.amount || 0);
      }
      // Saldo actual
      currentSavings = Number(data.currentSavings || 0);
    }

    // Suma ingresos y gastos de este usuario
    const userIncomes = incomes.filter(i => i.Usuario === u.nombre);
    const userExpenses = expenses.filter(e => e.Usuario === u.nombre);
    const ingresos = userIncomes.reduce((acc, i) => acc + Number(i.Monto || 0), 0);
    const gastos = userExpenses.reduce((acc, e) => acc + Number(e.Monto || 0), 0);

    totalIngresos += ingresos;
    totalGastos += gastos;
    totalSaldo += currentSavings;

    resumenUsuarios.push({
      Usuario: u.nombre,
      "Total Ingresos": ingresos,
      "Total Gastos": gastos,
      "Saldo Actual (Ahorro)": currentSavings
    });
  }

  // 4. Resumen general
  const resumenGeneral = [
    { Concepto: "Total Ingresos", Valor: totalIngresos },
    { Concepto: "Total Gastos", Valor: totalGastos },
    { Concepto: "Total Ahorros Automáticos", Valor: totalAhorros },
    { Concepto: "Saldo Actual (Ahorro)", Valor: totalSaldo },
    { Concepto: "Balance Global", Valor: totalIngresos - totalGastos }
  ];

  // 5. Junta todo en diferentes hojas
  const wb = XLSX.utils.book_new();

  // Resumen general
  const wsResumen = XLSX.utils.json_to_sheet(resumenGeneral);
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen General");

  // Resumen por usuario
  const wsResumenUsuarios = XLSX.utils.json_to_sheet(resumenUsuarios);
  XLSX.utils.book_append_sheet(wb, wsResumenUsuarios, "Resumen por Usuario");

  // Ingresos y gastos variables juntos, ordenados por fecha y usuario
  const movimientos = sortByDate([...incomes, ...expenses], "Fecha");
  movimientos.sort((a, b) => a.Usuario.localeCompare(b.Usuario));
  const wsMov = XLSX.utils.json_to_sheet(movimientos);
  XLSX.utils.book_append_sheet(wb, wsMov, "Movimientos");

  // Gastos fijos
  if (fixedRows.length) {
    const wsFixed = XLSX.utils.json_to_sheet(fixedRows);
    XLSX.utils.book_append_sheet(wb, wsFixed, "Gastos Fijos");
  }

  // Deudas
  if (debtRows.length) {
    const wsDebt = XLSX.utils.json_to_sheet(debtRows);
    XLSX.utils.book_append_sheet(wb, wsDebt, "Deudas");
  }

  // Ahorros
  if (savingsRows.length) {
    const wsSavings = XLSX.utils.json_to_sheet(savingsRows);
    XLSX.utils.book_append_sheet(wb, wsSavings, "Ahorros");
  }

  // 6. Exporta el archivo
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, "finanzas_pareja_completo.xlsx");
}