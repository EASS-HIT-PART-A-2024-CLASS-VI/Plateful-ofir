from sqlalchemy.orm import Session
from models.notification_model import Notification

def create_notification(db: Session, user_id: int, message: str, link: str = None):
    """Create a new notification for the user."""
    notification = Notification(user_id=user_id, message=message, link=link)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

def get_user_notifications(db: Session, user_id: int):
    """Return the user's notifications, ordered by creation date descending."""
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()

def mark_notifications_as_read(db: Session, user_id: int):
    """Mark all notifications for the user as read."""
    db.query(Notification).filter(Notification.user_id == user_id).update({"is_read": True})
    db.commit()
