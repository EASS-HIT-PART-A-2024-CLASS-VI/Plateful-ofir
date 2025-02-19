import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../App.css";

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [featuredRecipe, setFeaturedRecipe] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetch("/api/recipes/")
      .then((response) => response.json())
      .then((data) => {
        setRecipes(data);
        if (data.length > 0) {
          setFeaturedRecipe(data[0]); // מתכון ראשי
        }
      })
      .catch((error) => console.error("Error fetching recipes:", error));
  }, []);

  // פונקציה לסינון מתכונים
const filteredRecipes = recipes.filter(recipe =>
  recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
);

// פונקציה לסינון לפי קטגוריות
const categoryFilteredRecipes = selectedCategory
  ? filteredRecipes.filter(recipe => recipe.categories.includes(selectedCategory))
  : filteredRecipes;


  return (
    <div className="page-container">
    {/* 🔍 חיפוש אלגנטי */}
    <div className="search-container">
      <input
        type="text"
        placeholder="מה בא לך לבשל?"
        className="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    {/* 📸 באנר ראשי עם מתכון מוצג */}
    {featuredRecipe && (
      <div className="featured-recipe">
        <img
          src={featuredRecipe.image_url ? `/api${featuredRecipe.image_url}` : "/api/static/default-recipe.jpg"}
          alt={featuredRecipe.name}
          onError={(e) => { e.target.src = "/api/static/default-recipe.jpg"; }}
        />
        <div className="absolute bottom-10 left-10 bg-white bg-opacity-80 px-10 py-6 rounded-lg shadow-md">
          <h2 className="text-4xl font-bold text-gray-900">{featuredRecipe.name}</h2>
          <p className="text-lg text-gray-700">{featuredRecipe.description || "מתכון מיוחד שכדאי לנסות!"}</p>
          <Link to={`/recipes/${featuredRecipe.id}`} className="inline-block mt-4 bg-[#457B9D] text-white px-6 py-3 rounded-full hover:bg-[#1D3557] transition">
            למתכון המלא
          </Link>
        </div>
      </div>
    )}

    {/* 🏷️ קטגוריות */}
    <div className="category-buttons">
      {["ארוחת בוקר", "ארוחת צהריים", "ארוחת ערב", "קינוחים", "בריא"].map((category) => (
        <button
          key={category}
          onClick={() => setSelectedCategory(selectedCategory === category ? "" : category)}
          className={`category-button ${selectedCategory === category ? "active" : ""}`}
        >
          {category}
        </button>
      ))}
    </div>

    {/* 🥗 תצוגת המתכונים */}
    <div className="recipe-grid">
      {categoryFilteredRecipes.map((recipe) => (
        <Link to={`/recipes/${recipe.id}`} key={recipe.id} className="recipe-card">
          <img
            src={recipe.image_url ? `/api${recipe.image_url}` : "/api/static/default-recipe.jpg"}
            alt={recipe.name}
            className="recipe-image"
            onError={(e) => { e.target.src = "/api/static/default-recipe.jpg"; }}
          />
          <div className="recipe-details">
            <h4 className="recipe-title">{recipe.name}</h4>
            <p className="recipe-time">⏳ זמן הכנה: {recipe.cooking_time} דקות</p>
          </div>
        </Link>
      ))}
    </div>
  </div>
  );
}
