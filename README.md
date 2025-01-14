# **Plateful** 🍲

**Plateful** is a recipe management system that enables users to create, share, and organize recipes, while catering to dietary preferences and managing shopping lists. The API provides robust features like nutrition calculation, user profiles, customizable preferences (e.g., vegan, gluten-free), and shopping list generation.

Built with **FastAPI** and **Docker**, Plateful is designed to be scalable, maintainable, and developer-friendly.

---

## **Features** ✨

- **Recipe Management:** Create, update, delete, and retrieve recipes with title, ingredients, preparation steps, and time estimates.
- **Categories and Tags:** Organize recipes by categories (e.g., breakfast, lunch) and tags (e.g., vegan, gluten-free).
- **Nutritional Information:** Automatically calculate nutritional values (e.g., calories, protein) based on ingredients.
- **User Profiles:** Create user profiles, save recipes, and share them with others.
- **Dietary Preferences:** Filter recipes based on preferences such as vegan or gluten-free.
- **Shopping List:** Automatically generate shopping lists based on recipe ingredients.
- **Timers:** Add timers for each step in the recipe preparation process.
- **Recipe Rating:** Rate recipes and view them based on ratings.
- **Dockerized Deployment:** Easily run the application in a containerized environment.

---

## **Technologies** 🛠️

- **Language:** Python (FastAPI)
- **Containerization:** Docker

---

## **Project Structure** 📂

```plaintext
├── backend
|    ├── __init__.py          # App package initialization
|    ├── crud.py              # CRUD operations for recipes, users, and ingredients
|    ├── unit_tests.py        # Unit tests for application logic
|    ├── Dockerfile           # Dockerfile to containerize the application
|    ├── docker-compose.yml   # Docker Compose file for database and application setup
|    ├── integration_test.py  # Integration tests to test the entire application
|    ├── requirements.txt     # Project dependencies
|    ├── main.py              # FastAPI application entry point
├── db
|    ├── __init__.py          # App package initialization
|    ├── database.py          # Database connection and session management
├── models
|    ├── __init__.py          # App package initialization
|    ├── recipe_model.py      # Pydantic and/or SQLAlchemy models for recipes.
|    ├── base.py
|    ├── user_model.py        # Pydantic and/or SQLAlchemy models for users.
├── services
|    ├── __init__.py          # App package initialization
|    ├── image_service.py     # Logic for handling image-related functionality.
|    ├── recipe_service.py    # Business logic for managing recipes.
|    ├── timer_service.py     # Logic for managing cooking timers.
|    ├── user_service.py      # Logic for user-specific operations.
├── README.md                 # Project documentation
```

---

## **Setup Instructions** 🚀

### **Prerequisites**

Ensure the following tools are installed:

- Docker 🐳
- Python 3.9+

### **Running the Application**

1. Clone the repository:
   ```bash
   git clone https://github.com/EASS-HIT-PART-A-2024-CLASS-VI/Plateful-ofir
   cd plateful
   ```
2. Build the Docker image:
   ```bash
   docker-compose build
   ```
3. Start the application:
   ```bash
   docker-compose up
   ```
4. Access the API:  
   Once the application is running, navigate to: 🔗 http://localhost:8000

---

## **Testing** 🧪

Plateful includes both unit tests and integration tests to ensure reliability and performance.

- **Run Unit Tests:**
  ```bash
  pytest app/unit_tests.py
  ```
- **Run Integration Tests:**
  ```bash
  pytest app/integration_test.py
  ```
- **Run All Tests:**
  ```bash
  pytest
  ```

---

## **Contact Info** 📬

**Ofir Itskovich**  
 Email: ofir8530@gmail.com  
 GitHub: [ofir8530](https://github.com/ofir8530)
