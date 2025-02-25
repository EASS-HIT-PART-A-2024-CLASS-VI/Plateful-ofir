FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create static directory
RUN mkdir -p /app/static

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Create startup script
RUN echo '#!/bin/bash\n\
    python -c "from db.database import Base, engine; Base.metadata.create_all(bind=engine)"\n\
    python -m services.seed_data\n\
    uvicorn main:app --host 0.0.0.0 --port 8000' > /app/start.sh

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
