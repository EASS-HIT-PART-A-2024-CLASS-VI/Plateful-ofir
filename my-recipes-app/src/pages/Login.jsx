export default function Login() {
    const handleLogin = async (e) => {
        e.preventDefault();
      
        try {
          const response = await fetch("http://localhost:8000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
      
          const data = await response.json();
      
          if (!response.ok) throw new Error(data.detail || "Login failed");
      
          localStorage.setItem("user_id", data.user_id); // 👈 שמירת ה-ID של המשתמש
          toast.success("Logged in successfully!");
          navigate("/dashboard"); // 👈 נווט ללוח הבקרה אחרי התחברות מוצלחת
      
        } catch (error) {
          console.error("❌ Error logging in:", error);
          toast.error("❌ Login failed. Please check your credentials.");
        }
      };
      
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl mb-4">Login</h2>
        <input className="border p-2 mb-2" type="text" placeholder="Username" />
        <input className="border p-2 mb-2" type="password" placeholder="Password" />
        <button className="bg-blue-500 text-white p-2 rounded">Login</button>
      </div>
    );
  }
  