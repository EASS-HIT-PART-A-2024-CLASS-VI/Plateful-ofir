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
        assert verify_password(password, hashed) is True
        assert verify_password("wrong_password", hashed) is False

    def test_token_creation_and_decoding(self):
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        decoded = decode_access_token(token)
        assert decoded["sub"] == "test@example.com"

    def test_token_expiration(self):
        data = {"sub": "test@example.com"}
        # Create a token that expires in 1 second
        token = create_access_token(data, expires_delta=timedelta(seconds=1))
        time.sleep(2)  # Wait 2 seconds to ensure the token has expired
        with pytest.raises(ExpiredSignatureError):
            decode_access_token(token)
