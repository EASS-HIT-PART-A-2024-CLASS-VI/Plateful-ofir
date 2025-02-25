import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import timerIcon from "../assets/icons/timer-image.png";
import timeIcon from "../assets/icons/time-image.png";
import servingsIcon from "../assets/icons/serving-image.png";
import categoriesIcon from "../assets/icons/category-image.png";
import tagsIcon from "../assets/icons/tag-image.png";
import deleteIcon from "../assets/icons/delete-image.png";
import addIcon from "../assets/icons/add-image.png";
import "../App.css";

export default function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timers, setTimers] = useState([]);

  useEffect(() => {
    fetch(`/api/recipes/${id}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("📥 Loaded Recipe Data:", data);
        setRecipe(data);
        setIngredients(data.ingredients || []);
        setTimers(data.timers || []);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return <p className="text-center mt-10 text-blue-500">Loading recipe...</p>;
  if (error)
    return <p className="text-center text-red-500 mt-10">Error: {error}</p>;
  if (!recipe)
    return <p className="text-center text-gray-500 mt-10">Recipe not found.</p>;

  const handleChange = (e) => {
    setRecipe({ ...recipe, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const addTimer = () => {
    setTimers([...timers, { step_number: "", duration: "", label: "" }]);
  };

  const handleTimerChange = (index, field, value) => {
    const updatedTimers = [...timers];
    updatedTimers[index][field] = value;
    setTimers(updatedTimers);
  };

  const removeTimer = (index) => {
    setTimers(timers.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index][field] = value;
    setIngredients(updatedIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "" }]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const formattedTimers = timers.map((timer) => ({
    step_number: parseInt(timer.step_number, 10),
    duration: parseInt(timer.duration, 10),
    label: timer.label,
  }));
  console.log("📤 טיימרים שנשלחים:", formattedTimers);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("user_id");

    if (!userId) {
      toast.error("❌ אנא התחבר כדי לערוך מתכון.");
      return;
    }

    const formData = new FormData();
    Object.entries(recipe).forEach(([key, value]) =>
      formData.append(key, value)
    );
    formData.append("current_user_id", userId);
    formData.append("ingredients", JSON.stringify(ingredients));
    formData.append("timers", JSON.stringify(formattedTimers));
    console.log("📤 JSON של טיימרים שנשלח:", JSON.stringify(formattedTimers));
    if (image) formData.append("image", image);

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.detail || "❌ שגיאה בעדכון המתכון");

      console.log("✅ מתכון עודכן:", data);

      toast.success("✅ מתכון עודכן בהצלחה!");
      navigate(`/recipes/${id}`);
    } catch (error) {
      console.error("❌ Error updating recipe:", error);
      toast.error(error.message || "❌ שגיאה בלתי צפויה.");
    }
  };

  return (
    // Main container for the edit recipe form
    <div className="recipe-form-container">
      {/* Form header */}
      <h2 className="recipe-title"> ערוך מתכון</h2>

      {/* Main form element */}
      <form onSubmit={handleSubmit} className="recipe-form">
        {/* Recipe name section */}
        <label className="form-label">שם מתכון:</label>
        <input
          type="text"
          name="name"
          value={recipe.name}
          onChange={handleChange}
          className="form-input"
          placeholder="שם המתכון"
          required
        />

        {/* Ingredients section */}
        <label className="section-title"> מרכיבים: </label>
        {/* Dynamic ingredients list */}
        {ingredients.map((ingredient, index) => (
          <div key={index} className="ingredient-container">
            {/* Ingredient name input */}
            <input
              type="text"
              placeholder="שם המרכיב"
              value={ingredient.name}
              onChange={(e) =>
                handleIngredientChange(index, "name", e.target.value)
              }
              className="form-input"
              required
            />
            {/* Quantity input */}
            <input
              type="number"
              placeholder="כמות"
              value={ingredient.quantity}
              onChange={(e) =>
                handleIngredientChange(index, "quantity", e.target.value)
              }
              className="form-input-small"
              required
            />
            {/* Unit input */}
            <input
              type="text"
              placeholder="יחידת מידה"
              value={ingredient.unit}
              onChange={(e) =>
                handleIngredientChange(index, "unit", e.target.value)
              }
              className="form-input-small"
              required
            />
            {/* Delete ingredient button */}
            <button
              type="button"
              onClick={() => removeIngredient(index)}
              className="btn btn-delete"
            >
              <img src={deleteIcon} alt="Delete" className="icon-edit-create" />
            </button>
          </div>
        ))}
        {/* Add ingredient button */}
        <button type="button" onClick={addIngredient} className="btn btn-add">
          <img src={addIcon} alt="Add" className="icon-edit-create" /> הוסף
          מרכיב
        </button>

        {/* Preparation steps section */}
        <label className="form-label">שלבי הכנה:</label>
        <textarea
          name="preparation_steps"
          value={recipe.preparation_steps}
          onChange={handleChange}
          className="form-input"
          placeholder="שלבי הכנה"
          required
        />

        {/* Cooking time section */}
        <label className="form-label">
          <img src={timeIcon} alt="Time" className="icon-edit-create" />
          זמן הכנה:
        </label>
        <input
          type="number"
          name="cooking_time"
          value={recipe.cooking_time}
          onChange={handleChange}
          className="form-input"
          placeholder="זמן הכנה (דקות)"
          required
        />

        {/* Servings section */}
        <label className="form-label">
          <img src={servingsIcon} alt="Servings" className="icon-edit-create" />
          כמות מנות:
        </label>
        <input
          type="number"
          name="servings"
          value={recipe.servings}
          onChange={handleChange}
          className="form-input"
          placeholder="כמות מנות"
          required
        />

        {/* Categories section */}
        <label className="form-label">
          <img
            src={categoriesIcon}
            alt="Categories"
            className="icon-edit-create"
          />
          קטגוריה:
        </label>
        <input
          type="text"
          name="categories"
          value={recipe.categories}
          onChange={handleChange}
          className="form-input"
          placeholder="קטגוריה"
          required
        />

        {/* Tags section */}
        <label className="form-label">
          <img src={tagsIcon} alt="Tags" className="icon-edit-create" />
          תגית:
        </label>
        <input
          type="text"
          name="tags"
          value={recipe.tags}
          onChange={handleChange}
          className="form-input"
          placeholder="תגית"
        />

        {/* Timers section */}
        <label className="form-label">
          <img src={timerIcon} alt="Timers" className="icon-edit-create" />{" "}
          טיימרים:
        </label>
        {/* Dynamic timers list */}
        {timers.map((timer, index) => (
          <div key={index} className="timer-container">
            {/* Step number input */}
            <input
              type="number"
              placeholder="מס' שלב"
              value={timer.step_number}
              onChange={(e) =>
                handleTimerChange(index, "step_number", e.target.value)
              }
              className="form-input-small"
              required
            />
            {/* Duration input */}
            <input
              type="number"
              placeholder="זמן (דקות)"
              value={timer.duration}
              onChange={(e) =>
                handleTimerChange(index, "duration", e.target.value)
              }
              className="form-input-small"
              required
            />
            {/* Timer label input */}
            <input
              type="text"
              placeholder="תיאור"
              value={timer.label}
              onChange={(e) =>
                handleTimerChange(index, "label", e.target.value)
              }
              className="form-input"
              required
            />
            {/* Delete timer button */}
            <button
              type="button"
              onClick={() => removeTimer(index)}
              className="btn btn-delete"
            >
              <img src={deleteIcon} alt="Delete" className="icon-edit-create" />
            </button>
          </div>
        ))}
        {/* Add timer button */}
        <button type="button" onClick={addTimer} className="btn btn-add">
          <img src={addIcon} alt="Add" className="icon-edit-create" /> הוסף
          טיימר
        </button>

        {/* Image upload section */}
        <input
          type="file"
          onChange={handleImageChange}
          className="form-input"
          accept="image/*"
        />

        {/* Submit button */}
        <button type="submit" className="btn btn-submit">
          {" "}
          עדכן מתכון{" "}
        </button>
      </form>
    </div>
  );
}
