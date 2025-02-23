import pytest
from unittest.mock import Mock
from sqlalchemy.orm import Session
from services.notification_service import (
    create_notification,
    get_user_notifications,
    mark_notifications_as_read
)
from models.notification_model import Notification

class TestNotificationService:
    @pytest.fixture
    def db_session(self):
        return Mock(spec=Session)

    def test_create_notification(self, db_session):
        user_id = 1
        message = "בדיקת התראה"
        
        mock_notification = Mock(spec=Notification)
        db_session.add.return_value = None
        db_session.commit.return_value = None
        db_session.refresh.return_value = None
        
        result = create_notification(db_session, user_id, message)
        
        assert db_session.add.called
        assert db_session.commit.called

    def test_get_user_notifications(self, db_session):
        user_id = 1
        mock_notifications = [Mock(spec=Notification), Mock(spec=Notification)]
        db_session.query.return_value.filter.return_value.order_by.return_value.all.return_value = mock_notifications
        
        result = get_user_notifications(db_session, user_id)
        assert len(result) == 2

    def test_mark_notifications_as_read(self, db_session):
        user_id = 1
        db_session.query.return_value.filter.return_value.update.return_value = None
        db_session.commit.return_value = None
        
        mark_notifications_as_read(db_session, user_id)
        
        assert db_session.commit.called
