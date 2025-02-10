import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RecipeDetails() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (id) {
      fetchRecipe();
      fetchComments();
    }
  }, [id]);

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`http://localhost:8000/recipes/${id}`);
      if (!response.ok) throw new Error(`שגיאה בקבלת המתכון. סטטוס: ${response.status}`);
      const data = await response.json();
      setRecipe(data);
      setRating(data.rating || 0.0);
      setLoading(false);
    } catch (error) {
      console.error("❌ שגיאה בשליפת מתכון:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      if (!id) return;
      const response = await fetch(`http://localhost:8000/recipes/${id}/comments`);
      if (!response.ok) throw new Error("שגיאה בשליפת תגובות");
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("❌ שגיאה בשליפת תגובות:", error);
    }
  };

  const handleAddComment = async () => {
    try {
      if (!userId) return alert("יש להתחבר כדי להגיב!");
      if (!id) return;

      const response = await fetch(`http://localhost:8000/recipes/${id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          content: newComment
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "שגיאה בהוספת תגובה");
      }

      setNewComment("");
      fetchComments();
      toast.success("✅ תגובה נוספה!");
    } catch (error) {
      console.error("❌ שגיאה בהוספת תגובה:", error);
      toast.error("❌ לא ניתן להוסיף תגובה.");
    }
  };

  if (loading) return <p className="text-center mt-10 text-blue-500">טוען מתכון...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">שגיאה: {error}</p>;
  if (!recipe) return <p className="text-center text-gray-500 mt-10">מתכון לא נמצא.</p>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* תמונת מתכון */}
        <div className="w-full md:w-1/2">
          <img src={`http://localhost:8000${recipe.image_url}`} alt={recipe.name} className="rounded-xl shadow-md w-full" />
        </div>

        {/* פרטי מתכון */}
        <div className="w-full md:w-1/2">
          <h1 className="text-4xl font-bold text-gray-800">{recipe.name}</h1>
          <p className="text-lg text-gray-500 mt-2">{recipe.categories}</p>
          <p className="text-md text-gray-600 mt-1">{recipe.tags}</p>

          <div className="flex items-center gap-4 mt-4">
            <p className="text-lg">⏳ {recipe.cooking_time} דקות</p>
            <p className="text-lg">🍽 {recipe.servings} מנות</p>
          </div>
        </div>
      </div>

      {/* מרכיבים ושלבי הכנה */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div>
          <h2 className="text-2xl font-bold">🥦 מרכיבים</h2>
          <ul className="mt-4 list-disc pl-5">
            {recipe.ingredients.map((ingredient) => (
              <li key={ingredient.id} className="text-lg">{ingredient.name} - {ingredient.quantity} {ingredient.unit}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold">📜 שלבי הכנה</h2>
          <p className="mt-4 text-lg">{recipe.preparation_steps}</p>
        </div>
      </div>

      {/* תגובות */}
      <div className="mt-8 bg-gray-100 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">💬 תגובות</h2>
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="border-b p-2">
              <strong>👤 משתמש {comment.user_id}:</strong>
              <p>{comment.content || "⚠️ שגיאה בהצגת תגובה"}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">אין תגובות</p>
        )}

        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="כתוב תגובה..."
          className="border p-2 w-full mt-4"
        ></textarea>
        <button onClick={handleAddComment} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
          💬 הוסף תגובה
        </button>
      </div>
    </div>
  );
}
