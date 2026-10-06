/**
 * main.jsx
 *
 * Entry point of the React app. It finds the "root" div in index.html
 * and draws the App component inside it.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import "./App.css";

// BrowserRouter lets the app show different pages for different URLs
// (for example "/" and "/quizlet") without reloading the whole site.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
