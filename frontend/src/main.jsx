import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './estilos.css';

// O React precisa montar a aplicação em um ponto único para as quatro telas da cartilha.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
