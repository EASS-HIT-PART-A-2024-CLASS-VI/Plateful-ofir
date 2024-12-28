import subprocess
import requests


def test_api():
    # הרצת ה-Docker container
    result = subprocess.run(["docker", "run", "-d", "-p", "8000:8000", "platful"], capture_output=True)
    assert result.returncode == 0

    # הרצת בקשה לאחת ה-API
    response = requests.get("http://localhost:8000/recipes/")
    assert response.status_code == 200
    assert "recipes" in response.json()
