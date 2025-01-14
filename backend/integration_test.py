import subprocess
import requests
import time
import pytest

@pytest.fixture(scope="module")
def start_docker():
    result = subprocess.run(["docker", "run", "-d", "-p", "8000:8000", "backend-app:latest"], capture_output=True, text=True)
    assert result.returncode == 0, f"Failed to start Docker container: {result.stderr}"
    
    container_id = result.stdout.strip()
    print(f"Started Docker container with ID: {container_id}")

    try:
        timeout = 60
        elapsed_time = 0
        while elapsed_time < timeout:
            try:
                response = requests.get("http://localhost:8000/health/")
                if response.status_code == 200:
                    print("API is ready!")
                    break
            except requests.exceptions.RequestException as e:
                print(f"Error connecting to API: {e}")
            time.sleep(1)
            elapsed_time += 1
            print(f"Waiting for API to be ready... {elapsed_time}/{timeout} seconds")
    
        assert elapsed_time < timeout, "API did not become ready in time"
    
        yield container_id
    finally:
        subprocess.run(["docker", "logs", container_id], capture_output=True)
        subprocess.run(["docker", "stop", container_id], capture_output=True)
        subprocess.run(["docker", "rm", container_id], capture_output=True)

def test_api_health_check(start_docker):
    response = requests.get("http://localhost:8000/health/")
    assert response.status_code == 200, "Health check failed"

def test_create_recipe(start_docker):
    recipe_data = {
        "name": "Pasta",
        "image": "image.jpg",
        "ingredients": [{"name": "Pasta", "quantity": "2 cups"}],
        "cooking_time": 20,
        "categories": ["Dinner"],
        "tags": ["Vegetarian"]
    }
    response = requests.post("http://localhost:8000/recipes/", json=recipe_data)
    assert response.status_code == 201, "Failed to create recipe"
    assert response.json().get("name") == "Pasta", "Recipe creation did not return correct name"
