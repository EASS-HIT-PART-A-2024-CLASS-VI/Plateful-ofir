from fastapi import APIRouter, UploadFile
from fastapi.responses import FileResponse
import shutil
import os

router = APIRouter()

# תיקייה שבה נשמור את התמונות
STATIC_DIR = "static"
os.makedirs(STATIC_DIR, exist_ok=True)

@router.post("/upload-image/")
async def upload_image(file: UploadFile):
    # שמירת קובץ בנתיב תקין
    file_path = os.path.join(STATIC_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # החזרת URL שניתן לגשת אליו מה-Frontend
    return {"image_url": f"/static/{file.filename}"}

@router.get("/static/{image_name}")
async def get_image(image_name: str):
    file_path = os.path.join(STATIC_DIR, image_name)

    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"message": "Image not found"}
