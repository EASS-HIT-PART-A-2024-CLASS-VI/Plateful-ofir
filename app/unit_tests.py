from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_add_recipe():
    response = client.post("/recipes/", json={
        "name": "Pancakes",
        "image": "pancakes.jpg",
        "ingredients": [{"name": "Flour", "quantity": "1 cup"}],
        "instructions": ["Mix ingredients", "Cook on stove"],
        "cooking_time": 15
    })
    assert response.status_code == 200
    assert response.json() == {"message": "Recipe added successfully!"}

def test_get_recipes():
    response = client.get("/recipes/")
    assert response.status_code == 200
    assert len(response.json()) > 0
