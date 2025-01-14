from fastapi import UploadFile
from fastapi.responses import FileResponse
import shutil
import os

async def upload_image(file: UploadFile):
    # Define a directory to save the uploaded images
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    # Create a file path where the image will be saved
    file_location = os.path.join(upload_dir, file.filename)
    
    # Save the uploaded image to the directory
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"filename": file.filename, "file_location": file_location}


def get_image(image_name: str):
    # Define the directory where the images are stored
    upload_dir = "uploads"
    file_path = os.path.join(upload_dir, image_name)

    # Check if the file exists before returning it
    if os.path.exists(file_path):
        return FileResponse(file_path)  # Return the image file as a response
    else:
        return {"message": "Image not found"}