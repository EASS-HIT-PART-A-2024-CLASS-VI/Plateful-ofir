FROM python:3.9-slim

WORKDIR /app

# התקנת דרישות
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# העתקת שאר הקבצים
COPY . .

# יצירת תיקיות נדרשות
RUN mkdir -p /app/static

# הגדרת משתני סביבה
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# יצירת סקריפט הפעלה
RUN echo '#!/bin/bash\n\
python -c "from db.database import Base, engine; Base.metadata.create_all(bind=engine)"\n\
python -m services.seed_data\n\
uvicorn main:app --host 0.0.0.0 --port 8000' > /app/start.sh

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
