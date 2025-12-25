import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "@/app";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Root element not found. Check if it's in your index.html or if the id is correct.",
  );
}
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
