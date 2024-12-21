# Plateful - Recipe Management System 🍽️

Plateful is a recipe management application that allows users to create, share, and organize recipes, while managing their dietary preferences and shopping lists. The API supports features such as recipe creation, nutrition calculation, user profiles, customizable preferences (e.g., vegan, gluten-free), and shopping list generation. The application is built using FastAPI, Docker, and is designed for scalability and maintainability.

## Features ✨

- **Recipe Management:** Create, update, delete, and retrieve recipes, including title, ingredients, preparation steps, and time estimates.
- **Category and Tags:** Organize recipes by categories (e.g., breakfast, lunch) and tags (e.g., vegan, gluten-free).
- **Nutritional Information:** Automatically calculate nutritional values (e.g., calories, protein) based on ingredients.
- **User Profiles:** Allow users to create profiles, save recipes, and share them with others.
- **Dietary Preferences:** Users can filter recipes based on preferences (e.g., vegan, gluten-free).
- **Shopping List Generation:** Automatically create a shopping list based on the recipe ingredients.
- **Timers:** Integrate timers for each step during recipe preparation.
- **Recipe Rating:** Users can rate recipes and view recipes based on ratings.
- **Dockerized Deployment:** Easily run the API in a containerized environment.

## Features 🛠

- **Language:** Python (FastAPI)
- **Database:** PostgreSQL (with SQLAlchemy ORM)
- **Validation:** Pydantic
- **Authentication:** OAuth2 with JWT
- **Password Hashing:** Passlib (bcrypt)
- **Testing:** Pytest
- **Containerization:** Docker
- **Build System:** Uvicorn

## Project Structure 📂

.
app
| |- init.py # Init file for the app package
| |- main.py # FastAPI application entry point
| |- models.py # Pydantic models for data validation
| |- services.py # Business logic for managing recipes and users
| |- utils.py # Helper functions (e.g., nutritional calculations)
| |- unit_tests.py # Unit tests for application logic
| |- requirements.txt # Project dependencies
| |- integration_test.py # Integration tests to test the entire application
|
|- Dockerfile # Dockerfile to containerize the application
|- README.md # Project documentation

## Setup Instructions ❄️

### Prerequisites

Before running the application, ensure the following tools are installed:

- **Docker 🐳**
- **Python 3.9+**
