import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RecipeDetails() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [shareUserId, setShareUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8000/recipes/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("📥 Received Recipe Data:", data);
        setRecipe(data);
        setLoading(false); // וודא שהטעינה מסתיימת
      })
      .catch((error) => {
        console.error("❌ Error fetching recipe:", error);
        setError(error.message);
        setLoading(false);
      });
  }, [id]);
  
  

  if (loading) return <p className="text-center mt-10 text-blue-500">Loading recipe...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">Error: {error}</p>;
  if (!recipe) return <p className="text-center text-gray-500 mt-10">Recipe not found.</p>; // ✅ הגנה על `null`

  // בניית URL לתמונה, תוך שימוש בתמונה דיפולטית אם אין `image_url`
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "http://localhost:8000/static/default-recipe.jpg";
    return `http://localhost:8000${imageUrl}`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* תמונת המתכון */}
      <div className="w-full flex justify-center mb-6">
        <img
          src={getImageUrl(recipe.image_url)}
          alt={recipe.name}
          className="rounded-lg shadow-md max-h-64 object-cover"
          onError={(e) => {
            console.log("🚨 Image failed to load:", e.target.src);
            e.target.src = "http://localhost:8000/static/default-recipe.jpg"; // ✅ גיבוי אם טעינת התמונה נכשלת
          }}
        />
      </div>

      <h2 className="text-3xl font-bold text-center">{recipe.name}</h2>
      <p className="text-lg text-gray-700 mt-2">⏳ Cooking Time: {recipe.cooking_time} min</p>
      <p className="text-lg text-gray-700">📂 Category: {recipe.categories}</p>
      <p className="text-lg text-gray-700">⭐ Rating: {recipe.rating} ⭐️</p>

      {/* 🛒 הצגת רשימת מצרכים */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold">🛒 Ingredients</h3>
          <ul className="list-disc ml-6">
            {recipe.ingredients.map((ing, index) => (
              <li key={index}>
                {ing.quantity} {ing.unit} {ing.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 📊 הצגת מידע תזונתי */}
      {recipe.nutritional_info && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">📝 Nutritional Information</h3>
            <p className="text-gray-700"><strong>🍽 Portion Size:</strong> {recipe.nutritional_info.portion_size || "N/A"} g/ml</p>
            <p className="text-gray-700 mt-2"><strong>🔥 Calories:</strong> {recipe.nutritional_info.calories} kcal</p>
            <p className="text-gray-700"><strong>💪 Protein:</strong> {recipe.nutritional_info.protein} g</p>
            <p className="text-gray-700"><strong>🍞 Carbs:</strong> {recipe.nutritional_info.carbs} g</p>
            <p className="text-gray-700"><strong>🥑 Fats:</strong> {recipe.nutritional_info.fats} g</p>
        </div>
    )}

      {/* 📜 הצגת שלבי הכנה */}
      {recipe.preparation_steps && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-gray-800">📜 Preparation Steps</h3>
          <p className="text-gray-700 whitespace-pre-line">{recipe.preparation_steps}</p>
        </div>
      )}
      {/* ⏳ טיימרים לכל שלב */}
        {recipe.timers && recipe.timers.length > 0 && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">⏳ Cooking Timers</h3>
            <ul className="list-disc ml-6">
            {recipe.timers.map((timer, index) => (
                <li key={index} className="text-gray-700">
                <strong>Step {timer.step_number}:</strong> {timer.duration} minutes ({timer.label})
                </li>
            ))}
            </ul>
        </div>
        )}

        {/* 📝 הצגת תגובות */}
        {recipe.comments && recipe.comments.length > 0 && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">📝 Comments</h3>
            <ul>
            {recipe.comments.map((comment, index) => (
                <li key={index} className="border-b p-2">
                <strong>{comment.user_name}:</strong> ⭐ {comment.rating} <br />
                {comment.content}
                </li>
            ))}
            </ul>
        </div>
        )}

      {/* 📤 שיתוף מתכון */}
      <div className="flex items-center gap-4 mt-6">
        <input
          type="text"
          className="border p-2 rounded"
          placeholder="Enter user ID"
          value={shareUserId}
          onChange={(e) => setShareUserId(e.target.value)}
        />
        <button
          onClick={() => {
            if (!shareUserId) {
              toast.warn("⚠️ Please enter a user ID to share with!");
              return;
            }

            fetch(`http://localhost:8000/recipes/${id}/share/${shareUserId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error("❌ Recipe already shared with this user or invalid user ID");
                }
                return response.json();
              })
              .then((data) => {
                console.log("✅ Recipe shared:", data);
                toast.success(`🎉 Recipe shared successfully with user ${shareUserId}!`);
                setShareUserId(""); // ✅ איפוס השדה לאחר השיתוף
              })
              .catch((error) => {
                console.error("❌ Error sharing recipe:", error);
                toast.error("❌ Failed to share recipe. Please try again.");
              });
          }}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          📤 Share
        </button>
      </div>
    </div>
  );
}
