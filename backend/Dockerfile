FROM python:3.9-slim

WORKDIR /app
COPY . /app/

# Copy requirements and install dependencies
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN apt-get update && apt-get install -y curl


# Copy application code
COPY . .


# Command to run the app
CMD ["bash", "-c", "python -c 'from db.database import init_db; init_db()' && uvicorn main:app --host 0.0.0.0 --port 8000"]
