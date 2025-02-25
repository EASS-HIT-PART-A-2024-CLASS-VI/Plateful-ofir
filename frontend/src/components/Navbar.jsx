import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/UserContext";
import { useChat } from "../context/ChatContext";
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

  // Fetch notifications from the server
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}/notifications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) {
        console.error(
          `Server error: ${response.status} - ${response.statusText}`
        );
        return;
      }
      const data = await response.json();
      console.log("Notifications received from API:", data);
      setNotifications(data);
      setHasUnread(data.some((n) => !n.isRead));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (user) {
      const checkForNewNotifications = async () => {
        await fetchNotifications();
      };

      checkForNewNotifications();
      const interval = setInterval(checkForNewNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Mark notifications as read when the dropdown is opened
  const markNotificationsAsRead = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}/notifications/read`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Failed to delete read notifications"
        );
      }
      // Remove notifications that are marked as read from the state
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch (error) {
      console.error("Error deleting read notifications:", error);
    }
  };

  // Handle click on a notification to delete it and navigate to its link
  const handleNotificationClick = async (notificationId) => {
    if (!notificationId) {
      console.error("Error: notificationId is undefined");
      return;
    }
    try {
      await fetch(`/api/users/${user.id}/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      // Remove the notification from state immediately
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Log the user out and remove tokens
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("readNotifications");
    console.log("Logging out - Removing token");
    localStorage.removeItem("user_id");
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
      {/* Navigation links */}
      <div className="nav-links">
        <Link to="/">דף הבית</Link>
        <Link to="/recipes">כל המתכונים</Link>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2">
        <Link to="/">
          <img src={logophoto} alt="Logo" className="logo-photo" />
        </Link>
      </div>

      {/* User area */}
      <div className="user-area">
        <div className="flex items-center gap-6">
          <button
            onClick={() => openChat("איזה מצרכים יש לך?")}
            className="text-[#1D3557] hover:text-blue-700 transition-all"
          >
            🔍 מצא לי מתכון
          </button>

          <button
            onClick={() =>
              openChat(
                "איך אוכל לעזור לך? אשמח לענות על כל שאלה בנושא בישול ומתכונים."
              )
            }
            className="text-[#1D3557] hover:text-blue-700 transition-all"
          >
            💭 שאל שאלה
          </button>

          {/* Chat drawer for all chat-related actions */}
          <ChatDrawer
            ref={chatDrawerRef}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
        {user ? (
          <>
            {/* Profile link */}
            <Link to="/dashboard">
              <img src={userIcon} alt="User" className="user-icon" />
            </Link>

            {/* Notifications area */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  if (!showDropdown) markNotificationsAsRead();
                }}
              >
                <img
                  src={notificationIcon}
                  alt="Notifications"
                  className="notification-icon"
                />
                {hasUnread && (
                  <span className="notification-badge">
                    {notifications.length}
                  </span>
                )}
              </button>
              {showDropdown && (
                <div className="notifications-dropdown">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif.id} className="notification-item">
                        <a
                          href={notif.link}
                          onClick={(e) => {
                            e.preventDefault(); // Prevent immediate navigation
                            handleNotificationClick(notif.id);
                            console.log("Clicked notification ID:", notif.id);
                            navigate(notif.link);
                            console.log("User ID being sent:", user.id);
                            console.log(
                              "API URL:",
                              `/api/users/${user.id}/notifications/read`
                            );
                          }}
                        >
                          {notif.message}
                        </a>
                      </div>
                    ))
                  ) : (
                    <p>אין התראות חדשות</p>
                  )}
                </div>
              )}
            </div>

            {/* Logout button */}
            <div className="relative">
              <p
                className="logout-button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={handleLogout}
              >
                התנתקות
              </p>
              {showTooltip && (
                <span className="tooltip tooltip-visible">התנתקות</span>
              )}
            </div>
          </>
        ) : (
          <div className="relative">
            <Link to="/login">
              <img src={userIcon} alt="Login" className="user-icon" />
            </Link>
            {showTooltip && (
              <span className="tooltip tooltip-visible">התחברות</span>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
