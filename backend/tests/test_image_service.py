import os
import shutil
import pytest
from fastapi import UploadFile
from fastapi.responses import FileResponse
from services.image_service import upload_image, get_image
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.fixture
def test_image():
    """ יצירת קובץ תמונה לבדיקה """
    image_path = "test_image.jpg"
    with open(image_path, "wb") as f:
        f.write(os.urandom(1024))  # יצירת קובץ עם 1KB של נתונים אקראיים
    yield image_path
    os.remove(image_path)

@pytest.fixture
def upload_dir():
    """ יצירת תיקיית העלאות זמנית """
    dir_path = "uploads"
    os.makedirs(dir_path, exist_ok=True)
    yield dir_path
    shutil.rmtree(dir_path)

@pytest.mark.asyncio
async def test_upload_image(test_image, upload_dir):
    """ בדיקה של העלאת תמונה """
    with open(test_image, "rb") as f:
        file = UploadFile(filename="test_image.jpg", file=f)

        # ✅ בדיקת העלאה
        result = await upload_image(file)

        assert "image_url" in result  # ✅ בדיקה שהתוצאה מכילה image_url
        assert result["image_url"] == f"/static/test_image.jpg"  # ✅ בדיקה שהנתיב נכון


@pytest.mark.asyncio
async def test_get_image(test_image, upload_dir):
    """ בדיקה של שליפת תמונה דרך FastAPI """
    dest_path = os.path.join(upload_dir, "test_image.jpg")
    shutil.copy(test_image, dest_path)

    # ✅ קריאה ל-API
    response = client.get("/static/test_image.jpg")

    # ✅ בדיקה שהתשובה היא `200 OK`
    assert response.status_code == 200
    assert response.headers["content-type"] in ["image/jpeg", "image/webp"]

    # ✅ בדיקה של תמונה שלא קיימת
    response = client.get("/static/nonexistent.jpg")
    assert response.status_code == 404

    # ✅ תיקון השגיאה: בדיקה שהתוכן מכיל "detail" ולא "message"
    json_response = response.json()
    assert json_response.get("detail") == "Not Found", f"Unexpected response: {json_response}"
