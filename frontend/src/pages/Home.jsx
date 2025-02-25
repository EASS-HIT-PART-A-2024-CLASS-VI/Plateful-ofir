import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../App.css";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import timeIcon from "../assets/icons/time-image.png";
import categoriesIcon from "../assets/icons/category-image.png";
import tagsIcon from "../assets/icons/tag-image.png";

export default function Home() {
  // State for storing recipes, featured recipe, search term, and selected category
  const [recipes, setRecipes] = useState([]);
  const [featuredRecipe, setFeaturedRecipe] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Fetch recipes on component mount
  useEffect(() => {
    fetch("/api/recipes/")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched Recipes:", data);
        setRecipes(data);
        if (data.length > 0) {
          setFeaturedRecipe(data[0]);
        }
      })
      .catch((error) => console.error("Error fetching recipes:", error));
  }, []);

  // Filter recipes by search term
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter recipes by selected category
  const categoryFilteredRecipes = selectedCategory
    ? filteredRecipes.filter((recipe) =>
        recipe.categories.includes(selectedCategory)
      )
    : filteredRecipes;

  // Carousel slider settings
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
      {/* 🔍 Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="מה בא לך לבשל?"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 🔄 Recipe Carousel */}
      {recipes.length > 0 && (
        <Slider {...sliderSettings} className="recipe-carousel">
          {Array.from(new Set(recipes.map((recipe) => recipe.id))).map((id) => {
            const recipe = recipes.find((r) => r.id === id);
            return (
              <Link
                to={`/recipes/${recipe.id}`}
                key={recipe.id}
                className="carousel-slide"
              >
                <img
                  src={
                    recipe.image_url
                      ? `/api${recipe.image_url}`
                      : "/api/static/default-recipe.jpg"
                  }
                  alt={recipe.name}
                />
                <h2>{recipe.name}</h2>
              </Link>
            );
          })}
        </Slider>
      )}

      {/* 🏷️ Category Selection */}
      <div className="category-buttons">
        {["ארוחת בוקר", "ארוחת צהריים", "ארוחת ערב", "קינוחים", "סלטים"].map(
          (category) => (
            <button
              key={category}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === category ? "" : category
                )
              }
              className={`category-button ${
                selectedCategory === category ? "active" : ""
              }`}
            >
              {category}
            </button>
          )
        )}
      </div>

      {/* 🥗 Recipe Grid */}
      <div className="recipe-grid">
        {categoryFilteredRecipes.map((recipe) => (
          <Link
            to={`/recipes/${recipe.id}`}
            key={recipe.id}
            className="recipe-card"
          >
            <img
              src={
                recipe.image_url
                  ? `/api${recipe.image_url}`
                  : "/api/static/default-recipe.jpg"
              }
              alt={recipe.name}
              className="recipe-image"
              onError={(e) => {
                e.target.src = "/api/static/default-recipe.jpg";
              }}
            />
            <div className="recipe-details">
              <h3 className="recipe-title">{recipe.name}</h3>

              {/* 🏷️ Categories */}
              <div className="recipe-info">
                <img
                  src={categoriesIcon}
                  alt="קטגוריות"
                  className="info-icon"
                />
                <span className="recipe-category">
                  {recipe.categories || "ללא קטגוריה"}
                </span>
              </div>

              {/* 🔖 Tags */}
              <div className="recipe-info">
                <img src={tagsIcon} alt="תגיות" className="info-icon" />
                <span className="recipe-tags">{recipe.tags}</span>
              </div>

              {/* ⏳ Cooking Time */}
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
