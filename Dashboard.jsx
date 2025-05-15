import React from "react";

export default function Dashboard({ user, onLogout }) {
  return (
    <div style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
      <h1>¡Bienvenido, {user === "hubby" ? "Hubby" : "Wifey"}!</h1>
      <p>Aquí irá el resumen de tus finanzas y botones para agregar gastos, ingresos, etc.</p>
      <button onClick={onLogout} style={{ marginTop: 20 }}>Cerrar sesión</button>
    </div>
  );
}