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
│   .gitignore                     # Specifies which files and folders to exclude from Git tracking
│   README.md                      # Project documentation and instructions
  
├── .vscode/                       # Visual Studio Code configuration folder 
│   ├── settings.json              # Custom settings for VS Code 
  
├── backend/                       # Backend application (FastAPI)
│   ├── .env                       # Environment variables 
│   ├── crud.py                    # CRUD operations
│   ├── docker-compose.yml         # Docker Compose configuration for running services
│   ├── Dockerfile                 # Dockerfile for containerizing the backend
│   ├── main.py                    # Main FastAPI application entry point
│   ├── pytest.ini                 # Pytest configuration file
│   ├── requirements.txt           # Python dependencies for the backend
│   ├── __init__.py                # Marks this directory as a Python package
│   │     
│   ├── db/                        # Database management module
│   │   ├── database.py            # Database connection and session handling
│   │   ├── __init__.py            # Marks this directory as a Python package
│   │     
│   ├── models/                    # Data models for the application
│   │   ├── base.py                # SQLAlchemy base class for models
│   │   ├── recipe_model.py        # Recipe-related database models
│   │   ├── user_model.py          # User-related database models
│   │   ├── __init__.py            # Marks this directory as a Python package
│   │     
│   ├── services/                  # Business logic and service layer
│   │   ├── ai_service.py          # AI-related functions 
│   │   ├── image_service.py       # Handles image uploads and retrieval
│   │   ├── recipe_service.py      # Logic for managing recipes
│   │   ├── timer_service.py       # Cooking timer management
│   │   ├── user_service.py        # Handles user management and preferences
│   │   ├── __init__.py            # Marks this directory as a Python package
│   │ 
│   ├── tests/                     # Automated tests for the backend
│   │   ├── conftest.py            # Pytest fixture configurations
│   │   ├── test_ai_service.py     # Tests for AI-related functionalities
│   │   ├── test_database.py       # Tests for database operations
│   │   ├── test_image_service.py  # Tests for image upload service
│   │   ├── test_integration.py    # End-to-end tests covering multiple services
│   │   ├── test_models.py         # Tests for database models
│   │   ├── test_services.py       # Unit tests for service layer
│   │
└── frontend/                      # Frontend application 
    ├── Recipe App Frontend        # Placeholder for the frontend code 

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

2. Start the application:
   ```bash
   docker-compose up --build
   ```
3. Access the API:  
   Once the application is running, navigate to: 🔗 http://localhost:8000

---

## **Testing** 🧪

Plateful includes both unit tests and integration tests to ensure reliability and performance.

- **Run Unit Tests:**
  ```bash
  pytest backend/unit_tests.py
  ```
- **Run Integration Tests:**
  ```bash
  pytest backend/integration_test.py
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
