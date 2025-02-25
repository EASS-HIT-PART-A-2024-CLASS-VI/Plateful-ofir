import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChatDrawer from "../components/ChatDrawer";
import RatingStars from "../components/RatingStars";
import CommentItem from "../components/CommentItem";
import ShoppingListPopup from "../components/ShoppingListPopup";
import beepSound from "../assets/beep.wav";
import { useChat } from "../context/ChatContext";
import shareIcon from "../assets/icons/share-image.png";
import cookingTimeIcon from "../assets/icons/time-image.png";
import servingIcon from "../assets/icons/serving-image.png";
import tagicon from "../assets/icons/tag-image.png";
import pauseIcon from "../assets/icons/pause-image.png";
import stopIcon from "../assets/icons/stop-image.png";
import playIcon from "../assets/icons/play-image.png";
import TimerIcon from "../assets/icons/timer-image.png";
import restartIcon from "../assets/icons/re-do-timer-image.png";

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

  // Function to fetch recipe data from the API
  const fetchRecipe = async () => {
    try {
      // Fetch recipe details by ID
      const response = await fetch(`/api/recipes/${id}`);
      if (!response.ok)
        throw new Error(`Error fetching recipe. Status: ${response.status}`);
      const data = await response.json();

      console.log("📥 Recipe data received:", data);

      // Update state with recipe details
      setRecipe(data);
      setServings(data.servings);
      setScaledNutrition(data.nutritional_info);
      setOriginalIngredients(data.ingredients);
      setScaledIngredients(data.ingredients);
      setRating(data.rating || 0.0);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching recipe:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      if (!id) return;
      // Fetch recipe comments
      const response = await fetch(`/api/recipes/${id}/comments`);
      if (!response.ok) throw new Error("Error fetching comments");
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("❌ Error fetching comments:", error);
    }
  };

  // Function to add a new primary comment to the recipe
  const handleAddComment = async () => {
    try {
      if (!userId) return alert("You need to be logged in to comment!");
      if (!id) return;
      if (!newComment.trim()) {
        alert("Comment cannot be empty");
        return;
      }
      // Send request to add a new comment
      const response = await fetch(`/api/recipes/${id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          username: newCommentName || "Anonymous",
          content: newComment,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error adding comment");
      }
      // Reset input fields and refresh comments
      setNewComment("");
      setNewCommentName("");
      toast.success("✅ Comment added!");
      fetchComments();
    } catch (error) {
      console.error("❌ Error adding comment:", error);
      toast.error("❌ Could not add comment.");
    }
  };

  // Handle sending a reply to an existing comment
  const handleReply = async (parentCommentId, replyText, replyName) => {
    if (!userId) {
      alert("You need to be logged in to reply!");
      return;
    }

    const payload = {
      user_id: userId,
      username: replyName || "Anonymous",
      content: replyText,
    };

    console.log("📤 Sending reply:", payload);

    try {
      const response = await fetch(
        `/api/recipes/${id}/comments/${parentCommentId}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Error sending reply:", data);
        throw new Error(data.detail || "Error sending reply");
      }

      toast.success("✅ Your reply has been added!");
      fetchComments();
    } catch (error) {
      console.error("❌ Error sending reply:", error);
      toast.error("❌ Could not send reply.");
    }
  };

  // Function to build a nested comment structure from a flat array
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

  // Start a cooking timer for a specific step
  const startTimer = (stepNumber, durationInMinutes) => {
    // If there's already a running timer, clear it
    if (activeTimers[`${stepNumber}_interval`]) {
      clearInterval(activeTimers[`${stepNumber}_interval`]);
    }

    let remainingTime =
      activeTimers[stepNumber] > 0
        ? activeTimers[stepNumber]
        : durationInMinutes * 60;
    setActiveTimers((prev) => ({
      ...prev,
      [stepNumber]: remainingTime,
      [`${stepNumber}_paused`]: false, // Remove paused state if it exists
    }));

    const interval = setInterval(() => {
      setActiveTimers((prev) => {
        if (prev[`${stepNumber}_paused`]) return prev; // Don't reduce time if paused

        if (prev[stepNumber] <= 1) {
          clearInterval(interval);
          playBeepSound(); // Play sound at the end of the timer
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

  // Play sound when the timer finishes
  const playBeepSound = () => {
    const audio = new Audio(beepSound);
    audio
      .play()
      .catch((error) => console.error("❌ Error playing sound:", error));
  };

  // Pause or resume a timer
  const pauseTimer = (stepNumber) => {
    if (activeTimers[`${stepNumber}_paused`]) {
      // Resume paused timer
      startTimer(stepNumber, activeTimers[stepNumber] / 60);
    } else {
      // Pause the running timer
      clearInterval(activeTimers[`${stepNumber}_interval`]);
      setActiveTimers((prev) => ({
        ...prev,
        [`${stepNumber}_paused`]: true,
      }));
    }
  };

  // Stop the timer completely
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

  // Format time display to MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  // Scale ingredients based on the new serving size
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

  // Scale nutritional values based on servings
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

  // Update servings, ingredients, and nutrition dynamically
  const handleServingsChange = (e) => {
    const newServings = parseInt(e.target.value);
    setServings(newServings);
    scaleIngredients(newServings);
    getScaledNutrition(newServings);
  };

  // ✅ Function to handle rating a recipe
  const handleRateRecipe = async (score) => {
    if (!recipe) return; // Ensure recipe exists before proceeding
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("You must be logged in to rate!");
      return;
    }
    try {
      // Send the rating request to the server
      const response = await fetch(`/api/recipes/${recipe.id}/rate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: parseInt(userId), score }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Error rating recipe:", data);
        throw new Error(data.detail || `HTTP Error ${response.status}`);
      }

      // ✅ Update recipe rating and display new average rating
      setRecipe((prev) => ({
        ...prev,
        rating: data.average_rating, // Update rating in state
      }));
      setRating(data.average_rating); // Update rating state

      alert(
        `Your rating has been saved! The new average rating is: ${data.average_rating.toFixed(
          2
        )}`
      );
    } catch (err) {
      console.error("Rating error:", err);
      alert("Error saving rating");
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

  // Display loading state while fetching the recipe
  if (loading)
    return <p className="text-center mt-10 text-blue-500">Loading recipe...</p>;

  // Display error message if fetching the recipe failed
  if (error)
    return <p className="text-center text-red-500 mt-10">Error: {error}</p>;

  // Display a message if no recipe is found
  if (!recipe)
    return <p className="text-center text-gray-500 mt-10">Recipe not found.</p>;

  return (
    <div className="max-w-7xl mx-auto p-8 w-full">
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* Recipe Image Section */}
        <div className="w-full md:w-1/2 relative">
          <img
            src={`/api${recipe.image_url}`}
            alt={recipe.name}
            className="rounded-xl shadow-md w-full"
          />

          {/* 🔹 Share Button in the top right corner */}
          <div className="absolute top-4 right-4 bg-gray-200 bg-opacity-50 rounded-full">
            <button onClick={() => setShowShareInput(!showShareInput)}>
              <img src={shareIcon} alt="Share" className="w-8 h-8" />
            </button>
          </div>

          {/* 🔹 Share Form (Appears only when `showShareInput` = true) */}
          {showShareInput && (
            <div className="absolute top-14 right-4 bg-white shadow-lg rounded-lg p-4 w-60">
              <input
                type="text"
                value={shareUsername}
                onChange={(e) => setShareUsername(e.target.value)}
                placeholder="שם משתמש"
                className="border px-2 py-1 rounded w-full"
              />
              <button
                onClick={handleShareRecipe}
                className="bg-blue-500 text-white px-4 py-2 rounded mt-2 w-full"
              >
                Share
              </button>
            </div>
          )}
        </div>

        {/* Recipe Details Section */}
        <div className="recipe-details-container">
          <h1 className="recipe-title">{recipe.name}</h1>
          <p className="recipe-category">{recipe.categories}</p>
          <div className="tag-container">
            <img src={tagicon} alt="Tags icon" className="tag-icon" />
            <p className="recipe-tags">{recipe.tags}</p>
          </div>

          {/* Preparation Time, Servings, and Additional Info */}
          <div className="recipe-meta">
            <div className="recipe-info-item">
              <img
                src={cookingTimeIcon}
                alt="Cooking Time"
                className="icon-style"
              />
              <span>{recipe.cooking_time} דקות</span>
            </div>
            <div className="recipe-info-item">
              <img src={servingIcon} alt="Servings" className="icon-style" />
              <label> כמות מנות:</label>
              <input
                type="number"
                min="1"
                value={servings || ""}
                onChange={handleServingsChange}
                className="servings-input"
              />
            </div>
          </div>

          {/* Nutritional values - displayed in a row below */}
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
                <p className="text-gray-500">
                  🔄 Calculating nutritional values...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients and preparation steps */}
      <div className="grid ingredients-steps-container gap-8 mt-8">
        <div>
          <h2 className="text-2xl font-bold">🥦 מרכיבים</h2>
          <ul className="mt-4 list-disc pl-5">
            {scaledIngredients ? (
              scaledIngredients.map((ingredient, index) => (
                <li key={index} className="ingredient-item">
                  <span>
                    {ingredient.name} - {ingredient.quantity} {ingredient.unit}
                  </span>

                  {/* Find substitute button */}
                  <button
                    onClick={() => handleFindSubstitute(ingredient.name)}
                    className="substitute-btn"
                  >
                    <img
                      src={restartIcon}
                      alt="Restart"
                      className="play_again-button"
                    />{" "}
                    מצא תחליף
                  </button>
                </li>
              ))
            ) : (
              <p>No ingredients</p>
            )}
          </ul>

          {/* "Create Shopping List" Button */}
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
              const timer = recipe.timers?.find(
                (t) => t.step_number === stepNumber
              );

              return (
                <li key={index} className="text-lg flex items-center">
                  {step}

                  {/* Timer buttons (only if a timer exists for this step) */}
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
                          {/* Pause/Play Button */}
                          <button
                            onClick={() => pauseTimer(stepNumber)}
                            className="pause_play_button"
                          >
                            <img
                              src={
                                activeTimers[`${stepNumber}_paused`]
                                  ? playIcon
                                  : pauseIcon
                              }
                              alt="Pause/Play"
                              className="timer-icon"
                            />
                          </button>

                          {/* Stop Timer Button */}
                          <button
                            onClick={() => stopTimer(stepNumber)}
                            className="stop_button"
                          >
                            <img
                              src={stopIcon}
                              alt="Stop"
                              className="timer-icon"
                            />
                          </button>
                        </>
                      )}

                      {/* Restart Timer Button */}
                      {activeTimers[stepNumber] === 0 && (
                        <button
                          onClick={() => startTimer(stepNumber, timer.duration)}
                          className="play_again_button"
                        >
                          <img
                            src={restartIcon}
                            alt="Restart"
                            className="play_again-button"
                          />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Comments Section */}
        <div className="mt-8 bg-gray-100 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">💬 תגובות</h2>

          {/* Display average rating */}
          <p> דירוג ממוצע: {recipe.rating.toFixed(2)}</p>
          <div className="recipe-rating">
            <RatingStars
              currentRating={userRating}
              onRate={handleRateRecipe}
              readOnly={false} // ✅ Allows user to rate
            />
          </div>

          {/* 🔹 Display Comments */}
          {commentTree.length > 0 ? (
            commentTree.map((comment) => (
              <div
                key={comment.id}
                className={`comment ${
                  comment.parent_id ? "comment-reply" : ""
                }`}
              >
                <CommentItem comment={comment} onReply={handleReply} />
              </div>
            ))
          ) : (
            <p className="text-gray-500">אין תגובות</p>
          )}

          {/* 🔹 Toggle Add Comment Form */}
          <button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="comment-toggle-btn"
          >
            {showCommentForm ? "בטל" : "הוסף תגובה"}
          </button>

          {/* 🔹 Add Comment Form (Only Appears if showCommentForm = true) */}
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

        {/* Chat Drawer */}
        <ChatDrawer
          ref={chatDrawerRef}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </div>
    </div>
  );
}
