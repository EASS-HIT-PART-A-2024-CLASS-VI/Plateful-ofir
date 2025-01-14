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
                response = requests.get("http://localhost:8000/")
                if response.status_code == 200:
                    print("API is ready!")
                    break
            except requests.exceptions.RequestException as e:
                print(f"Error connecting to API: {e}")
            time.sleep(2)
            elapsed_time += 2
            print(f"Waiting for API to be ready... {elapsed_time}/{timeout} seconds")
    
        assert elapsed_time < timeout, "API did not become ready in time"
    
        yield container_id
    finally:
        print("Container logs:")
        print(subprocess.run(["docker", "logs", container_id], capture_output=True, text=True).stdout)
        subprocess.run(["docker", "stop", container_id], capture_output=True)
        subprocess.run(["docker", "rm", container_id], capture_output=True)

def test_api_root(start_docker):
    response = requests.get("http://localhost:8000/")
    assert response.status_code == 200, "Root endpoint failed"
    assert response.json() == {"message": "Welcome to Plateful API"}, "Root endpoint response is not as expected"

def test_create_recipe(start_docker):
    recipe_data = {
        "name": "Pasta",
        "image": "image.jpg",
        "ingredients": [{"name": "Pasta", "quantity": "2 cups"}],
        "cooking_time": 20,
        "categories": "Dinner",
        "tags": "Vegetarian"
    }
    response = requests.post("http://localhost:8000/recipes/", json=recipe_data)
    assert response.status_code == 200, "Failed to create recipe"
    assert response.json()["message"] == "Recipe added successfully!", "Recipe creation response is not as expected"
