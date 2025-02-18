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

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`http://localhost:8000/users/${user.id}/notifications`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` },
      });
  
      // 🔴 בדיקה אם השרת מחזיר שגיאה (401, 404, 500 וכו')
      if (!response.ok) {
        console.error(`❌ Server error: ${response.status} - ${response.statusText}`);
        return;
      }
  
      // 🔴 וידוא שהתשובה מגיעה בפורמט JSON תקין
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        setNotifications(data);
  
        // 🔴 בדיקה אם יש התראות לא נקראות
        const unread = data.some(notif => !notif.isRead);
        const wasReadBefore = localStorage.getItem("readNotifications") === "true";
        setHasUnread(unread && !wasReadBefore);
        
      } catch (jsonError) {
        console.error("❌ Failed to parse JSON:", jsonError);
        console.error("🔍 Server response was:", text);
      }
  
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    }
  };
  

  const markNotificationsAsRead = async () => {
    try {
      await fetch(`/api/users/${user.id}/notifications/read`, { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setHasUnread(false);
      localStorage.setItem("readNotifications", "true");
    } catch (error) {
      console.error("❌ Error marking notifications as read:", error);
    }
  };

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

            {/*  כפתור התנתקות*/}
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
