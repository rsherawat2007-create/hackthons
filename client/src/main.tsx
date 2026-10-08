import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { BillingProvider } from "@/context/BillingContext";
import { CompareProvider } from "@/context/CompareContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BillingProvider>
          <CompareProvider>
            <App />
            <Toaster position="top-right" richColors />
          </CompareProvider>
        </BillingProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
