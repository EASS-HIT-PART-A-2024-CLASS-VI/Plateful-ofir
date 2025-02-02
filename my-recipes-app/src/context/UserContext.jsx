import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // משיכת ה-ID של המשתמש מה-LocalStorage (או API אם צריך)
    const userId = localStorage.getItem("user_id");
    if (userId) {
      setUser({ id: userId });
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
