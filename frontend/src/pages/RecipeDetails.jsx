import { useState, useEffect, useRef  } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChatDrawer from "../components/ChatDrawer";
import RatingStars from "../components/RatingStars";

export default function RecipeDetails() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [timers, setTimers] = useState([]);
  const [rating, setRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("user_id");
  const [activeTimers, setActiveTimers] = useState({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatDrawerRef = useRef(null);


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

        // 🔥 פונקציה להתחלת טיימר
    const startTimer = (stepNumber, duration) => {
        if (timers[stepNumber]) return; // אם כבר רץ טיימר, לא מפעילים מחדש
        let remainingTime = duration;

        const interval = setInterval(() => {
        setTimers((prev) => ({
            ...prev,
            [stepNumber]: remainingTime,
        }));

        if (remainingTime <= 0) {
            clearInterval(interval);
            toast.success(`🚀 טיימר של שלב ${stepNumber} הסתיים!`);
        }
        remainingTime--;
        }, 1000);

        setTimers((prev) => ({
        ...prev,
        [stepNumber]: duration,
        }));
    };

      setNewComment("");
      fetchComments();
      toast.success("✅ תגובה נוספה!");
    } catch (error) {
      console.error("❌ שגיאה בהוספת תגובה:", error);
      toast.error("❌ לא ניתן להוסיף תגובה.");
    }
  };

  const handleRateRecipe = async (score) => {
    if (!recipe) return;
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("חייבים להתחבר כדי לדרג!");
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/recipes/${recipe.id}/rate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: parseInt(userId), score })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP Error ${response.status}`);
      }
      const data = await response.json();
      // data.average_rating
      setRecipe((prev) => ({
        ...prev,
        rating: data.average_rating // עדכון הממוצע
      }));
      setRating(data.average_rating);
      setUserRating(score);
      alert(`דירוגך נשמר! הדירוג הממוצע כעת הוא: ${data.average_rating.toFixed(2)}`);
    } catch (err) {
      console.error("Rating error:", err);
      alert("שגיאה בעת שמירת הדירוג");
    }
  };

  const handleFindSubstitute = async (ingredientName) => {
    // 1. פותחים את הצ'אט
    setIsChatOpen(true);

    // 2. מפעילים את האנימציה "typing..." ע"י setLoading(true) בצ'אט
    if (chatDrawerRef.current) {
      chatDrawerRef.current.setLoading(true);
    }

    try {
      // שולחים בקשה לשרת
      const response = await fetch("http://localhost:8000/ingredient_substitution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: [ingredientName] }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // מוסיפים הודעה לצ'אט
      if (chatDrawerRef.current) {
        chatDrawerRef.current.addMessage(data.substitutes, false);
      }
    } catch (error) {
      if (chatDrawerRef.current) {
        chatDrawerRef.current.addMessage("שגיאה במציאת תחליף", false);
      }
      console.error("Error fetching substitutes:", error);
    } finally {
      // 3. מכבים את האנימציית "typing"
      if (chatDrawerRef.current) {
        chatDrawerRef.current.setLoading(false);
      }
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
              {/* מציג ממוצע */}
              <p>דירוג ממוצע: {rating.toFixed(2)}</p>

              {/* מציג דירוג משתמש */}
              <RatingStars
              currentRating={rating} 
              onRate={handleRateRecipe}
            />
          </div>
        </div>
      </div>

      {/* ערכים תזונתיים */}
      <h3 className="text-2xl font-semibold text-gray-800 mb-3">ערכים תזונתיים</h3>
      <div className="grid grid-cols-3 gap-4">
        {recipe.nutritional_info ? (
          Object.entries(recipe.nutritional_info).map(([key, value], index) => (
            <div key={index} className="p-3 bg-gray-100 text-center rounded-lg">
              <span className="block text-lg font-bold text-gray-800">{value}</span>
              <span className="text-gray-500 text-sm">{key}</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No nutritional info available.</p>
        )}
      </div>

      {/* מרכיבים ושלבי הכנה */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div>
          <h2 className="text-2xl font-bold">🥦 מרכיבים</h2>
          <ul className="mt-4 list-disc pl-5">
            {recipe.ingredients.map((ingredient) => (
            <li key={ingredient.id}>
              {ingredient.name} - {ingredient.quantity} {ingredient.unit}{" "}
              <button onClick={() => handleFindSubstitute(ingredient.name)}>
                🔄 מצא תחליף
              </button>
            </li>
          ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold">📜 שלבי הכנה</h2>
          <ul className="mt-4 space-y-4">
            {recipe.preparation_steps.split("\n").map((step, index) => {
              const stepNumber = index + 1;
              const timer = timers.find(t => t.step_number === stepNumber);
              return (
                <li key={index} className="text-lg flex items-center gap-4">
                  {step}
                  {timer && (
                    <button
                      onClick={() => startTimer(stepNumber, timer.duration)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    >
                      {activeTimers[stepNumber] ? `⏳ ${activeTimers[stepNumber]}s` : `⏳ הפעל טיימר (${timer.duration}s)`}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
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
        <button onClick={() => alert("הוספת תגובה אינה ממומשת עדיין!")} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
          💬 הוסף תגובה
        </button>
      </div>

      <ChatDrawer
        ref={chatDrawerRef} 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        title="עוזר מתכונים"
      />
    </div>
  );
}
