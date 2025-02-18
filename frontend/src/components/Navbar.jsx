import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/UserContext";
import userIcon from "../assets/user-image.png";  
import notificationIcon from "../assets/notifi-image.png";  
import "./Navbar.css";  // ✅ מייבא את קובץ ה-CSS

export default function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // ✅ שליפת התראות מהשרת
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}/notifications`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` },
      });

      if (!response.ok) {
        console.error(`❌ Server error: ${response.status} - ${response.statusText}`);
        return;
      }

      const data = await response.json();
      setNotifications(data);

      // ✅ האם יש התראות שלא נקראו?
      const hasUnreadNotifications = data.some(n => !n.isRead);
      setHasUnread(hasUnreadNotifications); 

    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    }
  };

  // ✅ רץ כל 30 שניות לבדוק אם נוספו התראות חדשות
  useEffect(() => {
    if (user) {
      const checkForNewNotifications = async () => {
        await fetchNotifications();
      };

      checkForNewNotifications();

      const interval = setInterval(checkForNewNotifications, 30000);

      return () => clearInterval(interval);
    }
  }, [user]); // ✅ רץ מחדש כשהמשתמש משתנה

  // ✅ כאשר המשתמש פותח את ההתראות - סימון כנקרא
  const markNotificationsAsRead = async () => {
    try {
      await fetch(`/api/users/${user.id}/notifications/read`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` },
      });

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

      // ✅ אם אין יותר התראות חדשות, נסיר את העיגול
      setHasUnread(notifications.some(n => !n.isRead));

    } catch (error) {
      console.error("❌ Error marking notifications as read:", error);
    }
  };

  // ✅ התנתקות מהמערכת
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("readNotifications");
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
      {/* קישורי ניווט */}
      <div className="nav-links">
        <Link to="/">דף הבית</Link>
        <Link to="/recipes">כל המתכונים</Link>
        <Link to="/categories">קטגוריות</Link>
      </div>

      {/* אזור המשתמש */}
      <div className="user-area">
        {user ? (
          <>
            {/* אזור אישי */}
            <Link to="/dashboard">
              <img src={userIcon} alt="User" className="user-icon" />
            </Link>

            {/* התראות */}
            <div className="relative">
              <button onClick={() => {
                setShowDropdown(!showDropdown);
                if (!showDropdown) markNotificationsAsRead();
              }}>
                <img src={notificationIcon} alt="Notifications" className="notification-icon" />
                {hasUnread && <span className="notification-badge">{notifications.length}</span>}
              </button>
              {showDropdown && (
                <div className="notifications-dropdown">
                  {notifications.length > 0 ? notifications.map((notif, index) => (
                    <a key={index} href={notif.link}>{notif.message}</a>
                  )) : <p>אין התראות חדשות</p>}
                </div>
              )}
            </div>

            {/*  כפתור התנתקות */}
            <div className="relative">
              <p 
                className="logout-button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={handleLogout}
              >
                התנתקות
              </p>
              {showTooltip && <span className="tooltip tooltip-visible">התנתקות</span>}
            </div>

          </>
        ) : (
          <div className="relative">
            <Link to="/login">
              <img src={userIcon} alt="Login" className="user-icon" />
            </Link>
            {showTooltip && <span className="tooltip tooltip-visible">התחברות</span>}
          </div>
        )}
      </div>
    </nav>
  );
}
