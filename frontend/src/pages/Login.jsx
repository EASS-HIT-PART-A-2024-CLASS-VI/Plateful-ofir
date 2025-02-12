import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/UserContext"; // ✅ חיבור ל-Context

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useAuth(); // ✅ עדכון המשתמש המחובר
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (response.status === 404) {
        // אם המשתמש לא נמצא, נציע לו הרשמה
        const confirmRegister = window.confirm("משתמש לא נמצא, האם ברצונך להירשם?");
        if (confirmRegister) {
          await handleRegister();
        }
        return;
      }

      if (!response.ok) throw new Error("פרטי ההתחברות שגויים");

      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user_id", data.user.id);

      // ✅ עדכון המשתמש ב-Context
      setUser(data.user);

      navigate("/dashboard"); // ✅ מעבר לדשבורד
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = async () => {
    try {
      const username = email.split("@")[0]; // ✅ יצירת שם משתמש אוטומטי מהמייל
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });

      if (!response.ok) throw new Error("שגיאה בהרשמה");

      alert("✅ הרשמה בוצעה בהצלחה! אנא התחבר מחדש.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">התחברות</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-gray-700 mb-2">אימייל</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-gray-700 mb-2">סיסמה</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600 transition duration-200"
        >
          התחבר
        </button>
      </form>

      <p className="text-center text-gray-600 mt-4">
        אין לך חשבון?{" "}
        <Link to="/signup" className="text-blue-500 hover:underline">
          הירשם כאן
        </Link>
      </p>
    </div>
  );
}
