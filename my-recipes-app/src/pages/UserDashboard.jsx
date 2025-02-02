import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function UserDashboard() {
  const [user, setUser] = useState({ name: "John Doe", email: "john@example.com" }); // 👈 להחליף בנתונים אמיתיים מה-Backend
  const [userRecipes, setUserRecipes] = useState([]);
  const [sharedRecipes, setSharedRecipes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const userId = 1; // 👈 יש לשנות ל-ID של המשתמש המחובר (לפי מערכת האימות שלך)

  useEffect(() => {
    // קבלת רשימת המתכונים שהמשתמש כתב
    fetch(`http://localhost:8000/users/${userId}/recipes`)
      .then((response) => response.json())
      .then((data) => setUserRecipes(data || [])) // 👈 לוודא שהערך לא יהיה undefined
      .catch((error) => console.error("❌ Error fetching user recipes:", error));

    // קבלת רשימת המתכונים ששיתפו עם המשתמש
    fetch(`http://localhost:8000/users/${userId}/shared-recipes`)
      .then((response) => response.json())
      .then((data) => setSharedRecipes(data || []))
      .catch((error) => console.error("❌ Error fetching shared recipes:", error));

    // קבלת התראות על תגובות ושיתופים
    fetch(`http://localhost:8000/users/${userId}/notifications`)
      .then((response) => response.json())
      .then((data) => setNotifications(data || []))
      .catch((error) => console.error("❌ Error fetching notifications:", error));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-center">Welcome, {user.name}!</h2>
      <p className="text-lg text-gray-700 text-center">{user.email}</p>

      {/* 🔔 התראות */}
      <h3 className="text-2xl font-semibold mt-6">Notifications</h3>
      <ul className="border p-4 rounded-lg bg-gray-100">
        {notifications.length > 0 ? (
          notifications.map((notif, index) => (
            <li key={`notif-${index}`} className="border-b p-2">
              <p>{notif.message}</p>
              {notif.link && (
                <Link to={notif.link} className="text-blue-500">
                  View
                </Link>
              )}
            </li>
          ))
        ) : (
          <p className="text-gray-500">No new notifications.</p>
        )}
      </ul>

      {/* 📝 מתכונים של המשתמש */}
      <h3 className="text-2xl font-semibold mt-6">Your Recipes</h3>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userRecipes.length > 0 ? (
          userRecipes.map((recipe) => (
            <li key={`recipe-${recipe.id}`} className="border p-4 rounded-lg shadow-lg bg-white">
              <h3 className="text-xl font-semibold text-gray-800">{recipe.name}</h3>
              <div className="flex justify-between">
                <Link to={`/recipes/${recipe.id}`} className="text-blue-500">View</Link>
                <Link to={`/recipes/edit/${recipe.id}`} className="text-green-500">Edit</Link>
              </div>
            </li>
          ))
        ) : (
          <p className="text-center text-gray-600 col-span-2">No recipes found.</p>
        )}
      </ul>

      {/* 🔄 מתכונים שהמשתמש קיבל בשיתוף */}
      <h3 className="text-2xl font-semibold mt-6">Shared with You</h3>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sharedRecipes.length > 0 ? (
          sharedRecipes.map((recipe) => (
            <li key={`shared-${recipe.id}`} className="border p-4 rounded-lg shadow-lg bg-white">
              <h3 className="text-xl font-semibold text-gray-800">{recipe.name}</h3>
              <Link to={`/recipes/${recipe.id}`} className="text-blue-500">View</Link>
            </li>
          ))
        ) : (
          <p className="text-center text-gray-600 col-span-2">No shared recipes yet.</p>
        )}
      </ul>
    </div>
  );
}
