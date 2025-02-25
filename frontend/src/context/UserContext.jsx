import { createContext, useState, useEffect, useContext } from "react";

// Create a context for user authentication
export const UserContext = createContext();

// Custom hook to easily access the UserContext
export const useAuth = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  // State to hold the current user data; null means no user is logged in
  const [user, setUser] = useState(null);
  // State to indicate whether user data is still being loaded
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Retrieve the auth token from localStorage
    const token = localStorage.getItem("authToken");

    if (!token) {
      // If no token is found, log a warning and stop loading
      console.warn("⚠️ No token found - Skipping fetch.");
      setLoading(false);
      return;
    }

    console.log("🔹 Token found:", token);

    // Fetch the user data from the backend using the token
    fetchUserData(token);
  }, []); // Run only once when the component mounts

  // Function to fetch user data from the backend using the token
  const fetchUserData = async (token) => {
    if (!token) {
      console.warn("⚠️ No token found - Skipping request.");
      return;
    }

    console.log("🔹 Sending token:", token);

    try {
      // Send a GET request to fetch current user data
      const response = await fetch("http://localhost:8000/users/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Get the raw text response for debugging purposes
      const responseText = await response.text();
      console.log("🔍 Backend response:", responseText);

      if (!response.ok) {
        // If the response is not OK, log an error and exit without removing the token
        console.error(
          "❌ Backend error response:",
          response.status,
          responseText
        );
        return;
      }

      // Parse the response text as JSON and update the user state
      const data = JSON.parse(responseText);
      console.log("✅ User data received:", data);
      setUser(data);
    } catch (error) {
      // Log any errors encountered during the fetch
      console.error("❌ Error fetching user:", error);
    }
  };

  // Provide the user data, setter, and loading state to child components
  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
