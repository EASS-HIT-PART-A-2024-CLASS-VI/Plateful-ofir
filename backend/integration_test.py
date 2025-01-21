import subprocess
import requests
import time
import pytest
import os

# In integration_test.py
@pytest.fixture(scope="module")
def start_docker():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(current_dir)
    docker_compose_path = os.path.join(current_dir, 'docker-compose.yml')
    
    try:
        # Start services
        result = subprocess.run(["docker-compose", "-f", docker_compose_path, "up", "-d"], 
                              capture_output=True, text=True)
        assert result.returncode == 0, f"Failed to start Docker Compose: {result.stderr}"
        
        print("Waiting for services to be healthy...")
        timeout = 180
        elapsed_time = 0
        while (elapsed_time < timeout):
            try:
                response = requests.get("http://localhost:8000/")
                if response.status_code == 200:
                    print("API is ready!")
                    break
            except requests.exceptions.ConnectionError:
                print(f"API not ready, retrying... ({elapsed_time}s/{timeout}s)")
                # Get container logs for debugging
                logs = subprocess.run(
                    ["docker-compose", "-f", docker_compose_path, "logs", "--tail=50"],
                    capture_output=True, text=True
                )
                print(f"Container logs:\n{logs.stdout}")
            time.sleep(5)
            elapsed_time += 5
        
        if elapsed_time >= timeout:
            raise TimeoutError("API did not become ready in time")
            
        yield
    finally:
        print("Cleaning up Docker services...")
        subprocess.run(["docker-compose", "-f", docker_compose_path, "down"], 
                      capture_output=True)

def test_api_root(start_docker):
    response = requests.get("http://localhost:8000/")
    assert response.status_code == 200, "Root endpoint failed"
    assert response.json() == {"message": "Welcome to Plateful API"}, "Root endpoint response is not as expected"

def test_create_recipe(start_docker):
    # First create a test user
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "dietary_preferences": ["NONE"]  # Added missing required field
    }
    
    try:
        # Create user
        user_response = requests.post(
            "http://localhost:8000/users/",
            json=user_data,
            headers={"Content-Type": "application/json"}
        )
        assert user_response.status_code == 200, f"Failed to create user: {user_response.text}"
        user_id = user_response.json().get("id")
        
        # Create recipe with valid user_id
        recipe_data = {
            "name": "Pasta",
            "description": "A simple pasta dish",
            "image": "pasta.jpg",
            "ingredients": [
                {
                    "name": "Pasta",
                    "quantity": 2.0,
                    "unit": "cups",
                    "nutritional_values": {
                        "calories": 200,
                        "protein": 7,
                        "carbs": 42,
                        "fats": 1
                    }
                }
            ],
            "cooking_time": 20,
            "preparation_time": 15,
            "preparation_steps": "1. Boil water\n2. Cook pasta for 10 minutes\n3. Drain and serve",
            "difficulty": "EASY",
            "servings": 4,
            "categories": "Main Course",
            "tags": "Italian",
            "creator_id": user_id,
            "timers": [
                {
                    "step_number": 2,
                    "duration": 10,
                    "label": "Cook pasta"
                }
            ]
        }

        print(f"Sending request with data: {recipe_data}")
        
        response = requests.post(
            "http://localhost:8000/recipes/",
            json=recipe_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")

        if response.status_code != 200:
            logs = subprocess.run(
                ["docker-compose", "logs", "--tail=100"],
                capture_output=True,
                text=True
            )
            print(f"Container logs:\n{logs.stdout}")
            pytest.fail(f"Create recipe failed: {response.text}")
            
        recipe_id = response.json().get("recipe_id")
        assert recipe_id is not None, "No recipe_id in response"
        
        # Cleanup
        requests.delete(f"http://localhost:8000/users/{user_id}")
        requests.delete(f"http://localhost:8000/recipes/{recipe_id}")
        
    except requests.exceptions.RequestException as e:
        pytest.fail(f"Request failed: {str(e)}")