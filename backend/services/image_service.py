from fastapi import APIRouter, UploadFile
from fastapi.responses import FileResponse
import shutil
import os

router = APIRouter()

# יצירת תיקיית static אם היא לא קיימת
STATIC_DIR = "static"
os.makedirs(STATIC_DIR, exist_ok=True)

@router.post("/upload-image/")
async def upload_image(file: UploadFile):
    file_path = os.path.join(STATIC_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"image_url": f"/static/{file.filename}"}

@router.get("/static/{image_name}", response_class=FileResponse)
async def get_image(image_name: str):
    file_path = os.path.join(STATIC_DIR, image_name)

    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/webp")  # שינוי סוג הקובץ
    return {"message": "Image not found"}
