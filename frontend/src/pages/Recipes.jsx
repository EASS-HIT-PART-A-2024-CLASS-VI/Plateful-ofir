import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import filterIcon from "../assets/icons/filter-image.png";
import timeIcon from "../assets/icons/time-image.png";
import categoriesIcon from "../assets/icons/category-image.png";
import RatingStars from "../components/RatingStars";
import tagsIcon from "../assets/icons/tag-image.png";
import starIcon from "../assets/icons/star-image.png";

export default function Recipes() {
  // State variables for storing recipe data and filters
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

  // Fetch all recipes from API when component mounts
  useEffect(() => {
    fetch("/api/recipes/")
      .then((response) => response.json())
      .then((data) => {
        setRecipes(data);
        setFilteredRecipes(data);
        setLoading(false);
        console.log("📌 API Data:", data);

        // Extract unique categories and tags for filtering
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

  // Apply filtering whenever the user updates search, category, tag, or rating
  useEffect(() => {
    let filtered = recipes;

    if (searchTerm) {
      filtered = filtered.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.categories.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (selectedtag) {
      filtered = filtered.filter(
        (recipe) => recipe.tags.toLowerCase() === selectedtag.toLowerCase()
      );
    }

    if (selectedRating !== null) {
      filtered = filtered.filter(
        (recipe) => Math.floor(recipe.rating) === selectedRating
      );
    }

    setFilteredRecipes(filtered);
  }, [searchTerm, selectedCategory, selectedtag, selectedRating, recipes]);

  // Close the filter dropdown when clicking outside
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

  // Function to clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedtag("");
    setSelectedRating(null);
    setHoveredRating(null);
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm || selectedCategory || selectedtag || selectedRating !== null;

  // Show loading indicator while fetching data
  if (loading)
    return (
      <p className="text-center mt-10 text-blue-500">Loading recipes...</p>
    );

  // Show error message if API fetch fails
  if (error)
    return <p className="text-center text-red-500 mt-10">Error: {error}</p>;

  return (
    <div className="recipes-container">
      <h2 className="recipes-title">📖 All Recipes</h2>

      {/* Search and Filter Section */}
      <div className="search-filter-container">
        <input
          type="text"
          placeholder="🔎 Search recipe..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="relative">
          {/* Filter Toggle Button */}
          <button
            className="filter-button"
            ref={filterButtonRef}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <img src={filterIcon} alt="Filter" className="filter-icon" />
          </button>

          {/* Filter Dropdown */}
          {filterOpen && (
            <div
              className="filter-dropdown"
              ref={filterRef}
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "8px",
                backgroundColor: "white",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                borderRadius: "8px",
                padding: "16px",
                width: "250px",
                zIndex: 1000,
              }}
            >
              {/* Category Filters */}
              <div className="filter-section">
                <h4 className="filter-title">Categories</h4>
                <div className="filter-grid">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory === category ? "" : category
                        )
                      }
                      className={`filter-category-button ${
                        selectedCategory === category ? "active" : ""
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Tag Filters */}
                <h4 className="filter-title">Tags</h4>
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

              {/* Rating Filter */}
              <div className="filter-section mt-4">
                <h4 className="filter-title">⭐ Rating</h4>
                <RatingStars
                  currentRating={selectedRating}
                  onRate={(rating) =>
                    setSelectedRating(rating === selectedRating ? null : rating)
                  }
                  readOnly={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="recipe-grid">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <Link
              to={`/recipes/${recipe.id}`}
              key={recipe.id}
              className="recipe-card"
            >
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

                {/* Category Display */}
                <div className="recipe-category-icon">
                  <img
                    src={categoriesIcon}
                    alt="Category"
                    className="icon-style"
                  />
                  <span className="recipe-category">{recipe.categories}</span>
                </div>

                {/* Tags Display */}
                <div className="recipe-category-icon">
                  <img src={tagsIcon} alt="Tags" className="icon-style" />
                  <span className="recipe-tags"> {recipe.tags} </span>
                </div>

                {/* Cooking Time Display */}
                <div className="servings-input">
                  <img
                    src={timeIcon}
                    alt="Cooking Time"
                    className="icon-style"
                  />
                  <span className="recipe-time">{recipe.cooking_time} min</span>
                </div>

                {/* Rating Display */}
                <div className="recipe-rating">
                  <img src={starIcon} alt="Rating" className="icon-style" />
                  <span className="recipe-rating-star">
                    {recipe.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="no-recipes">❌ No recipes found.</p>
        )}
      </div>
    </div>
  );
}
