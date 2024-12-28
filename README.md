Plateful is a recipe management application that allows users to create, share, and organize recipes, while managing their dietary preferences and shopping lists. The API supports features such as recipe creation, nutrition calculation, user profiles, customizable preferences (e.g., vegan, gluten-free), and shopping list generation. The application is built using FastAPI, Docker, and is designed for scalability and maintainability.
Features ✨

    Recipe Management: Create, update, delete, and retrieve recipes, including title, ingredients, preparation steps, and time estimates.
    Category and Tags: Organize recipes by categories (e.g., breakfast, lunch) and tags (e.g., vegan, gluten-free).
    Nutritional Information: Automatically calculate nutritional values (e.g., calories, protein) based on ingredients.
    User Profiles: Allow users to create profiles, save recipes, and share them with others.
    Dietary Preferences: Users can filter recipes based on preferences (e.g., vegan, gluten-free).
    Shopping List Generation: Automatically create a shopping list based on the recipe ingredients.
    Timers: Integrate timers for each step during recipe preparation.
    Recipe Rating: Users can rate recipes and view recipes based on ratings.
    Dockerized Deployment: Easily run the API in a containerized environment.

Features 🛠

    Language: Python (FastAPI)
    Containerization: Docker

Project Structure 📂

app
| |- **init**.py # Init file for the app package
| |- crud.py # CRUD operations for recipes, users, and ingredients
| |- database.py # Database connection and session management
| |- main.py # FastAPI application entry point
| |- models.py # Pydantic models for data validation
| |- services.py # Business logic for managing recipes and users
| |- unit_tests.py # Unit tests for application logic

|- Dockerfile # Dockerfile to containerize the application
|- docker-compose.yml # Docker Compose file for database and application setup
|- README.md # Project documentation
|- integration_test.py # Integration tests to test the entire application
|- requirements.txt # Project dependencies

Setup Instructions ❄️
Prerequisites

Before running the application, ensure the following tools are installed:

    Docker 🐳
    Python 3.9+

Running the Application 🚀

To run the application locally using Docker, follow these steps:

    Clone the repository:

git clone https://github.com/EASS-HIT-PART-A-2024-CLASS-VI/Plateful-ofir
cd plateful

Build the Docker image:

In the project directory, build the Docker image by running:

docker-compose build

Start the application:

Run the application in a Docker container:

docker-compose up

This will start both the FastAPI app and the PostgreSQL database container.

Access the application:

After the containers are up and running, you can access the API at:

http://localhost:8000

The API documentation is available at:

    http://localhost:8000/docs

Running Tests 🧪

The project includes both unit tests and integration tests to ensure everything works as expected.
Unit Tests

To run the unit tests, use the following command:

pytest app/unit_tests.py

Integration Tests

To run the integration tests, use the following command:

pytest app/integration_test.py

Alternatively, you can run all tests (unit and integration) using:

pytest

Docker Compose

The docker-compose.yml file is provided to manage the services (application and database). To bring up the services with Docker Compose:

docker-compose up

This will start both the FastAPI application and the PostgreSQL database in isolated containers.
Testing 🛠️

The application is tested using pytest to ensure robustness and efficiency. It includes the following:

    Unit tests for validating individual components of the application.
    Integration tests to verify the end-to-end functionality of the system.

We use httpx to perform HTTP requests in tests, ensuring that the API behaves correctly under different conditions.
Conclusion 🏁

Plateful is a scalable and maintainable recipe management application that leverages FastAPI and Docker. By following the setup instructions, you can quickly deploy the application locally and start using the recipe management system. You can also contribute by adding more features or improving the tests
