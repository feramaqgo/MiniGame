import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { iniciarSincronizacao } from "./shared/lib/outbox";

// Qualquer página do arcade escoa a fila de envios pendentes.
iniciarSincronizacao();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
