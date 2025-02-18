import React, { useEffect, useState } from "react"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css"; 
import { UserProvider } from "./context/UserContext";
import { ChatProvider } from './context/ChatContext';

import SignUp from "./pages/SignUp";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Recipes from "./pages/Recipes";
import RecipeDetails from "./pages/RecipeDetails";
import UserDashboard from "./pages/UserDashboard"; 
import EditRecipe from "./pages/EditRecipe"; 


export default function App() {
  const [backendStatus, setBackendStatus] = useState("🔄 בודק חיבור ל-Backend...");

  useEffect(() => {
    fetch("/api/")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`❌ Backend returned status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("✅ Backend Response:", data);
        setBackendStatus("✅ חיבור ל-Backend תקין!");
      })
      .catch((error) => {
        console.error("❌ Backend connection failed:", error);
        setBackendStatus("❌ שגיאה בחיבור ל-Backend!");
        toast.error("❌ חיבור ל-Backend נכשל!");
      });
  }, []);

  return (
    <UserProvider>
      <ChatProvider>
      <Router>
        <div className="w-full">
          <ToastContainer position="top-center" autoClose={3000} />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/recipes/:id" element={<RecipeDetails />} />
            <Route path="/recipes/edit/:id" element={<EditRecipe />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </div>
      </Router>
      </ChatProvider>
    </UserProvider>
  );
}
