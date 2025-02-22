import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../App.css";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import timeIcon from '../assets/icons/time-image.png';
import categoriesIcon from '../assets/icons/category-image.png';
import tagsIcon from '../assets/icons/tag-image.png';

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

const sliderSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 3000,
};
  


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

    {recipes.length > 0 && (
      <Slider {...sliderSettings} className="recipe-carousel">
        {recipes.slice(0, 5).map((recipe) => (
          <Link to={`/recipes/${recipe.id}`} key={recipe.id} className="carousel-slide">
            <img src={recipe.image_url ? `/api${recipe.image_url}` : "/api/static/default-recipe.jpg"} alt={recipe.name} />
            <h2>{recipe.name}</h2>
          </Link>
        ))}
      </Slider>
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
        <h3 className="recipe-title">{recipe.name}</h3>
          {/* 🏷️ קטגוריות */}
          <div className="recipe-info">
            <img src={categoriesIcon} alt="קטגוריות" className="info-icon" />
            <span className="recipe-category">{recipe.categories || "ללא קטגוריה"}</span>
          </div>

          {/* 🔖 תגיות */}
          <div className="recipe-info">
            <img src={tagsIcon} alt="תגיות" className="info-icon" />
            <span className="recipe-tags"> {recipe.tags}</span>
          </div>

          {/* ⏳ זמן הכנה */}
          <div className="recipe-info">
            <img src={timeIcon} alt="זמן הכנה" className="info-icon" />
            <span className="recipe-time">{recipe.cooking_time} דקות</span>
          </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
  );
}
