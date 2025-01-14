from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_add_recipe():
    response = client.post("/recipes/", json={
        "name": "Pancakes",
        "image": "pancakes.jpg",
        "ingredients": [{"name": "Flour", "quantity": "1 cup"}],
        "cooking_time": 15,
        "categories": "Breakfast",
        "tags": ["Vegan"]
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Recipe added successfully!"
