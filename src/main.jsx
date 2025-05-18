import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Importar inicialización de Firebase - esto ejecutará el script de diagnóstico
import './firebaseInit.js'

// Crear un elemento div para mensajes de conexión
const connectivityDiv = document.createElement('div');
connectivityDiv.id = 'firebase-connectivity-status';
connectivityDiv.style.display = 'none';
document.body.appendChild(connectivityDiv);

// Escuchar cambios de red
window.addEventListener('online', () => {
  console.log('Network is online');
  connectivityDiv.style.display = 'none';
});

window.addEventListener('offline', () => {
  console.log('Network is offline');
  connectivityDiv.style.display = 'block';
  connectivityDiv.innerHTML = 'Sin conexión a Internet. Los cambios se guardarán cuando vuelva la conexión.';
  connectivityDiv.style.position = 'fixed';
  connectivityDiv.style.bottom = '0';
  connectivityDiv.style.left = '0';
  connectivityDiv.style.right = '0';
  connectivityDiv.style.padding = '8px';
  connectivityDiv.style.backgroundColor = '#f44336';
  connectivityDiv.style.color = 'white';
  connectivityDiv.style.textAlign = 'center';
  connectivityDiv.style.zIndex = '9999';
});

// Mostrar estado inicial
if (!navigator.onLine) {
  connectivityDiv.style.display = 'block';
  connectivityDiv.innerHTML = 'Sin conexión a Internet. Los cambios se guardarán cuando vuelva la conexión.';
  connectivityDiv.style.position = 'fixed';
  connectivityDiv.style.bottom = '0';
  connectivityDiv.style.left = '0';
  connectivityDiv.style.right = '0';
  connectivityDiv.style.padding = '8px';
  connectivityDiv.style.backgroundColor = '#f44336';
  connectivityDiv.style.color = 'white';
  connectivityDiv.style.textAlign = 'center';
  connectivityDiv.style.zIndex = '9999';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 