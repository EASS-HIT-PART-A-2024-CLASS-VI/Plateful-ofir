import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/UserContext";
import { useChat } from '../context/ChatContext';
import ChatDrawer from "../components/ChatDrawer";
import userIcon from "../assets/icons/user-image.png";  
import notificationIcon from "../assets/icons/notifi-image.png";  
import logophoto from "../assets/logo.png";  
import "./Navbar.css"; 

export default function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { openChat } = useChat();
  const chatDrawerRef = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
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
        console.log("📥 Notifications received from API:", data);  // 🔍 בדיקת המבנה

        setNotifications(data);
        setHasUnread(data.some(n => !n.isRead));
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
      const response = await fetch(`/api/users/${user.id}/notifications/read`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` }
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to delete read notifications");
      }

      // ✅ עדכון ה-state כדי להסיר את כל ההתראות המסומנות כנקראו
      setNotifications((prev) => prev.filter((n) => !n.isRead));
  } catch (error) {
      console.error("❌ Error deleting read notifications:", error);
  }
};

const handleNotificationClick = async (notificationId) => {
  if (!notificationId) {
      console.error("❌ Error: notificationId is undefined");
      return;
  }

  try {
      await fetch(`/api/users/${user.id}/notifications/${notificationId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` }
      });

      // ✅ עדכון ה־state כדי להעלים את ההתראה מידית
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
  } catch (error) {
      console.error("❌ Error deleting notification:", error);
  }
};


  // ✅ התנתקות מהמערכת
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("readNotifications");
    console.log("🔴 Logging out - Removing token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user_id");
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
      {/* קישורי ניווט */}
      <div className="nav-links">
        <Link to="/">דף הבית</Link>
        <Link to="/recipes">כל המתכונים</Link>
      </div>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link to="/">
          <img src={logophoto} alt="Logo" className="logo-photo" />
          </Link>
        </div>



      {/* אזור המשתמש */}
      <div className="user-area">
        <div className="flex items-center gap-6">
              <button
              onClick={() => openChat("איזה מצרכים יש לך?")}
              className="text-[#1D3557] hover:text-blue-700 transition-all"
            >
              🔍 מצא לי מתכון
            </button>

            <button
              onClick={() => openChat("איך אוכל לעזור לך? אשמח לענות על כל שאלה בנושא בישול ומתכונים.")}
              className="text-[#1D3557] hover:text-blue-700 transition-all"
            >
              💭 שאל שאלה
            </button>

        {/* ✅ צ'אט יחיד לכל הפעולות */}
        <ChatDrawer
          ref={chatDrawerRef}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        /> 
      </div>
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
                  {notifications.length > 0 ? notifications.map((notif) => (
                    <div key={notif.id} className="notification-item">
                      <a 
                        href={notif.link} 
                        onClick={(e) => {
                          e.preventDefault();  // 🔥 מונע מעבר מיידי לדף
                          handleNotificationClick(notif.id);  // ✅ שולח את ה-ID הנכון
                          console.log("🛠 Clicked notification ID:", notif.id); 
                          navigate(notif.link);  // ✅ מעביר את המשתמש לדף של ההתראה
                          console.log("User ID being sent:", user.id);
                          console.log("API URL:", `/api/users/${user.id}/notifications/read`);

                        }}
                      >
                        {notif.message}
                      </a>
                    </div>
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
