from fastapi.testclient import TestClient
from app.main import app
from sqlalchemy.orm import Session
from app import crud, database

client = TestClient(app)

# Dependency override for testing to avoid interacting with the actual database
def override_get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Test to add a recipe
def test_add_recipe():
    # Use TestClient to simulate a POST request to /recipes/
    response = client.post("/recipes/", json={
        "name": "Pancakes",
        "image": "pancakes.jpg",
        "ingredients": [{"name": "Flour", "quantity": "1 cup"}],
        "cooking_time": 15,
        "categories": "Breakfast",
        "tags": ["Vegan"]
    })
    
    # Check if the status code is 200 (OK)
    assert response.status_code == 200
    assert response.json()["message"] == "Recipe added successfully!"

    # Check if the recipe exists in the database (assuming CRUD operations are correctly implemented)
    db = next(override_get_db())
    recipe = crud.get_recipe_by_name(db, "Pancakes")  # Adjust the function based on your CRUD logic
    assert recipe is not None  # Ensure the recipe was added
    assert recipe.name == "Pancakes"
    assert recipe.image == "pancakes.jpg"
    assert recipe.cooking_time == 15
    assert recipe.categories == "Breakfast"
    assert "Vegan" in recipe.tags  # Ensure the tags were stored correctly
