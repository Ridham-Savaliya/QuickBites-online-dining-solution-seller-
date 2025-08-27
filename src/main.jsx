
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import SellerContextProvider from "./Context/SellerContext.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
   <GoogleOAuthProvider clientId={clientId}>
    <SellerContextProvider>
      <App />
    </SellerContextProvider>
    </GoogleOAuthProvider>
  </BrowserRouter>
);
