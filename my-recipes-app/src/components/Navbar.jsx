import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/UserContext"; // ✅ שימוש ב-Context לניהול המשתמש

export default function Navbar() {
  const { user, setUser } = useAuth(); // ✅ משיכת המידע על המשתמש
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      console.warn("⚠️ No token found - User is logged out.");
      setUser(null);
      return;
    }

    console.log("🔹 Token exists:", token);
  }, []); // ✅ useEffect רץ רק פעם אחת בעת טעינת הקומפוננטה

  const handleLogout = () => {
    console.log("🔴 Logging out - Removing token");
    localStorage.removeItem("authToken"); 
    localStorage.removeItem("user_id");
    setUser(null);
    navigate("/");
};


  return (
    <nav className="fixed top-0 w-full bg-white bg-opacity-90 backdrop-blur-md py-4 px-8 flex items-center justify-between shadow-md z-50">
      
      {/* תפריט ניווט */}
      <div className="flex gap-12 text-md tracking-wide">
        <Link to="/" className="hover:text-[#1D3557] transition-all">דף הבית</Link>
        <Link to="/recipes" className="hover:text-[#1D3557] transition-all">כל המתכונים</Link>
        <Link to="/categories" className="hover:text-[#1D3557] transition-all">קטגוריות</Link>

        {/* הצגת אזור אישי רק למשתמשים מחוברים */}
        {user && (
          <Link to="/dashboard" className="hover:text-[#1D3557] transition-all">איזור אישי</Link>
        )}
      </div>

      {/* לוגו ממורכז */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <Link to="/">
          <img 
            src="/Plateful_Logo_Ultra_High_Res.png"  
            alt="Plateful Logo" 
            className="h-12 w-auto object-contain" 
          />
        </Link>
      </div>

      {/* התחברות / התנתקות */}
      <div>
        {user ? (
          <button onClick={handleLogout} className="text-[#E63946] hover:text-red-700 transition-all">
            התנתקות
          </button>
        ) : (
          <Link to="/login" className="hover:text-[#1D3557] transition-all">התחברות</Link>
        )}
      </div>
    </nav>
  );
}
