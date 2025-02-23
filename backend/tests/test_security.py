import pytest
from datetime import timedelta
from models.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)
from jose.exceptions import ExpiredSignatureError
import time

class TestSecurity:
    def test_password_hashing(self):
        password = "test123"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) == True
        assert verify_password("wrong_password", hashed) == False

    def test_token_creation_and_decoding(self):
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        
        decoded = decode_access_token(token)
        assert decoded["sub"] == "test@example.com"

    def test_token_expiration(self):
        data = {"sub": "test@example.com"}

        # ✅ יצירת טוקן עם חיים של 1 שנייה
        token = create_access_token(data, expires_delta=timedelta(seconds=1))

        time.sleep(2)  # ✅ מחכים 2 שניות כדי לוודא שהתוקן פג

        # ✅ עכשיו הפונקציה באמת תזרוק ExpiredSignatureError
        with pytest.raises(ExpiredSignatureError):
            decode_access_token(token)




