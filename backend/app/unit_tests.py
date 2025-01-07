from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Test for adding a new recipe
def test_add_recipe():
    # Sending a POST request to add a recipe
    response = client.post("/recipes/", json={
        "name": "Pancakes",
        "image": "pancakes.jpg",
        "ingredients": [{"name": "Flour", "quantity": "1 cup"}],
        "cooking_time": 15,
        "categories": "Breakfast",
        "tags": ["Vegan"]
    })
    # Verifying the response
    assert response.status_code == 200
    assert response.json()["message"] == "Recipe added successfully!"

# Test for filtering recipes by category
def test_filter_by_category():
    # Sending a GET request to filter recipes
    response = client.get("/recipes/filter/?category=Breakfast")
    # Verifying the response
    assert response.status_code == 200
    assert len(response.json()) > 0

# Test for adding a recipe with instructions
def test_add_recipe_with_instructions():
    response = client.post("/recipes/", json={
        "name": "Pancakes",
        "image": "pancakes.jpg",
        "ingredients": [{"name": "Flour", "quantity": "1 cup"}],
        "instructions": ["Mix ingredients", "Cook on stove"],
        "cooking_time": 15,
        "categories": "Breakfast",
        "tags": ["Vegan"]
    })
    # Verifying the response
    assert response.status_code == 200
    assert response.json()["message"] == "Recipe added successfully!"
