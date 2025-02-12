import React, { useEffect, useState } from "react";  // 🟢 הוספת useEffect
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css"; 
import { UserProvider } from "./context/UserContext";

import SignUp from "./pages/SignUp";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Recipes from "./pages/Recipes";
import RecipeDetails from "./pages/RecipeDetails";
import UserDashboard from "./pages/UserDashboard"; 
import EditRecipe from "./pages/EditRecipe"; 

export default function App() {
  useEffect(() => {
    fetch("http://localhost:8000/")
      .then((res) => {
        console.log("🔎 Response Status:", res.status); // ✅ מדפיס את הסטטוס
        return res.json();
      })
      .then((data) => console.log("✅ Backend Response:", data))
      .catch((error) => console.error("❌ Backend connection failed:", error));
}, []);

  return (
    <UserProvider>
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
    </UserProvider>
    
  );
}
