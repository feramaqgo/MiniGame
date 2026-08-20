import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Hub from "./Hub.tsx";
import { registrarServiceWorker } from "../shared/lib/pwa";
import "../index.css";
import { iniciarSincronizacao } from "../shared/lib/outbox";

registrarServiceWorker();

// Qualquer página do arcade escoa a fila de envios pendentes.
iniciarSincronizacao();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Hub />
  </StrictMode>
);
