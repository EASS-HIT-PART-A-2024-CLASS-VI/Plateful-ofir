import os
import shutil
import pytest
from fastapi import UploadFile
from fastapi.testclient import TestClient
from services.image_service import upload_image, get_image
from main import app

client = TestClient(app)

@pytest.fixture
def test_image():
    # Create a temporary image file for testing
    image_path = "test_image.jpg"
    with open(image_path, "wb") as f:
        f.write(os.urandom(1024))
    yield image_path
    os.remove(image_path)

@pytest.fixture
def upload_dir():
    # Create a temporary uploads directory
    dir_path = "uploads"
    os.makedirs(dir_path, exist_ok=True)
    yield dir_path
    shutil.rmtree(dir_path)

@pytest.mark.asyncio
async def test_upload_image(test_image, upload_dir):
    with open(test_image, "rb") as f:
        file = UploadFile(filename="test_image.jpg", file=f)
        result = await upload_image(file)
        assert "image_url" in result
        assert result["image_url"] == f"/static/test_image.jpg"

@pytest.mark.asyncio
async def test_get_image(test_image, upload_dir):
    dest_path = os.path.join(upload_dir, "test_image.jpg")
    shutil.copy(test_image, dest_path)
    
    response = client.get("/static/test_image.jpg")
    assert response.status_code == 200
    assert response.headers["content-type"] in ["image/jpeg", "image/webp"]

    response = client.get("/static/nonexistent.jpg")
    assert response.status_code == 404
    json_response = response.json()
    assert json_response.get("detail") == "Not Found", f"Unexpected response: {json_response}"
