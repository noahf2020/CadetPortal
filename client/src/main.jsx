/**
 * main.jsx
 *
 * Entry point of the React app. It finds the "root" div in index.html
 * and draws the App component inside it.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
