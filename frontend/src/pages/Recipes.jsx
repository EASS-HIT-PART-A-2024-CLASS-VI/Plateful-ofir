import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import filterIcon from "../assets/icons/filter-image.png";
import timeIcon from '../assets/icons/time-image.png';
import categoriesIcon from '../assets/icons/category-image.png';
import RatingStars from "../components/RatingStars"; 
import tagsIcon from '../assets/icons/tag-image.png';
import starIcon from '../assets/icons/star-image.png';



export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedtag, setSelectedtag] = useState("");
  const [selectedRating, setSelectedRating] = useState(null);
  const [hoveredRating, setHoveredRating] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, settags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const filterButtonRef = useRef(null);

  useEffect(() => {
    fetch("/api/recipes/")
      .then((response) => response.json())
      .then((data) => {
        setRecipes(data);
        setFilteredRecipes(data);
        setLoading(false);
        console.log("📌 נתוני API:", data);
        const uniqueCategories = [...new Set(data.map((r) => r.categories))];
        setCategories(uniqueCategories);

      const uniquetags = [...new Set(data.map((r) => r.tags))];
      settags(uniquetags);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = recipes;

    if (searchTerm) {
      filtered = filtered.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((recipe) =>
        recipe.categories.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (selectedtag) {
      filtered = filtered.filter((recipe) =>
        recipe.tags.toLowerCase() === selectedtag.toLowerCase()
      );
    }

    if (selectedRating !== null) {
      filtered = filtered.filter(
        (recipe) => Math.floor(recipe.rating) === selectedRating
      );
    }

    setFilteredRecipes(filtered);
  }, [searchTerm, selectedCategory,selectedtag, selectedRating, recipes]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target)
      ) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedtag("")
    setSelectedRating(null);
    setHoveredRating(null);
  };

  const hasActiveFilters = searchTerm || selectedCategory || selectedtag ||selectedRating !== null;

  if (loading)
    return <p className="text-center mt-10 text-blue-500">טוען מתכונים...</p>;
  if (error)
    return (
      <p className="text-center text-red-500 mt-10">שגיאה: {error}</p>
    );

  return (
    <div className="recipes-container">
      <h2 className="recipes-title">📖 כל המתכונים</h2>

      <div className="search-filter-container">
        <input
          type="text"
          placeholder="🔎 חפש מתכון..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="relative">
          <button
            className="filter-button"
            ref={filterButtonRef}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <img src={filterIcon} alt="Filter" className="filter-icon" />
          </button>

          {filterOpen && (
            <div
              className="filter-dropdown"
              ref={filterRef}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                padding: '16px',
                width: '250px',
                zIndex: 1000
              }}
            >
              <div className="filter-section">
                <h4 className="filter-title">קטגוריות</h4>
                <div className="filter-grid">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() =>
                        setSelectedCategory(selectedCategory === category ? "" : category)
                      }
                      className={`filter-category-button ${
                        selectedCategory === category ? "active" : ""
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <h4 className="filter-title">תגיות</h4>
                <div className="filter-grid">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() =>
                        setSelectedtag(selectedtag === tag ? "" : tag)
                      }
                      className={`filter-category-button ${
                        selectedtag === tag ? "active" : ""
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-section mt-4">
                <h4 className="filter-title">⭐ דירוג</h4>
                <RatingStars 
                  currentRating={selectedRating} 
                  onRate={(rating) => setSelectedRating(rating === selectedRating ? null : rating)}
                  readOnly={false} 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="recipe-grid">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <Link to={`/recipes/${recipe.id}`} key={recipe.id} className="recipe-card">
              <img
                src={`/api${recipe.image_url}`}
                alt={recipe.name}
                className="recipe-image"
                onError={(e) => {
                  e.target.src = "/api/static/default-recipe.jpg";
                }}
              />
              <div className="recipe-details">
                  <h3 className="recipe-title">{recipe.name}</h3>
                  <div className="recipe-category-icon "> 
                  <img src={categoriesIcon} alt="קטגוריה" className="icon-style" />
                    <span className="recipe-category">{recipe.categories}</span>
                  </div>
                  <div className="recipe-category-icon">
                    <img src={tagsIcon} alt="תגיות" className="icon-style" />
                    <span className="recipe-tags"> {recipe.tags} </span>
                  </div>
                  <div className="servings-input">
                    <img src={timeIcon} alt="זמן הכנה" className="icon-style" />
                    <span className="recipe-time">{recipe.cooking_time} דקות</span>
                  </div>
                  <div className="recipe-rating">
                    <img src={starIcon} alt="דירוג" className="icon-style" />
                    <span className="recipe-rating-star">{recipe.rating.toFixed(1)} </span>
                  </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="no-recipes">❌ לא נמצאו מתכונים.</p>
        )}
      </div>
    </div>
  );
}