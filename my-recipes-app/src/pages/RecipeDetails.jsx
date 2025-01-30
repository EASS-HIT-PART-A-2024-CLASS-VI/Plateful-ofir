import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function RecipeDetails() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8000/recipes/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setRecipe(data);
        setRating(data.rating);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [id]);

  const handleRate = (newRating) => {
    console.log("📡 Sending rating:", JSON.stringify({ rating: newRating })); // בדיקה
  
    fetch(`http://localhost:8000/recipes/${id}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: newRating }), // 👈 זה חייב להיות JSON תקין
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("✅ Rating updated:", data);
        if (data.new_rating !== undefined) {
          setRating(data.new_rating);
        }
      })
      .catch((error) => console.error("❌ Error updating rating:", error));
  };
  
  

  if (loading) return <p className="text-center mt-10 text-blue-500">Loading recipe...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">Error: {error}</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center">{recipe.name}</h2>
      <p className="text-lg text-gray-700 mt-2">Cooking Time: {recipe.cooking_time} min</p>
      <p className="text-lg text-gray-700">Category: {recipe.categories}</p>
      <p className="text-lg text-gray-700">Current Rating: ⭐ {rating.toFixed(1)} ({recipe.rating_count} votes)</p>
      <h3 className="text-2xl font-semibold mt-4">Rate this recipe:</h3>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            className={`px-3 py-1 rounded ${rating === star ? "bg-yellow-500 text-white" : "bg-gray-200"}`}
          >
            {"⭐".repeat(star)}
          </button>
        ))}
      </div>
    </div>
  );
}
