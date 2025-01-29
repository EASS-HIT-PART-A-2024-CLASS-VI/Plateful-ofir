# tests/test_image_service.py
import os
import shutil
import pytest
from fastapi import UploadFile
from fastapi.responses import FileResponse
from services.image_service import upload_image, get_image

@pytest.fixture
def test_image():
    # Create a test image file
    image_path = "test_image.jpg"
    with open(image_path, "wb") as f:
        f.write(os.urandom(1024))  # Write 1KB of random bytes to the file
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
    # Create UploadFile object
    with open(test_image, "rb") as f:
        file = UploadFile(filename="test_image.jpg", file=f)
        
        # Test upload
        result = await upload_image(file)
        
        assert "filename" in result
        assert "file_location" in result
        assert os.path.exists(result["file_location"])
        assert result["filename"] == "test_image.jpg"

def test_get_image(test_image, upload_dir):
    # Copy test image to uploads directory
    dest_path = os.path.join(upload_dir, "test_image.jpg")
    shutil.copy(test_image, dest_path)
    
    # Test getting image
    response = get_image("test_image.jpg")
    assert isinstance(response, FileResponse)
    assert response.status_code == 200
    
    # Test getting non-existent image
    response = get_image("nonexistent.jpg")
    assert isinstance(response, dict)
    assert "message" in response
    assert response["message"] == "Image not found"