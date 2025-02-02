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
      .then((response) => response.json())
      .then((data) => {
        setRecipe(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [id]);

  const handleShare = () => {
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
        setShareUserId(""); // איפוס השדה לאחר השיתוף
      })
      .catch((error) => {
        console.error("❌ Error sharing recipe:", error);
        toast.error("❌ Failed to share recipe. Please try again.");
      });
  };

  if (loading) return <p className="text-center mt-10 text-blue-500">Loading recipe...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">Error: {error}</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center">{recipe.name}</h2>
      <p className="text-lg text-gray-700 mt-2">Cooking Time: {recipe.cooking_time} min</p>
      <p className="text-lg text-gray-700">Category: {recipe.categories}</p>

      <div className="flex items-center gap-4 mt-4">
        <input
          type="text"
          className="border p-2 rounded"
          placeholder="Enter user ID"
          value={shareUserId}
          onChange={(e) => setShareUserId(e.target.value)}
        />
        <button
          onClick={handleShare}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          📤 Share
        </button>
      </div>
    </div>
  );
}
