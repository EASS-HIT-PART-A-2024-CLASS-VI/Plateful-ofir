FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file
COPY requirements.txt .
ENV PYTHONPATH=/app/backend


# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory
COPY . /app/

# Set the command to run the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
