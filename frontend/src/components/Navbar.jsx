import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/UserContext";
import ChatDrawer from "../components/ChatDrawer";
import { useChat } from '../context/ChatContext';
import { useAuth } from "../context/UserContext";
import userIcon from "../assets/user-image.png";  
import notificationIcon from "../assets/notifi-image.png";  
import "./Navbar.css";  // ✅ מייבא את קובץ ה-CSS

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
        <Link to="/categories">קטגוריות</Link>
      </div>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link to="/">
            <img
              src="/Plateful_Logo_Ultra_High_Res.png"
              alt="Plateful Logo"
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>

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

          {user ? (
            <p onClick={handleLogout} className="text-[#E63946] hover:text-red-700 transition-all cursor-pointer">
              התנתקות
            </p>
          ) : (
            <Link to="/login" className="hover:text-[#1D3557] transition-all">התחברות</Link>
          )}
        </div>
      </nav>

      {/* ✅ צ'אט יחיד לכל הפעולות */}
      <ChatDrawer
        ref={chatDrawerRef}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        title="עוזר מתכונים"
      />
    </>
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
