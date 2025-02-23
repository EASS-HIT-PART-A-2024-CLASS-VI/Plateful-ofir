![Plateful Logo](./frontend/src/assets/logo.png)


**Plateful** is a recipe management system that enables users to create, share, and organize recipes while catering to dietary preferences and managing shopping lists. The API provides robust features like automatic nutrition calculation, user profiles, customizable dietary preferences (e.g., vegan, gluten-free), and shopping list generation.

Built with **FastAPI** and **Docker**, Plateful is designed to be scalable, maintainable, and developer-friendly.

---

## **Features** ✨

- **Recipe Management:** Create, update, delete, and retrieve recipes with titles, ingredients, preparation steps, and estimated cooking times.
- **Categories and Tags:** Organize recipes by categories (e.g., breakfast, lunch) and tags (e.g., vegan, gluten-free).
- **Automatic Nutritional Information:** Calculates calories, protein, carbs, and fats based on ingredients.
- **User Profiles:** Create user profiles, save recipes, and share them with others.
- **Dietary Preferences:** Filter recipes based on preferences such as vegan or gluten-free.
- **Shopping List Generator:** Automatically generates a shopping list based on recipe ingredients.
- **Cooking Timers:** Set timers for each step in the recipe preparation process.
- **Recipe Rating System:** Rate recipes and view them based on ratings.
- **Image Uploads:** Users can upload images for their recipes.
- **AI Capabilities:** AI-powered features for smart recipe suggestions, ingredient substitutions, and nutritional analysis.
- **Dockerized Deployment:** Easily run the application in a containerized environment.

---

## **AI Capabilities** 🤖

Plateful incorporates **AI-powered features** to enhance the user experience and optimize recipe management:

- **Smart Recipe Suggestions:** AI-driven recommendations based on user preferences, past interactions, and dietary restrictions.
- **Ingredient Substitutions:** Suggests alternative ingredients for missing or unavailable items.
- **Nutritional Analysis:** Uses AI to estimate calories, macronutrients, and health scores based on recipe ingredients.
- **AI Chatbot (Future Enhancement):** A chatbot assistant to help users create and modify recipes, answer cooking-related queries, and provide smart meal planning tips.
- **Automated Cooking Instructions:** Converts text-based recipes into step-by-step guided instructions with time estimates.

These AI features improve personalization, accessibility, and efficiency, making **Plateful** a smarter cooking assistant! 🍽️✨

---

## **Technologies Used** 🛠️

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL, Redis
- **Frontend:** React (with Tailwind CSS)
- **Containerization:** Docker & Docker Compose
- **Authentication:** JWT-based authentication

---

## **System Architecture** 🏗️

Below is the high-level system architecture of Plateful:

![Architecture Diagram](./frontend/src/assets/Architecture-image.png)


💡 **Component Breakdown:**
- **React** - User interface for managing recipes.
- **FastAPI** - API layer handling business logic and user requests.
- **PostgreSQL** - Database for storing user and recipe data.
- **Redis** - Caching layer to improve performance.
- **File Storage (S3 or local)** - Stores images for recipes.
- **Docker** - Manages containerized services.
- **AI Services** - Machine learning models integrated for AI-driven recipe recommendations.

---

## **Project Structure** 📂

```plaintext
C:/
├───backend/                      # Backend application (FastAPI)
│   ├───db/                       # Database management
│   ├───models/                   # Database models
│   ├───services/                 # Business logic
│   ├───static/                   # Recipe images
│   ├───tests/                    # Automated backend tests
│   ├───Dockerfile                # Dockerfile for backend service
│   ├── crud.py                    # CRUD operations
│   ├───docker-compose.yml        # Docker Compose configuration
│   ├───requirements.txt          # Python dependencies
│   ├───main.py                   # FastAPI main application
│
├───frontend/                     # Frontend application (React)
│   ├───public/                   # Public files (index.html, favicon)
│   ├───src/                      # React source files
│   │   ├───assets/icons/         # Static assets (icons, images)
│   │   ├───components/           # React UI components
│   │   ├───context/              # Context API for state management
│   │   ├───pages/                # Pages for the web app
│   ├───Dockerfile                # Dockerfile for frontend service
│   ├───package.json              # Frontend dependencies
│   ├───tailwind.config.js        # Tailwind CSS configuration
├───.gitignore                    # Specifies which files and folders to exclude from Git tracking
├─── README.md                    # Project documentation and instructions
├─── docker-compose.yml           # Docker Compose configuration for running services

```

---

## **Setup Instructions** 🚀

### **Prerequisites**

Ensure you have the following installed:

- **Docker** 🐳 
- **Python 3.9+** 
- **Node.js & npm** 

### **Set Up Environment Variables**

Before running the project, create an `.env` file inside the **backend** directory:

```sh
cp backend/.env.example backend/.env
```

Edit the `.env` file with your configuration:

```
DATABASE_URL=postgresql://postgres:password123@postgres:5432/plateful
GEMINI_API_KEY=your_secret_key_here
USDA_API_KEY=your_secret_key_here
```

---

## **Running the Application (Dockerized)**

1. Clone the repository:
   ```bash
   git clone https://github.com/EASS-HIT-PART-A-2024-CLASS-VI/Plateful-ofir
   cd plateful
   ```
2. Build and start the containers:
   ```bash
   docker-compose up --build
   ```
3. Once running, access the app:
   - **Backend API Docs**: 🔗 [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Frontend App**: 🔗 [http://localhost:3000](http://localhost:3000)

---

## **Testing** 🧪

### **Run All Tests**
```bash
docker-compose backend pytest
```
### **Run Specific Tests**
```bash
pytest backend/tests/test_recipes.py  # Test recipes functionality
pytest backend/tests/test_users.py    # Test user authentication
```

---

## **Demo Video** 🎥

_A video demonstrating the system will be added here._

[![Watch Demo](https://img.youtube.com/vi/your-video-id-here/0.jpg)](https://www.youtube.com/watch?v=your-video-id-here)

---

## **API Documentation** 📖

For a complete list of API endpoints and usage examples, see the [API Reference](./docs/API.md).

---

## **Contact Info** 📬

**Ofir Itskovich**  
📧 Email: ofir8530@gmail.com  
🔗 GitHub: [ofir8530](https://github.com/ofir8530)

---

