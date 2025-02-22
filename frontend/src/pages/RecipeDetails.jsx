import { useState, useEffect, useRef  } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChatDrawer from "../components/ChatDrawer";
import RatingStars from "../components/RatingStars";
import CommentItem from "../components/CommentItem";
import ShoppingListPopup from "../components/ShoppingListPopup";
import beepSound from "../assets/beep.wav";
import { useChat } from '../context/ChatContext';
import shareIcon from "../assets/icons/share-image.png";
import cookingTimeIcon from "../assets/icons/time-image.png";
import servingIcon from "../assets/icons/serving-image.png";
import tagicon from "../assets/icons/tag-image.png";
import pauseIcon from "../assets/icons/pause-image.png";
import stopIcon from "../assets/icons/stop-image.png";
import playIcon from "../assets/icons/play-image.png";
import TimerIcon from "../assets/icons/timer-image.png";

import "../App.css";

export default function RecipeDetails() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [newCommentName, setNewCommentName] = useState(""); 
  const [rating, setRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("user_id");
  const [activeTimers, setActiveTimers] = useState({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatDrawerRef = useRef(null);
  const [servings, setServings] = useState(null); 
  const [scaledIngredients, setScaledIngredients] = useState([]);
  const [scaledNutrition, setScaledNutrition] = useState({});
  const [originalIngredients, setOriginalIngredients] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { openChat } = useChat();
  const [showShareInput, setShowShareInput] = useState(false);
  const [shareUsername, setShareUsername] = useState("");


  useEffect(() => {
    if (id) {
      fetchRecipe();
      fetchComments();
    }
  }, [id]);

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${id}`);
      if (!response.ok) throw new Error(`שגיאה בקבלת המתכון. סטטוס: ${response.status}`);
      const data = await response.json();
  
      console.log("📥 נתוני מתכון שהתקבלו:", data); 
      setRecipe(data);
      setServings(data.servings);
      setScaledNutrition(data.nutritional_info);
      setOriginalIngredients(data.ingredients); 
      setScaledIngredients(data.ingredients);
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
      const response = await fetch(`/api/recipes/${id}/comments`);
      if (!response.ok) throw new Error("שגיאה בשליפת תגובות");
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("❌ שגיאה בשליפת תגובות:", error);
    }
  };

  // הוספת תגובה ראשית (למתכון)
  const handleAddComment = async () => {
    try {
      if (!userId) return alert("יש להתחבר כדי להגיב!");
      if (!id) return;
      if (!newComment.trim()) {
        alert("לא ניתן לשלוח תגובה ריקה");
        return;
      }
      const response = await fetch(`/api/recipes/${id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          username: newCommentName || "אנונימי",
          content: newComment
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "שגיאה בהוספת תגובה");
      }
      setNewComment("");
      setNewCommentName("");
      toast.success("✅ תגובה נוספה!");
      fetchComments();
    } catch (error) {
      console.error("❌ שגיאה בהוספת תגובה:", error);
      toast.error("❌ לא ניתן להוסיף תגובה.");
    }
  };
  

  // טיפול בשליחת תגובת reply – onReply מופעל בתוך רכיב CommentItem
  const handleReply = async (parentCommentId, replyText, replyName) => {
    if (!userId) {
      alert("יש להתחבר כדי להגיב!");
      return;
    }
  
    const payload = {
      user_id: userId,
      username: replyName || "אנונימי",
      content: replyText
    };
  
    console.log("📤 שולח תגובת reply:", payload); // ✅ הדפסת הנתונים שנשלחים לשרת
  
    try {
      const response = await fetch(`/api/recipes/${id}/comments/${parentCommentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error("❌ שגיאה בשליחת תגובה:", data);  // ✅ הדפס שגיאה מפורטת
        throw new Error(data.detail || "שגיאה בשליחת תגובה");
      }
  
      toast.success("✅ תגובתך נוספה!");
      fetchComments();
    } catch (error) {
      console.error("❌ שגיאה בשליחת תגובה:", error);
      toast.error("❌ לא ניתן לשלוח תגובה.");
    }
  };
  

  // פונקציה לבניית עץ תגובות מקונן מתוך מערך תגובות שטוח
  function buildCommentTree(allComments) {
    const map = {};
    allComments.forEach((c) => {
      map[c.id] = { ...c, replies: [] };
    });
    const roots = [];
    allComments.forEach((c) => {
      if (c.parent_id) {
        if (map[c.parent_id]) {
          map[c.parent_id].replies.push(map[c.id]);
        }
      } else {
        roots.push(map[c.id]);
      }
    });
    return roots;
  }

  const commentTree = buildCommentTree(comments);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

// 🔥 פונקציה להתחלת טיימר
const startTimer = (stepNumber, durationInMinutes) => {
  // ✅ אם כבר יש טיימר רץ, ננקה אותו
  if (activeTimers[`${stepNumber}_interval`]) {
    clearInterval(activeTimers[`${stepNumber}_interval`]);
  }

  let remainingTime = (activeTimers[stepNumber] > 0) ? activeTimers[stepNumber] : durationInMinutes * 60; // ✅ תמיכה בהמשך מטיימר מוקפא
  setActiveTimers((prev) => ({
    ...prev,
    [stepNumber]: remainingTime,
    [`${stepNumber}_paused`]: false, // ✅ מסיר מצב הקפאה אם היה קיים
  }));

  const interval = setInterval(() => {
    setActiveTimers((prev) => {
      if (prev[`${stepNumber}_paused`]) return prev; // ✅ לא מוריד זמן אם הטיימר מוקפא

      if (prev[stepNumber] <= 1) {  
        clearInterval(interval);
        playBeepSound(); // ✅ השמעת צליל בסוף הטיימר
        return { ...prev, [stepNumber]: 0, [`${stepNumber}_interval`]: null };
      }
      return { ...prev, [stepNumber]: prev[stepNumber] - 1 };
    });
  }, 1000);

  setActiveTimers((prev) => ({
    ...prev,
    [`${stepNumber}_interval`]: interval,
  }));
};

// ✅ פונקציה להפעלת צליל בסיום טיימר
const playBeepSound = () => {
  const audio = new Audio(beepSound);
  audio.play().catch((error) => console.error("❌ שגיאה בהפעלת צליל:", error));
};

// ✅ פונקציה להקפאת הטיימר
const pauseTimer = (stepNumber) => {
  if (activeTimers[`${stepNumber}_paused`]) {
    // ✅ חידוש הטיימר שהופסק
    startTimer(stepNumber, activeTimers[stepNumber] / 60);  
  } else {
    // ✅ עצירת הטיימר
    clearInterval(activeTimers[`${stepNumber}_interval`]);
    setActiveTimers((prev) => ({
      ...prev,
      [`${stepNumber}_paused`]: true, // ✅ סימון כטיימר מוקפא
    }));
  }
};

// ✅ פונקציה לעצירת הטיימר
const stopTimer = (stepNumber) => {
  if (activeTimers[`${stepNumber}_interval`]) {
    clearInterval(activeTimers[`${stepNumber}_interval`]);
  }
  setActiveTimers((prev) => ({
    ...prev,
    [stepNumber]: 0,
    [`${stepNumber}_interval`]: null,
    [`${stepNumber}_paused`]: false,
  }));
};

// ✅ פורמט להצגת זמן בשניות כ-`MM:SS`
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
};

  // ✅ בקשה ל-API כדי לקבל את הכמויות המעודכנות
  const scaleIngredients = (newServings) => {
    if (!originalIngredients || !recipe) return;
    const factor = newServings / recipe.servings;
    setScaledIngredients(
      originalIngredients.map((ingredient) => ({
        ...ingredient,
        quantity: (ingredient.quantity * factor).toFixed(2),
      }))
    );
  };

  // ✅ חישוב ערכים תזונתיים באופן מקומי לפי כמות המנות
  const getScaledNutrition = (newServings) => {
    if (!recipe || !recipe.nutritional_info) return;
    const factor = newServings / recipe.servings;
    setScaledNutrition({
      calories: (recipe.nutritional_info.calories * factor).toFixed(1),
      protein: (recipe.nutritional_info.protein * factor).toFixed(1),
      carbs: (recipe.nutritional_info.carbs * factor).toFixed(1),
      fats: (recipe.nutritional_info.fats * factor).toFixed(1),
    });
  };

  // ✅ שינוי מספר מנות – מבצע חישוב חדש מול השרת
  const handleServingsChange = (e) => {
    const newServings = parseInt(e.target.value);
    setServings(newServings);
    scaleIngredients(newServings); // ✅ שינוי הכמויות של המרכיבים
    getScaledNutrition(newServings); // ✅ עדכון הערכים התזונתיים
  };
  

if (!recipe) return <p className="text-center mt-10">🔄 טוען מתכון...</p>;
if (error) return <p className="text-center text-red-500 mt-10">שגיאה: {error}</p>;

  const handleRateRecipe = async (score) => {
    if (!recipe) return;
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("חייבים להתחבר כדי לדרג!");
      return;
    }
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/rate/`, {
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
      const response = await fetch("/api/ingredient_substitution", {
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
  
  const handleShareRecipe = async () => {
    if (!shareUsername.trim()) {
      alert("נא להזין שם משתמש לשיתוף!");
      return;
    }
  
    try {
      // 🔹 חיפוש ה-User ID לפי שם המשתמש
      const userResponse = await fetch(`/api/users/find/${shareUsername}`);
      if (!userResponse.ok) throw new Error("המשתמש לא נמצא");
  
      const { user_id } = await userResponse.json(); 
  
      // 🔹 שליחת בקשת שיתוף עם ה-User ID שנמצא
      const response = await fetch(`/api/recipes/${id}/share/${user_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
  
      if (!response.ok) {
        throw new Error("שגיאה בשיתוף המתכון");
      }
  
      alert(`✅ המתכון שותף בהצלחה עם ${shareUsername}!`);
      setShowShareInput(false);
      setShareUsername("");
  
    } catch (error) {
      console.error("❌ שגיאה בשיתוף:", error);
      alert("❌ לא ניתן לשתף את המתכון");
    }
  };
  

  if (loading) return <p className="text-center mt-10 text-blue-500">טוען מתכון...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">שגיאה: {error}</p>;
  if (!recipe) return <p className="text-center text-gray-500 mt-10">מתכון לא נמצא.</p>;

  return (
    <div className="max-w-6xl mx-auto p-8">
    <div className="flex flex-col md:flex-row items-start gap-8">
      
      {/* תמונת מתכון */}
      <div className="w-full md:w-1/2 relative"> 
        <img src={`/api${recipe.image_url}`} alt={recipe.name} className="rounded-xl shadow-md w-full" />
  
        {/* 🔹 כפתור שיתוף בפינה הימנית העליונה */}
        <div className="absolute top-4 right-4 bg-gray-200 bg-opacity-50 rounded-full">
          <button onClick={() => setShowShareInput(!showShareInput)}>
            <img src={shareIcon} alt="Share" className="w-8 h-8" />
          </button>
        </div>
  
        {/* 🔹 טופס שיתוף (יופיע רק כאשר `showShareInput` = true) */}
        {showShareInput && (
          <div className="absolute top-14 right-4 bg-white shadow-lg rounded-lg p-4 w-60">
            <input
              type="text"
              value={shareUsername}
              onChange={(e) => setShareUsername(e.target.value)}
              placeholder="שם משתמש"
              className="border px-2 py-1 rounded w-full"
            />
            <button onClick={handleShareRecipe} className="bg-blue-500 text-white px-4 py-2 rounded mt-2 w-full">
              שתף
            </button>
          </div>
        )}
      </div>

      {/* פרטי מתכון */}
      <div className="recipe-details-container">
        <h1 className="recipe-title">{recipe.name}</h1>
        <p className="recipe-category">{recipe.categories}</p>
        <div className="tag-container">
          <img src={tagicon} alt="tags icon" className="tag-icon" />
          <p className="recipe-tags">{recipe.tags}</p>
        </div>

        {/* אזור זמן הכנה, מספר מנות ושאר המידע */}
        <div className="recipe-meta">
          <div className="recipe-info-item">
            <img src={cookingTimeIcon} alt="Cooking Time" className="icon-style" />
            <span>{recipe.cooking_time} דקות</span>
          </div>
          <div className="recipe-info-item">
            <img src={servingIcon} alt="Servings" className="icon-style" />
            <label> מספר מנות:</label>
            <input type="number" min="1" value={servings || ""} onChange={handleServingsChange} className="servings-input"/>
          </div>
        </div>

        {/* ערכים תזונתיים - שורה אחת מתחת */}
        <div className="nutrition-section">
        <div className="nutrition-grid">
            {scaledNutrition ? (
              Object.entries(scaledNutrition).map(([key, value], index) => (
                <div key={index} className="nutrition--card">
                  <div className="nutrition--card-item">
                    <span className="nutrition-value">
                      {Number(value) ? Number(value).toFixed(1) : "N/A"}
                    </span>
                  </div>
                  <p className="nutrition-label">{key}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">🔄 מחשב ערכים תזונתיים...</p>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* מרכיבים ושלבי הכנה */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div>
          <h2 className="text-2xl font-bold">🥦 מרכיבים</h2>
          <ul className="mt-4 list-disc pl-5">
        {scaledIngredients ? (
          scaledIngredients.map((ingredient, index) => (
          <li key={index} className="ingredient-item">
            <span>{ingredient.name} - {ingredient.quantity} {ingredient.unit}</span>
            <button 
              onClick={() => handleFindSubstitute(ingredient.name)} 
              className="substitute-btn">
              🔄 מצא תחליף
            </button>
          </li>

          ))): (
            <p>אין מרכיבים</p>
            )
            }
          </ul>
          {/* כפתור "צור רשימת קניות" */}
          <button onClick={openModal} className="btn-create-shopping-list">
            צור רשימת קניות
          </button>

          {isModalOpen && (
            <ShoppingListPopup
              recipeId={id}
              servings={servings}
              isOpen={isModalOpen} 
              onClose={closeModal}
            />
          )}
        </div>

        <div>
      <h2 className="text-2xl font-bold">📜 שלבי הכנה</h2>
      <ul className="mt-4 space-y-4">
        {recipe.preparation_steps.split("\n").map((step, index) => {
          const stepNumber = index + 1;
          const timer = recipe.timers?.find((t) => t.step_number === stepNumber);

          return (
            <li key={index} className="text-lg flex items-center gap-4">
              {step}
              {timer && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => startTimer(stepNumber, timer.duration)}
                    className="timer-button"
                  >
                    <img 
                      src={TimerIcon} 
                      alt="Start Timer" 
                      className="timer-icon"
                    />
                    {activeTimers[stepNumber] > 0 
                      ? formatTime(activeTimers[stepNumber]) 
                      : `הפעל טיימר (${timer.duration} דקות)`}
                  </button>

                  {activeTimers[stepNumber] > 0 && (
                    <>
                      <button onClick={() => pauseTimer(stepNumber)} className="pause_play_button">
                        <img 
                          src={activeTimers[`${stepNumber}_paused`] ? playIcon : pauseIcon} 
                          alt="Pause/Play" 
                          className="timer-icon" 
                        />
                      </button>

                      <button onClick={() => stopTimer(stepNumber)} className="stop_button">
                        <img src={stopIcon} alt="Stop" className="timer-icon" />
                      </button>
                    </>
                  )}

                  {activeTimers[stepNumber] === 0 && (
                    <button
                      onClick={() => startTimer(stepNumber, timer.duration)}
                      className="play_again_button"
                    >
                      🔄 
                    </button>
              )}
            </div>
          )}
        </li>
      );
    })}
  </ul>
</div>

        {/* תגובות */}
      <div className="mt-8 bg-gray-100 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">💬 תגובות</h2>

        {/* הצגת דירוג */}
        <p>דירוג ממוצע: {rating.toFixed(2)}</p>
        <RatingStars currentRating={rating} onRate={handleRateRecipe} />

        {/* 🔹 הצגת התגובות */}
        {commentTree.length > 0 ? (
          commentTree.map((comment) => (
            <div key={comment.id} className={`comment ${comment.parent_id ? "comment-reply" : ""}`}>
              <CommentItem comment={comment} onReply={handleReply} />
            </div>
          ))
        ) : (
          <p className="text-gray-500">אין תגובות</p>
        )}

        {/* 🔹 כפתור הוספת תגובה */}
        <button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="comment-toggle-btn"
        >
          {showCommentForm ? "ביטול" : "הוסף תגובה"}
        </button>

        {/* 🔹 טופס הוספת תגובה (יופיע רק אם showCommentForm = true) */}
        {showCommentForm && (
          <div className="comment-input-container">
            <input
              type="text"
              value={newCommentName}
              onChange={(e) => setNewCommentName(e.target.value)}
              placeholder="שם"
            />
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="כתוב תגובה..."
            />
            <button onClick={handleAddComment} className="comment-submit-btn">
              שלח תגובה
            </button>
        </div>
        )}
      </div>
    </div>

      {/* צ'אט */}
      <ChatDrawer
        ref={chatDrawerRef} 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        title="עוזר מתכונים"
      />
    </div>
  );
}
