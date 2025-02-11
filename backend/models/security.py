from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt

# 🔑 הגדרת מפתח סודי להצפנה (עדיף לשמור בקובץ `.env`)
SECRET_KEY = "your_secret_key_here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7
ACCESS_TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60

# יצירת הקשר להצפנת סיסמאות
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """הצפנת סיסמה עם bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """אימות סיסמה מול הסיסמה המוצפנת"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """יצירת טוקן גישה (JWT)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    """פענוח ואימות טוקן גישה"""
    try:
        print(f"🔹 Trying to decode token: {token}")  # בדיקת הנתון
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"✅ Token Decoded Successfully: {payload}")
        return payload
    except JWTError as e:
        print(f"❌ JWT Decoding Error: {str(e)}")
        return None
