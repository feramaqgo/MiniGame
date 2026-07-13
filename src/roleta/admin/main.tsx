import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Admin from "./Admin.tsx";
import "../index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Admin />
  </StrictMode>
);
