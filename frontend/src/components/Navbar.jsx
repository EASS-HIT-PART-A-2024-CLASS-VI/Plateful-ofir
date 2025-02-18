import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/UserContext";
import ChatDrawer from "../components/ChatDrawer";
import { useChat } from '../context/ChatContext';

export default function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { openChat } = useChat();
  const chatDrawerRef = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.warn("⚠️ No token found - User is logged out.");
      setUser(null);
      return;
    }
    console.log("🔹 Token exists:", token);
  }, []);

  const handleLogout = () => {
    console.log("🔴 Logging out - Removing token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user_id");
    setUser(null);
    navigate("/");
  };

  return (
    <>
      <nav className="fixed top-0 w-full bg-white bg-opacity-90 backdrop-blur-md py-4 px-8 flex items-center justify-between shadow-md z-50">
        <div className="flex gap-6 text-md tracking-wide">
          <Link to="/" className="hover:text-[#1D3557] transition-all">דף הבית</Link>
          <Link to="/recipes" className="hover:text-[#1D3557] transition-all">כל המתכונים</Link>
          <Link to="/categories" className="hover:text-[#1D3557] transition-all">קטגוריות</Link>
          {user && (
            <Link to="/dashboard" className="hover:text-[#1D3557] transition-all">איזור אישי</Link>
          )}
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link to="/">
            <img
              src="/Plateful_Logo_Ultra_High_Res.png"
              alt="Plateful Logo"
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="flex items-center gap-6">
            <button
            onClick={() => openChat("איזה מצרכים יש לך?")}
            className="text-[#1D3557] hover:text-blue-700 transition-all"
          >
            🔍 מצא לי מתכון
          </button>

          <button
            onClick={() => openChat("איך אוכל לעזור לך? אשמח לענות על כל שאלה בנושא בישול ומתכונים.")}
            className="text-[#1D3557] hover:text-blue-700 transition-all"
          >
            💭 שאל שאלה
          </button>

          {user ? (
            <p onClick={handleLogout} className="text-[#E63946] hover:text-red-700 transition-all cursor-pointer">
              התנתקות
            </p>
          ) : (
            <Link to="/login" className="hover:text-[#1D3557] transition-all">התחברות</Link>
          )}
        </div>
      </nav>

      {/* ✅ צ'אט יחיד לכל הפעולות */}
      <ChatDrawer
        ref={chatDrawerRef}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        title="עוזר מתכונים"
      />
    </>
  );
}
