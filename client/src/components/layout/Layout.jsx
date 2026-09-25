import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { getCurrentUser } from "../../utils/authUtils";

function Layout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const notificationRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const navClass = ({ isActive }) =>
    `sidebar-link ${isActive ? "sidebar-link-active" : ""}`;

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true);

      const response = await api.get("/notifications");

      if (response.data?.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/notifications/unread-count");

      if (response.data?.success) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread notification count:", error);
    }
  };

  const loadNotificationData = async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount(),
    ]);
  };

  useEffect(() => {
    loadNotificationData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationToggle = async () => {
    const nextState = !showNotifications;

    setShowNotifications(nextState);

    if (nextState) {
      await loadNotificationData();
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      setUnreadCount((currentCount) =>
        Math.max(0, currentCount - 1)
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification._id);
    }

    setShowNotifications(false);

    if (notification.bug?._id) {
      navigate(`/bugs/${notification.bug._id}`);
    }
  };

  const formatNotificationTime = (createdAt) => {
    if (!createdAt) {
      return "";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();
    const differenceInSeconds = Math.floor(
      (now.getTime() - date.getTime()) / 1000
    );

    if (differenceInSeconds < 60) {
      return "Just now";
    }

    const differenceInMinutes = Math.floor(
      differenceInSeconds / 60
    );

    if (differenceInMinutes < 60) {
      return `${differenceInMinutes}m ago`;
    }

    const differenceInHours = Math.floor(
      differenceInMinutes / 60
    );

    if (differenceInHours < 24) {
      return `${differenceInHours}h ago`;
    }

    const differenceInDays = Math.floor(
      differenceInHours / 24
    );

    if (differenceInDays < 7) {
      return `${differenceInDays}d ago`;
    }

    return date.toLocaleDateString();
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">🐛</div>

          <div>
            <div className="brand-name">BugHunter</div>
            <div className="brand-subtitle">QA Management</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Workspace</div>

            <NavLink to="/dashboard" className={navClass}>
              <span className="nav-icon">▦</span>
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/bugs" className={navClass}>
              <span className="nav-icon">🐞</span>
              <span>Bugs</span>
            </NavLink>

            <NavLink to="/test-cases" className={navClass}>
              <span className="nav-icon">✓</span>
              <span>Test Cases</span>
            </NavLink>

            <NavLink to="/projects" className={navClass}>
              <span className="nav-icon">▣</span>
              <span>Projects</span>
            </NavLink>
          </div>

          {(user?.role === "admin" || user?.role === "manager") && (
            <div className="nav-section">
              <div className="nav-section-title">Management</div>

              <NavLink to="/users" className={navClass}>
                <span className="nav-icon">♙</span>
                <span>Users</span>
              </NavLink>

              <NavLink to="/invitations" className={navClass}>
                <span className="nav-icon">✉</span>
                <span>Invitations</span>
              </NavLink>
            </div>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-divider" />

          <button
            className="sidebar-settings"
            type="button"
            onClick={() => alert("Settings will be available soon.")}
          >
            <span className="nav-icon">⚙</span>
            <span>Settings</span>
          </button>

          <div className="sidebar-user">
            <div className="user-avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.name || "User"}
              </div>

              <div className="sidebar-user-role">
                {user?.role || "User"}
              </div>
            </div>

            <button
              type="button"
              className="logout-icon"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">BugHunter</div>
          </div>

          <div className="topbar-right">
            <div
              className="notification-wrapper"
              ref={notificationRef}
            >
              <button
                type="button"
                className="notification-button"
                title="Notifications"
                aria-label="Notifications"
                onClick={handleNotificationToggle}
              >
                🔔

                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <div>
                      <div className="notification-title">
                        Notifications
                      </div>

                      <div className="notification-subtitle">
                        {unreadCount > 0
                          ? `${unreadCount} unread`
                          : "You're all caught up"}
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="notification-mark-all"
                        onClick={handleMarkAllAsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="notification-list">
                    {notificationLoading ? (
                      <div className="notification-empty">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="notification-empty">
                        <div className="notification-empty-icon">
                          🔔
                        </div>

                        <div className="notification-empty-title">
                          No notifications
                        </div>

                        <div className="notification-empty-text">
                          You're all caught up.
                        </div>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification._id}
                          type="button"
                          className={`notification-item ${
                            notification.read
                              ? ""
                              : "notification-item-unread"
                          }`}
                          onClick={() =>
                            handleNotificationClick(notification)
                          }
                        >
                          <div className="notification-item-icon">
                            {notification.type === "bug_assigned"
                              ? "🐞"
                              : "🔔"}
                          </div>

                          <div className="notification-item-content">
                            <div className="notification-item-top">
                              <span className="notification-item-title">
                                {notification.title}
                              </span>

                              {!notification.read && (
                                <span className="notification-unread-dot" />
                              )}
                            </div>

                            <div className="notification-item-message">
                              {notification.message}
                            </div>

                            <div className="notification-item-time">
                              {formatNotificationTime(
                                notification.createdAt
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="topbar-user">
              <div className="topbar-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>

              <div className="topbar-user-details">
                <span className="topbar-user-name">
                  {user?.name || "User"}
                </span>

                <span className="topbar-user-role">
                  {user?.role || "User"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
