import { createContext, useState, useEffect, useContext } from "react";

export const UserContext = createContext();

export const useAuth = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            console.warn("⚠️ No token found - Skipping fetch.");
            setLoading(false);
            return;
        }

        console.log("🔹 Token found:", token);

        fetchUserData(token);
    }, []); // ✅ ייטען רק פעם אחת בעת עליית הדף

    const fetchUserData = async (token) => {
        if (!token) {
            console.warn("⚠️ No token found - Skipping request.");
            return;
        }
    
        console.log("🔹 Sending token:", token);
    
        try {
            const response = await fetch("http://localhost:8000/users/me", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
    
            const responseText = await response.text();
            console.log("🔍 Backend response:", responseText); // ✅ לראות מה ה-Backend מחזיר בדיוק
    
            if (!response.ok) {
                console.error("❌ Backend error response:", response.status, responseText);
                return;  // ❌ אין למחוק את הטוקן אם יש בעיה זמנית
            }
    
            const data = JSON.parse(responseText);
            console.log("✅ User data received:", data);
            setUser(data);
        } catch (error) {
            console.error("❌ Error fetching user:", error);
        }
    };
    

    return (
        <UserContext.Provider value={{ user, setUser, loading }}>
            {children}
        </UserContext.Provider>
    );
};
