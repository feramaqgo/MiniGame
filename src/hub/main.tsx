import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Hub from "./Hub.tsx";
import { registrarServiceWorker } from "../shared/lib/pwa";
import "../index.css";

registrarServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Hub />
  </StrictMode>
);
