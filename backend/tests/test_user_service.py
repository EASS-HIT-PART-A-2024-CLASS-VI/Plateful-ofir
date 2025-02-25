import pytest
from unittest.mock import Mock
from sqlalchemy.orm import Session
from services.user_service import create_user, get_user_recipes
from models.user_model import User, UserCreate
from models.recipe_model import Recipe

class TestUserService:
    @pytest.fixture
    def db_session(self):
        # Create a mock Session for testing
        return Mock(spec=Session)

    @pytest.fixture
    def sample_user_data(self):
        # Create sample user data for testing
        return UserCreate(
            username="test_user",
            first_name="Test",
            last_name="User",
            email="test@example.com",
            password="securepassword123"
        )

    def test_create_user(self, db_session, sample_user_data):
        # Set up mock behavior for the database session
        mock_user = Mock(spec=User)
        mock_user.username = "test_user"
        mock_user.preferences = "אפייה"

        db_session.add.return_value = None
        db_session.commit.return_value = None
        db_session.refresh.return_value = None

        result = create_user(db_session, sample_user_data.model_dump())
        db_session.add.assert_called_once()
        db_session.commit.assert_called_once()
        assert result.username == "test_user"

    def test_get_user_recipes(self, db_session):
        user_id = 1
        mock_user = Mock(spec=User)
        mock_user.username = "test_user"
        mock_user.preferences = "אפייה"

        mock_recipes = [Mock(spec=Recipe), Mock(spec=Recipe)]
        query_mock = db_session.query.return_value
        filter_mock = query_mock.filter.return_value
        filter_mock.first.return_value = mock_user
        filter_mock.all.return_value = mock_recipes

        result = get_user_recipes(db_session, user_id)
        assert len(result) == 2
