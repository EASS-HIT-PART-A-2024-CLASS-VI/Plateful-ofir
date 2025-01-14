import subprocess
import requests
import time
import pytest

@pytest.fixture(scope="module")
def start_docker():
    # Run the Docker container
    result = subprocess.run(["docker", "run", "-d", "-p", "8000:8000", "platful"], capture_output=True)
    assert result.returncode == 0, f"Failed to start Docker container: {result.stderr.decode()}"
    
    container_id = result.stdout.decode().strip()
    # Wait for the container to start
    time.sleep(5)  # or use a more advanced method to check if the API is ready
    yield container_id  # Yield container_id to be used in tests
    
    # Cleanup after tests
    subprocess.run(["docker", "stop", container_id], capture_output=True)
    subprocess.run(["docker", "rm", container_id], capture_output=True)

def test_api_health_check(start_docker):
    # Test to make sure the container started successfully and the API is available
    response = requests.get("http://localhost:8000/recipes/")
    assert response.status_code == 200, f"API request failed with status code: {response.status_code}"
    assert "recipes" in response.json(), "Response JSON does not contain 'recipes' key"

def test_create_recipe(start_docker):
    # Test for creating a recipe
    recipe_data = {
        "name": "Pasta",
        "image": "image.jpg",
        "ingredients": [{"name": "Pasta", "quantity": "2 cups"}],
        "cooking_time": 20,
        "categories": "Dinner",
        "tags": ["Vegetarian"]
    }
    response = requests.post("http://localhost:8000/recipes/", json=recipe_data)
    assert response.status_code == 200
    assert response.json()["message"] == "Recipe added successfully!"
